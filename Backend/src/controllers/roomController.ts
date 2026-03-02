import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middlewares/errorHandler";
import { Prisma } from "@prisma/client";

import { prisma } from "../prisma/client";
import { ezeeService } from "../services/ezee.service";
import { roomService } from "../services/roomService";

const roomCache: any = (prisma as any).roomCache;

const isoToday = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDaysIso = (iso: string, days: number) => {
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime())) return iso;
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeIsoDateQuery = (value: unknown, fallbackIso: string) => {
  const s = String(value ?? "").trim();
  if (!s) return fallbackIso;
  const iso = s.includes("T") ? s.slice(0, 10) : s;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : fallbackIso;
};

const toInt = (value: unknown, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
};

// Helper to extract price per night, preferring exclusive_tax for CP
const extractPricePerNight = (r: any): number => {
  // If this is a CP room, try to use exclusive_tax
  if (r.Room_Name && r.Room_Name.toUpperCase().includes('CP') && r.room_rates_info?.exclusive_tax) {
    const exclusiveTaxObj = r.room_rates_info.exclusive_tax;
    if (typeof exclusiveTaxObj === "object") {
      const values = Object.values(exclusiveTaxObj)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) {
        // Average the exclusive_tax values for all nights
        const avgPrice = values.reduce((a, b) => a + b, 0) / values.length;
        console.debug('[DEBUG] extractPricePerNight using exclusive_tax average for CP', { room: r.Room_Name, values, avgPrice });
        return avgPrice;
      }
    }
  }
  // Fallback to avg_price_per_night
  return Number(r.avg_price_per_night ?? 0);
};

// Helper to get active global flat promo
const getActiveGlobalFlatPromo = async () => {
  return await (prisma as any).promoCode.findFirst({
    where: {
      promoScope: 'GLOBAL_FLAT',
      isGlobalActive: true,
    },
    select: {
      id: true,
      discountValue: true,
    },
  });
};

// Apply global flat discount to a room price
const applyGlobalFlatDiscount = (originalPrice: number, promo: any) => {
  if (!promo || !promo.discountValue) return { originalPrice, discountAmount: 0, finalPrice: originalPrice, promoApplied: false };
  const discountAmount = Number(promo.discountValue);
  const finalPrice = Math.max(originalPrice - discountAmount, 0);
  return { originalPrice, discountAmount, finalPrice, promoApplied: true };
};

const toRoomPayloadFromCache = (r: any) => {
  return {
    roomtypeunkid: String(r.roomtypeunkid),
    Room_Name: String(r.roomName ?? ""),
    Room_Description: String(r.description ?? ""),
    max_adult_occupancy: Number(r.maxAdult ?? 0),
    max_child_occupancy: Number(r.maxChild ?? 0),
    available_rooms: Number(r.availableRooms ?? 0),
    avg_price_per_night: Number(r.pricePerNight ?? 0),
    total_price: Number(r.totalPrice ?? 0),
    currency_sign: String(r.currency ?? ""),
    RoomAmenities: String(r.amenities ?? ""),
    room_main_image: r.imageUrl ? String(r.imageUrl) : undefined,
  };
};

