"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const errorHandler_1 = require("../middlewares/errorHandler");
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const ezee_service_1 = require("../services/ezee.service");
const roomService_1 = require("../services/roomService");
const roomCache = client_2.prisma.roomCache;
const isoToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};
const addDaysIso = (iso, days) => {
    const dt = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime()))
        return iso;
    dt.setUTCDate(dt.getUTCDate() + days);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};
const normalizeIsoDateQuery = (value, fallbackIso) => {
    const s = String(value ?? "").trim();
    if (!s)
        return fallbackIso;
    const iso = s.includes("T") ? s.slice(0, 10) : s;
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : fallbackIso;
};
const toInt = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.trunc(n);
};
// Helper to extract price per night with enhanced logic matching ezee.service.ts
const extractPricePerNight = (r, checkIn, checkOut, nights) => {
    // Enhanced price extraction logic matching ezee.service.ts
    const rateInfo = r?.room_rates_info || {};
    const extractAvgFromDayWise = (dayWise) => {
        if (!dayWise)
            return 0;
        if (Array.isArray(dayWise)) {
            const values = dayWise
                .map((v) => Number(v))
                .filter((v) => Number.isFinite(v) && v > 0);
            if (values.length === 0)
                return 0;
            return values.reduce((a, b) => a + b, 0) / values.length;
        }
        if (typeof dayWise === "object") {
            const values = Object.values(dayWise)
                .map((v) => Number(v))
                .filter((v) => Number.isFinite(v) && v > 0);
            if (values.length === 0)
                return 0;
            return values.reduce((a, b) => a + b, 0) / values.length;
        }
        return 0;
    };
    console.log(`[DEBUG] extractPricePerNight for room: ${r.Room_Name}`, {
        day_wise_beforediscount: rateInfo.day_wise_beforediscount,
        rack_rate: rateInfo.rack_rate,
        avg_price_per_night: r.avg_price_per_night,
        avg_per_night_after_discount: rateInfo.avg_per_night_after_discount,
        totalprice_inclusive_all: rateInfo.totalprice_inclusive_all,
        exclusive_tax: rateInfo.exclusive_tax,
    });
    // PRIORITIZE day_wise_beforediscount as primary price source
    let price = 0;
    const dayWiseBeforeDiscount = extractAvgFromDayWise(rateInfo.day_wise_beforediscount);
    if (Number.isFinite(dayWiseBeforeDiscount) && dayWiseBeforeDiscount > 0) {
        price = dayWiseBeforeDiscount;
        console.log(`[DEBUG] Using day_wise_beforediscount (avg): ${price}`);
    }
    else if (rateInfo.avg_per_night_after_discount) {
        price = Number(rateInfo.avg_per_night_after_discount);
        console.log(`[DEBUG] Using avg_per_night_after_discount: ${price}`);
    }
    else if (rateInfo.avg_per_night_before_discount) {
        price = Number(rateInfo.avg_per_night_before_discount);
        console.log(`[DEBUG] Using avg_per_night_before_discount: ${price}`);
    }
    else if (rateInfo.totalprice_inclusive_all && nights && nights > 0) {
        price = Number(rateInfo.totalprice_inclusive_all) / nights;
        console.log(`[DEBUG] Using totalprice_inclusive_all / nights: ${rateInfo.totalprice_inclusive_all} / ${nights} = ${price}`);
    }
    else if (rateInfo.totalprice_room_only && nights && nights > 0) {
        price = Number(rateInfo.totalprice_room_only) / nights;
        console.log(`[DEBUG] Using totalprice_room_only / nights: ${rateInfo.totalprice_room_only} / ${nights} = ${price}`);
    }
    else if (rateInfo.exclusive_tax && typeof rateInfo.exclusive_tax === "object") {
        // Handle case where exclusive_tax is an object with date keys
        const taxValues = Object.values(rateInfo.exclusive_tax)
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v) && v > 0);
        if (taxValues.length > 0) {
            price = taxValues[0]; // Use first night's price
            console.log(`[DEBUG] Using exclusive_tax value: ${price}`);
        }
    }
    else if (rateInfo.rack_rate) {
        price = Number(rateInfo.rack_rate);
        console.log(`[DEBUG] Using fallback rack_rate: ${price}`);
    }
    // Final fallback to original avg_price_per_night
    if (price === 0) {
        price = Number(r.avg_price_per_night ?? 0);
        console.log(`[DEBUG] Using fallback avg_price_per_night: ${price}`);
    }
    console.log(`[DEBUG] Final extracted price: ${price}`);
    return price;
};
// Helper to get active global flat promo
const getActiveGlobalFlatPromo = async () => {
    return await client_2.prisma.promoCode.findFirst({
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
const applyGlobalFlatDiscount = (originalPrice, promo) => {
    if (!promo || !promo.discountValue)
        return { originalPrice, discountAmount: 0, finalPrice: originalPrice, promoApplied: false };
    const discountAmount = Number(promo.discountValue);
    const finalPrice = Math.max(originalPrice - discountAmount, 0);
    return { originalPrice, discountAmount, finalPrice, promoApplied: true };
};
const toRoomPayloadFromCache = (r) => {
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
exports.roomController = {
    list: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const today = isoToday();
        const checkIn = normalizeIsoDateQuery(req.query.checkIn, today);
        const checkOut = normalizeIsoDateQuery(req.query.checkOut, addDaysIso(checkIn, 1));
        const adults = toInt(req.query.adults, 1);
        const children = toInt(req.query.children, 0);
        const rooms = toInt(req.query.rooms, 1);
        try {
            const list = await ezee_service_1.ezeeService.fetchRoomList({
                checkIn,
                checkOut,
                adults,
                children,
                rooms,
            });
            // Fetch active global flat promo once
            const globalFlatPromo = await getActiveGlobalFlatPromo();
            const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
            await Promise.all(list.map(async (r) => {
                let roomtypeunkid;
                try {
                    roomtypeunkid = BigInt(String(r.roomtypeunkid));
                }
                catch {
                    return;
                }
                const pricePerNight = extractPricePerNight(r, checkIn, checkOut, nights);
                await roomCache.upsert({
                    where: { roomtypeunkid },
                    create: {
                        roomtypeunkid,
                        roomName: r.Room_Name,
                        description: r.Room_Description,
                        maxAdult: r.max_adult_occupancy,
                        maxChild: r.max_child_occupancy,
                        amenities: r.RoomAmenities,
                        pricePerNight: new client_1.Prisma.Decimal(String(pricePerNight)),
                        totalPrice: new client_1.Prisma.Decimal(String(pricePerNight * nights)),
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
                        pricePerNight: new client_1.Prisma.Decimal(String(pricePerNight)),
                        totalPrice: new client_1.Prisma.Decimal(String(pricePerNight * nights)),
                        currency: r.currency_sign,
                        availableRooms: r.available_rooms,
                        imageUrl: r.room_main_image ?? null,
                    },
                });
            }));
            // Apply global flat discount to each room if active
            const roomsWithDiscount = list.map((room) => {
                const pricePerNight = extractPricePerNight(room, checkIn, checkOut, nights);
                const totalOriginalPrice = pricePerNight * nights;
                const { originalPrice: orig, discountAmount, finalPrice, promoApplied } = applyGlobalFlatDiscount(pricePerNight, globalFlatPromo);
                return {
                    ...room,
                    pricePerNight,
                    avg_price_per_night: pricePerNight, // Add this field for frontend compatibility
                    totalPrice: totalOriginalPrice,
                    original_price: orig,
                    discount_amount: discountAmount,
                    final_price: finalPrice,
                    promo_applied: promoApplied,
                    day_wise_beforediscount: room?.room_rates_info?.day_wise_beforediscount ?? null,
                    // Include rack_rate fields for frontend EP/CP/MAP pricing
                    rack_rate: room.rack_rate,
                    rack_rate_adult: room.rack_rate_adult,
                    rack_rate_child: room.rack_rate_child,
                };
            });
            // Return the real eZee rooms directly — the API already provides EP, CP, MAP, AP variants
            res.json({ ok: true, data: { rooms: roomsWithDiscount } });
        }
        catch (err) {
            const cached = await roomCache.findMany({ orderBy: { createdAt: "desc" } });
            if (cached.length > 0) {
                const roomsFromCache = cached.map(toRoomPayloadFromCache);
                // Fetch active global flat promo and apply to cached rooms as well
                const globalFlatPromo = await getActiveGlobalFlatPromo();
                const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
                const roomsWithDiscount = roomsFromCache.map((room) => {
                    // Use cached totalPrice or calculate from pricePerNight * nights
                    const pricePerNight = extractPricePerNight(room, checkIn, checkOut, nights);
                    const totalOriginalPrice = pricePerNight * nights;
                    const { originalPrice: orig, discountAmount, finalPrice, promoApplied } = applyGlobalFlatDiscount(pricePerNight, globalFlatPromo);
                    return {
                        ...room,
                        pricePerNight,
                        avg_price_per_night: pricePerNight, // Add this field for frontend compatibility
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
                    Room_Name: "Deluxe Studio Suite - EP",
                    Room_Description: "Deluxe Studio Suite - EP",
                    max_adult_occupancy: 4,
                    max_child_occupancy: 2,
                    available_rooms: 10,
                    avg_price_per_night: 4275,
                    total_price: 4275,
                    currency_sign: "₹",
                    RoomAmenities: "WiFi, AC, TV",
                    rack_rate: 4500,
                    day_wise_beforediscount: ["4275.0000"],
                    room_rates_info: {
                        exclusive_tax: { "2026-03-05": "4275.0000", "2026-03-06": "4275.0000" },
                        rack_rate: "4500.0000",
                        day_wise_beforediscount: ["4275.0000"]
                    }
                },
                {
                    roomtypeunkid: "4692400000000000002",
                    Room_Name: "Deluxe Studio Suite - CP",
                    Room_Description: "Deluxe Studio Suite - CP",
                    max_adult_occupancy: 4,
                    max_child_occupancy: 2,
                    available_rooms: 10,
                    avg_price_per_night: 4775,
                    total_price: 4775,
                    currency_sign: "₹",
                    RoomAmenities: "WiFi, AC, TV, Breakfast",
                    rack_rate: 5000,
                    day_wise_beforediscount: ["4775.0000"],
                    room_rates_info: {
                        exclusive_tax: { "2026-03-05": "4775.0000", "2026-03-06": "4775.0000" },
                        rack_rate: "5000.0000",
                        day_wise_beforediscount: ["4775.0000"]
                    }
                },
                {
                    roomtypeunkid: "4692400000000000003",
                    Room_Name: "Presidentail Suite - EP",
                    Room_Description: "Presidentail Suite - EP",
                    max_adult_occupancy: 6,
                    max_child_occupancy: 2,
                    available_rooms: 5,
                    avg_price_per_night: 11875,
                    total_price: 11875,
                    currency_sign: "₹",
                    RoomAmenities: "WiFi, AC, TV, Living Area",
                    rack_rate: 12500,
                    day_wise_beforediscount: ["11875.0000"],
                    room_rates_info: {
                        exclusive_tax: { "2026-03-05": "11875.0000", "2026-03-06": "11875.0000" },
                        rack_rate: "12500.0000",
                        day_wise_beforediscount: ["11875.0000"]
                    }
                },
                {
                    roomtypeunkid: "4692400000000000004",
                    Room_Name: "DELUXE EDGE VIEW EP",
                    Room_Description: "DELUXE EDGE VIEW EP",
                    max_adult_occupancy: 3,
                    max_child_occupancy: 2,
                    available_rooms: 8,
                    avg_price_per_night: 5225,
                    total_price: 5225,
                    currency_sign: "₹",
                    RoomAmenities: "WiFi, AC, TV, View",
                    rack_rate: 5500,
                    day_wise_beforediscount: ["5225.0000"],
                    room_rates_info: {
                        exclusive_tax: { "2026-03-05": "5225.0000", "2026-03-06": "5225.0000" },
                        rack_rate: "5500.0000",
                        day_wise_beforediscount: ["5225.0000"]
                    }
                },
                {
                    roomtypeunkid: "4692400000000000005",
                    Room_Name: "Lotus Family Suite - EP",
                    Room_Description: "Lotus Family Suite - EP",
                    max_adult_occupancy: 6,
                    max_child_occupancy: 4,
                    available_rooms: 5,
                    avg_price_per_night: 7500,
                    total_price: 7500,
                    currency_sign: "₹",
                    RoomAmenities: "WiFi, AC, TV, Kitchen, Living Area",
                    rack_rate: 8000,
                    day_wise_beforediscount: ["7500.0000"],
                    room_rates_info: {
                        exclusive_tax: { "2026-03-05": "7500.0000", "2026-03-06": "7500.0000" },
                        rack_rate: "8000.0000",
                        day_wise_beforediscount: ["7500.0000"]
                    }
                }
            ];
            const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
            const globalFlatPromo = await getActiveGlobalFlatPromo();
            const roomsWithDiscount = fallbackRooms.map((room) => {
                const pricePerNight = extractPricePerNight(room, checkIn, checkOut, nights);
                const totalOriginalPrice = pricePerNight * nights;
                const { originalPrice: orig, discountAmount, finalPrice, promoApplied } = applyGlobalFlatDiscount(pricePerNight, globalFlatPromo);
                return {
                    ...room,
                    pricePerNight,
                    avg_price_per_night: pricePerNight, // Add this field for frontend compatibility
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
    listRaw: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const today = isoToday();
        const checkIn = normalizeIsoDateQuery(req.query.checkIn, today);
        const checkOut = normalizeIsoDateQuery(req.query.checkOut, addDaysIso(checkIn, 1));
        const adults = toInt(req.query.adults, 1);
        const children = toInt(req.query.children, 0);
        const rooms = toInt(req.query.rooms, 1);
        try {
            const list = await ezee_service_1.ezeeService.fetchRoomListRaw({
                checkIn,
                checkOut,
                adults,
                children,
                rooms,
            });
            res.json({ success: true, rooms: list });
        }
        catch (err) {
            console.error("Failed to fetch raw room list:", err);
            if (err instanceof errorHandler_1.HttpError) {
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
    getById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            throw new errorHandler_1.HttpError(400, "Invalid room id");
        const room = await roomService_1.roomService.getById(id);
        if (!room)
            throw new errorHandler_1.HttpError(404, "Room not found");
        const r = room;
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
            amenities: (r.amenities ?? []).map((a) => a.name),
            images: (r.images ?? []).map((i) => i.url),
        });
    }),
    getPrices: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const today = isoToday();
        const checkIn = normalizeIsoDateQuery(req.query.checkIn, today);
        const checkOut = normalizeIsoDateQuery(req.query.checkOut, addDaysIso(checkIn, 1));
        const adults = toInt(req.query.adults, 1);
        const children = toInt(req.query.children, 0);
        const rooms = toInt(req.query.rooms, 1);
        try {
            const list = await ezee_service_1.ezeeService.fetchRoomList({
                checkIn,
                checkOut,
                adults,
                children,
                rooms,
            });
            const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
            const roomPrices = list.map((r) => ({
                roomType: r.Room_Name,
                price: extractPricePerNight(r, checkIn, checkOut, nights),
                currency: r.currency_sign || "INR",
                availability: r.available_rooms,
            }));
            res.json({
                success: true,
                rooms: roomPrices,
            });
        }
        catch (err) {
            console.error("Failed to fetch room prices:", err);
            res.status(502).json({
                success: false,
                error: "Failed to fetch room prices",
                message: "Unable to retrieve live prices from eZee API",
            });
        }
    }),
};
