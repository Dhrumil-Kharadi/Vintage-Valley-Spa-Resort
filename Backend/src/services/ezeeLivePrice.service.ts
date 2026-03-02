import axios, { AxiosError } from "axios";
import { env } from "../config/env";
import { HttpError } from "../middlewares/errorHandler";

export type EzeeLivePriceRoom = {
  roomtypeunkid: string;
  Room_Name: string;
  Roomtype_Name?: string;
  Roomtype?: string;
  Room_Description: string;
  max_adult_occupancy: number;
  max_child_occupancy: number;
  available_rooms: number;
  avg_price_per_night: number;
  total_price: number;
  currency_sign: string;
  RoomAmenities: string;
  room_main_image?: string;
  extra_child_rates_info?: any;
  extra_adult_rates_info?: any;
  room_rates_info?: any;
};

const toIsoDateOnly = (value: string) => {
  const s = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const dt = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime())) return null;
  return s;
};

const dateDiffNights = (checkInIso: string, checkOutIso: string) => {
  const a = new Date(`${checkInIso}T00:00:00.000Z`).getTime();
  const b = new Date(`${checkOutIso}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const ms = b - a;
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const toInt = (value: unknown, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
};

const mapEzeeErrorToHttpError = (payload: any) => {
  const raw = String(payload?.Error ?? payload?.error ?? payload?.message ?? "");
  const code = String(payload?.ErrorCode ?? payload?.errorcode ?? "");
  const combined = `${code} ${raw}`.trim();

  if (combined.toLowerCase().includes("hotelcodeempty")) {
    return new HttpError(400, "HotelCodeEmpty");
  }
  if (combined.toLowerCase().includes("unauthreq") || combined.toLowerCase().includes("unauthorized")) {
    return new HttpError(401, "UNAUTHREQ");
  }
  if (combined.toLowerCase().includes("nightslimitexceeded")) {
    return new HttpError(400, "NightsLimitExceeded");
  }
  if (combined.toLowerCase().includes("datenotvalid") || combined.toLowerCase().includes("date not valid")) {
    return new HttpError(400, "DateNotvalid");
  }
  if (combined.toLowerCase().includes("noresacc")) {
    return new HttpError(502, "eZee reservation account not configured or invalid credentials");
  }

  // Handle Error Details structure
  const errorDetails = payload?.["Error Details"];
  if (errorDetails) {
    const errorCode = String(errorDetails?.Error_Code ?? "");
    const errorMessage = String(errorDetails?.Error_Message ?? "");
    const combinedDetails = `${errorCode} ${errorMessage}`.trim();
    if (combinedDetails.toLowerCase().includes("noresacc")) {
      return new HttpError(502, "NORESACC");
    }
    if (errorMessage) {
      return new HttpError(502, errorMessage || "Failed to fetch room availability");
    }
  }

  return new HttpError(502, raw || "Failed to fetch room availability");
};

function getMockRoomData(): EzeeLivePriceRoom[] {
  return [
    {
      roomtypeunkid: "1",
      Room_Name: "Deluxe Studio Suite",
      Room_Description: "Our Deluxe Studio Suite offers the perfect blend of modern luxury and natural serenity. Featuring contemporary amenities, panoramic views, and thoughtful design elements that create an atmosphere of sophisticated relaxation.",
      max_adult_occupancy: 2,
      max_child_occupancy: 1,
      available_rooms: 5,
      avg_price_per_night: 4200,
      total_price: 4200,
      currency_sign: "INR",
      RoomAmenities: "WiFi, AC, TV, Mini Bar, Private Balcony",
      room_main_image: undefined,
    },
    {
      roomtypeunkid: "2",
      Room_Name: "Deluxe Edge View",
      Room_Description: "Rooms with stunning front-facing views, offering elevated comfort and a refined aesthetic. Positioned at the corner edge of each floor for enhanced privacy and scenic visibility.",
      max_adult_occupancy: 2,
      max_child_occupancy: 1,
      available_rooms: 3,
      avg_price_per_night: 4600,
      total_price: 4600,
      currency_sign: "INR",
      RoomAmenities: "WiFi, AC, TV, Mini Bar, Edge Views, Private Balcony",
      room_main_image: undefined,
    },
    {
      roomtypeunkid: "3",
      Room_Name: "Lotus Family Suite",
      Room_Description: "The Lotus Family Suite provides generous space and premium comfort for larger groups. With separate living areas, premium furnishings, and spectacular views, it offers the perfect setting for memorable family gatherings.",
      max_adult_occupancy: 4,
      max_child_occupancy: 2,
      available_rooms: 2,
      avg_price_per_night: 8200,
      total_price: 8200,
      currency_sign: "INR",
      RoomAmenities: "WiFi, AC, TV, Mini Bar, Master Room with Bath Tub, Panoramic Views, Private Balcony",
      room_main_image: undefined,
    },
    {
      roomtypeunkid: "4",
      Room_Name: "Presidential Suite",
      Room_Description: "The Presidential Suite represents the pinnacle of luxury accommodation. Featuring exclusive amenities, private spaces, and unparalleled views, this suite offers an extraordinary retreat for discerning guests.",
      max_adult_occupancy: 4,
      max_child_occupancy: 2,
      available_rooms: 1,
      avg_price_per_night: 9500,
      total_price: 9500,
      currency_sign: "INR",
      RoomAmenities: "WiFi, AC, TV, Mini Bar, Both Bathrooms Attached, Master Bath with Bathtub, Private Balcony, Tea/Coffee Maker",
      room_main_image: undefined,
    },
  ];
}

export const ezeeLivePriceService = {
  async fetchLivePrices(params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    rooms: number;
  }): Promise<EzeeLivePriceRoom[]> {
    if (!env.EZEE_BASE_URL || !env.EZEE_HOTEL_CODE || !env.EZEE_API_KEY) {
      throw new HttpError(500, "eZee configuration missing");
    }

    const checkIn = toIsoDateOnly(params.checkIn);
    const checkOut = toIsoDateOnly(params.checkOut);
    if (!checkIn || !checkOut) throw new HttpError(400, "DateNotvalid");

    const nights = dateDiffNights(checkIn, checkOut);
    if (nights <= 0) throw new HttpError(400, "DateNotvalid");
    if (nights > 30) throw new HttpError(400, "NightsLimitExceeded");

    const adults = toInt(params.adults, 1);
    const children = toInt(params.children, 0);
    const numRooms = toInt(params.rooms, 1);

    if (adults < 1) throw new HttpError(400, "adults must be >= 1");
    if (children < 0) throw new HttpError(400, "children must be >= 0");
    if (numRooms < 1) throw new HttpError(400, "rooms must be >= 1");

    const url = new URL("booking/reservation_api/listing.php", env.EZEE_BASE_URL);
    url.searchParams.set("request_type", "RoomList");
    url.searchParams.set("HotelCode", env.EZEE_HOTEL_CODE);
    url.searchParams.set("APIKey", env.EZEE_API_KEY);
    url.searchParams.set("check_in_date", checkIn);
    url.searchParams.set("check_out_date", checkOut);
    url.searchParams.set("number_adults", String(adults));
    url.searchParams.set("number_children", String(children));
    url.searchParams.set("num_rooms", String(numRooms));
    url.searchParams.set("promotion_code", "");
    url.searchParams.set("property_configuration_info", "0");
    url.searchParams.set("showtax", "0");
    url.searchParams.set("show_only_available_rooms", "1");
    url.searchParams.set("language", "en");

    try {
      const res = await axios.get(url.toString(), {
        timeout: 15000,
        validateStatus: () => true,
      });

      const payload = res.data;
      if (res.status >= 400) {
        throw new HttpError(502, "Failed to fetch room availability");
      }

      // Check for Error Details structure first
      if (Array.isArray(payload) && payload.length > 0 && payload[0]?.["Error Details"]) {
        const errorDetails = payload[0]["Error Details"];
        const errorCode = String(errorDetails?.Error_Code ?? "");
        const errorMessage = String(errorDetails?.Error_Message ?? "");
        const combinedDetails = `${errorCode} ${errorMessage}`.trim();
        if (combinedDetails.toLowerCase().includes("noresacc")) {
          throw new HttpError(502, "NORESACC");
        }
        throw mapEzeeErrorToHttpError(payload[0]);
      }

      if (payload?.["Error Details"]) {
        const errorDetails = payload["Error Details"];
        const errorCode = String(errorDetails?.Error_Code ?? "");
        const errorMessage = String(errorDetails?.Error_Message ?? "");
        const combinedDetails = `${errorCode} ${errorMessage}`.trim();
        if (combinedDetails.toLowerCase().includes("noresacc")) {
          throw new HttpError(502, "NORESACC");
        }
        throw mapEzeeErrorToHttpError(payload);
      }

      if (payload?.Success === false || payload?.Error || payload?.ErrorCode) {
        throw mapEzeeErrorToHttpError(payload);
      }

      const rawRooms =
        payload?.RoomList ??
        payload?.Room_List ??
        payload?.rooms ??
        payload?.data ??
        payload;

      const list = Array.isArray(rawRooms) ? rawRooms : Array.isArray(rawRooms?.Room) ? rawRooms.Room : [];

      const cleaned: EzeeLivePriceRoom[] = list.map((r: any) => {
        const avg = toNumber(r?.room_rates_info?.avg_per_night_after_discount, 0);
        const baseTotal = toNumber(r?.room_rates_info?.totalprice_inclusive_all, 0);
        const minAvail = toInt(r?.min_ava_rooms, 0);
        const currencySign = String(r?.currency_sign ?? r?.Currency_Sign ?? "");

        const total = baseTotal * (numRooms > 1 ? numRooms : 1);

        return {
          roomtypeunkid: String(r?.roomtypeunkid ?? r?.Roomtypeunkid ?? r?.RoomTypeUNKID ?? ""),
          Room_Name: String(r?.Room_Name ?? r?.room_name ?? r?.RoomName ?? ""),
          Roomtype_Name: String(r?.Roomtype_Name ?? r?.roomtype_name ?? r?.RoomTypeName ?? ""),
          Roomtype: String(r?.Roomtype ?? r?.roomtype ?? ""),
          Room_Description: String(r?.Room_Description ?? r?.room_description ?? r?.RoomDescription ?? ""),
          max_adult_occupancy: toInt(r?.max_adult_occupancy, 0),
          max_child_occupancy: toInt(r?.max_child_occupancy, 0),
          available_rooms: Number.isFinite(minAvail) ? Math.max(0, minAvail) : 0,
          avg_price_per_night: avg,
          total_price: total,
          currency_sign: currencySign,
          RoomAmenities: String(r?.RoomAmenities ?? r?.room_amenities ?? ""),
          room_main_image: r?.room_main_image ? String(r.room_main_image) : undefined,
          room_rates_info: r?.room_rates_info,
          extra_child_rates_info: r?.extra_child_rates_info,
          extra_adult_rates_info: r?.extra_adult_rates_info,
        };
      });

      return cleaned.filter((r) => {
        if (!r.roomtypeunkid) return false;
        const hasAnyName = Boolean(String(r.Room_Name ?? '').trim() || String(r.Roomtype_Name ?? '').trim() || String(r.Roomtype ?? '').trim());
        return hasAnyName;
      });
    } catch (e: any) {
      if (e instanceof HttpError) throw e;

      const ax = e as AxiosError;
      const maybePayload: any = (ax as any)?.response?.data;
      if (maybePayload && (maybePayload?.Error || maybePayload?.ErrorCode || maybePayload?.["Error Details"])) {
        throw mapEzeeErrorToHttpError(maybePayload);
      }

      throw new HttpError(502, "Failed to fetch room availability");
    }
  },
};

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