export const roomController = {
  list: asyncHandler(async (req, res) => {
    const today = isoToday();
    const checkIn = normalizeIsoDateQuery(req.query.checkIn, today);
    const checkOut = normalizeIsoDateQuery(req.query.checkOut, addDaysIso(checkIn, 1));
    const adults = toInt(req.query.adults, 1);
    const children = toInt(req.query.children, 0);
    const rooms = toInt(req.query.rooms, 1);

    try {
      const list = await ezeeService.fetchRoomList({
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
      });

      // Fetch active global flat promo once
      const globalFlatPromo = await getActiveGlobalFlatPromo();

      await Promise.all(
        list.map(async (r) => {
          let roomtypeunkid: bigint;
          try {
            roomtypeunkid = BigInt(String(r.roomtypeunkid));
          } catch {
            return;
          }

          const pricePerNight = extractPricePerNight(r);
              const nights = toInt(req.query.nights, 1);
              await roomCache.upsert({
                where: { roomtypeunkid },
                create: {
                  roomtypeunkid,
                  roomName: r.Room_Name,
                  description: r.Room_Description,
                  maxAdult: r.max_adult_occupancy,
                  maxChild: r.max_child_occupancy,
                  amenities: r.RoomAmenities,
                  pricePerNight: new Prisma.Decimal(String(pricePerNight)),
                  totalPrice: new Prisma.Decimal(String(pricePerNight * nights)),
                  currency: r.currency_sign,
                  availableRooms: r.available_rooms,
                  imageUrl: r.room_main_image ?? null,
                },
                update: {
                  roomName: r.Room_Name,
                  description: r.Room_Description,
                  maxAdult: r.max_adult_occupancy,
                  maxChild: r.max_child_occupancy,
                  amenities: r.RoomAmenities,
                  pricePerNight: new Prisma.Decimal(String(pricePerNight)),
                  totalPrice: new Prisma.Decimal(String(pricePerNight * nights)),
                  currency: r.currency_sign,
                  availableRooms: r.available_rooms,
                  imageUrl: r.room_main_image ?? null,
                },
              } as any);
        })
      );

      // Apply global flat discount to each room if active
      const roomsWithDiscount = list.map((room) => {
        const pricePerNight = extractPricePerNight(room);
        const nights = toInt(req.query.nights, 1);
        const totalOriginalPrice = pricePerNight * nights;
        const { originalPrice: orig, discountAmount, finalPrice, promoApplied } = applyGlobalFlatDiscount(pricePerNight, globalFlatPromo);
        return {
          ...room,
          pricePerNight,
          totalPrice: totalOriginalPrice,
          original_price: orig,
          discount_amount: discountAmount,
          final_price: finalPrice,
          promo_applied: promoApplied,
        };
      });

      res.json({ ok: true, data: { rooms: roomsWithDiscount } });
    } catch (err: any) {
      const cached = await roomCache.findMany({ orderBy: { createdAt: "desc" } });
      if (cached.length > 0) {
        const roomsFromCache = cached.map(toRoomPayloadFromCache);
        // Fetch active global flat promo and apply to cached rooms as well
        const globalFlatPromo = await getActiveGlobalFlatPromo();
        const roomsWithDiscount = roomsFromCache.map((room: any) => {
          // Use cached totalPrice or calculate from pricePerNight * nights
          const nights = toInt(req.query.nights, 1);
          const pricePerNight = Number(room.avg_price_per_night ?? room.pricePerNight ?? 0);
          const totalOriginalPrice = pricePerNight * nights;
          const { originalPrice: orig, discountAmount, finalPrice, promoApplied } = applyGlobalFlatDiscount(pricePerNight, globalFlatPromo);
          return {
            ...room,
            pricePerNight,
            totalPrice: totalOriginalPrice,
            original_price: orig,
            discount_amount: discountAmount,
            final_price: finalPrice,
            promo_applied: promoApplied,
          };
        });
        res.status(200).json({ ok: true, data: { rooms: roomsWithDiscount }, meta: { cached: true } });
        return;
      }
      // If no cache, return a static fallback with checkdata.json-like structure
      const fallbackRooms = [
        {
          roomtypeunkid: "4692400000000000001",
          Room_Name: "Deluxe Studio Suite - CP",
          Room_Description: "Deluxe Studio Suite - CP",
          max_adult_occupancy: 4,
          max_child_occupancy: 2,
          available_rooms: 10,
          avg_price_per_night: 2800,
          total_price: 2800,
          currency_sign: "₹",
          RoomAmenities: "WiFi, AC, TV",
          room_rates_info: {
            exclusive_tax: { "2026-03-05": "2800.0000", "2026-03-06": "3500.0000" }
          }
        },
        // Add other rooms as needed from checkdata.json
      ];
      const globalFlatPromo = await getActiveGlobalFlatPromo();
      const roomsWithDiscount = fallbackRooms.map((room) => {
        const pricePerNight = extractPricePerNight(room);
        const nights = toInt(req.query.nights, 1);
        const totalOriginalPrice = pricePerNight * nights;
        const { originalPrice: orig, discountAmount, finalPrice, promoApplied } = applyGlobalFlatDiscount(pricePerNight, globalFlatPromo);
        return {
          ...room,
          pricePerNight,
          totalPrice: totalOriginalPrice,
          original_price: orig,
          discount_amount: discountAmount,
          final_price: finalPrice,
          promo_applied: promoApplied,
        };
      });
      res.status(200).json({ ok: true, data: { rooms: roomsWithDiscount }, meta: { cached: false, fallback: true } });
      return;
    }
  }),

  listRaw: asyncHandler(async (req, res) => {
    const today = isoToday();
    const checkIn = normalizeIsoDateQuery(req.query.checkIn, today);
    const checkOut = normalizeIsoDateQuery(req.query.checkOut, addDaysIso(checkIn, 1));
    const adults = toInt(req.query.adults, 1);
    const children = toInt(req.query.children, 0);
    const rooms = toInt(req.query.rooms, 1);

    try {
      const list = await ezeeService.fetchRoomListRaw({
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
      });

      res.json({ success: true, rooms: list });
    } catch (err: any) {
      console.error("Failed to fetch raw room list:", err);
      if (err instanceof HttpError) {
        res.status(err.statusCode).json({
          success: false,
          rooms: [],
          error: err.message,
          message: err.message,
        });
        return;
      }

      res.status(502).json({
        success: false,
        rooms: [],
        error: "Failed to fetch room list",
        message: "Unable to retrieve live rooms from eZee API",
      });
    }
  }),

  getById: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid room id");

    const room = await roomService.getById(id);
    if (!room) throw new HttpError(404, "Room not found");

    const r: any = room as any;

    res.json({
      ok: true,
      id: r.id,
      title: r.title,
      description: r.description,
      pricePerNight: r.pricePerNight,
      epPricePerNight: r.epPricePerNight ?? null,
      cpPricePerNight: r.cpPricePerNight ?? null,
      mapPricePerNight: r.mapPricePerNight ?? null,
      person: r.person,
      availableRooms: r.availableRooms ?? 0,
      amenities: (r.amenities ?? []).map((a: any) => a.name),
      images: (r.images ?? []).map((i: any) => i.url),
    });
  }),

  getPrices: asyncHandler(async (req, res) => {
    const today = isoToday();
    const checkIn = normalizeIsoDateQuery(req.query.checkIn, today);
    const checkOut = normalizeIsoDateQuery(req.query.checkOut, addDaysIso(checkIn, 1));
    const adults = toInt(req.query.adults, 1);
    const children = toInt(req.query.children, 0);
    const rooms = toInt(req.query.rooms, 1);

    try {
      const list = await ezeeService.fetchRoomList({
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
      });

      const roomPrices = list.map((r) => ({
        roomType: r.Room_Name,
        price: r.avg_price_per_night,
        currency: r.currency_sign || "INR",
        availability: r.available_rooms,
      }));

      res.json({
        success: true,
        rooms: roomPrices,
      });
    } catch (err: any) {
      console.error("Failed to fetch room prices:", err);
      res.status(502).json({
        success: false,
        error: "Failed to fetch room prices",
        message: "Unable to retrieve live prices from eZee API",
      });
    }
  }),
};
