import axios, { AxiosError } from "axios";

import { env } from "../config/env";
import { HttpError } from "../middlewares/errorHandler";

export type EzeeRoom = {
  roomtypeunkid: string;
  roomrateunkid?: string; // Added rate plan ID
  ratetypeunkid?: string; // Added rate type ID
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
  room_rates_info?: any;
  extra_adult_rates_info?: any;
  extra_child_rates_info?: any;
  day_wise_beforediscount?: any;
  rack_rate?: number; // base rack rate per night
  rack_rate_adult?: number; // rack rate for extra adult
  rack_rate_child?: number; // rack rate for extra child
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

const toNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

  return new HttpError(502, raw || "Failed to fetch room availability");
};

export const ezeeService = {
  async fetchRoomListRaw(params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    rooms: number;
  }): Promise<any[]> {
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
    url.searchParams.set("show_only_available_rooms", "0");
    url.searchParams.set("language", "en");
    url.searchParams.set("packagefor", "DESKTOP");
    url.searchParams.set("promotionfor", "DESKTOP");

    try {
      const res = await axios.get(url.toString(), {
        timeout: 15000,
        validateStatus: () => true,
      });

      const payload = res.data;
      if (res.status >= 400) {
        throw new HttpError(502, "Failed to fetch room availability");
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
      return list;
    } catch (e: any) {
      if (e instanceof HttpError) throw e;

      const ax = e as AxiosError;
      const maybePayload: any = (ax as any)?.response?.data;
      if (maybePayload && (maybePayload?.Error || maybePayload?.ErrorCode)) {
        throw mapEzeeErrorToHttpError(maybePayload);
      }

      throw new HttpError(502, "Failed to fetch room availability");
    }
  },

  async fetchRoomList(params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    rooms: number;
  }): Promise<EzeeRoom[]> {
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
    url.searchParams.set("show_only_available_rooms", "0");
    url.searchParams.set("language", "en");
    url.searchParams.set("packagefor", "DESKTOP");
    url.searchParams.set("promotionfor", "DESKTOP");

    try {
      const res = await axios.get(url.toString(), {
        timeout: 15000,
        validateStatus: () => true,
      });

      const payload = res.data;
      if (res.status >= 400) {
        throw new HttpError(502, "Failed to fetch room availability");
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

      const cleaned: EzeeRoom[] = list.map((r: any, index: number) => {
        // Enhanced price extraction logic
        const rateInfo = r?.room_rates_info || {};
        
        console.log(`[DEBUG] Processing room ${index + 1}:`, {
          roomName: r?.Room_Name,
          roomtypeunkid: r?.roomtypeunkid,
          rateInfoKeys: Object.keys(rateInfo),
          avgPriceAfterDiscount: rateInfo.avg_per_night_after_discount,
          totalPriceInclusive: rateInfo.totalprice_inclusive_all,
          exclusiveTax: rateInfo.exclusive_tax
        });
        
        // Try multiple price fields in order of preference
        let avg = 0;
        if (rateInfo.avg_per_night_after_discount) {
          avg = toNumber(rateInfo.avg_per_night_after_discount, 0);
          console.log(`[DEBUG] Using avg_per_night_after_discount: ${avg}`);
        } else if (rateInfo.avg_per_night_before_discount) {
          avg = toNumber(rateInfo.avg_per_night_before_discount, 0);
          console.log(`[DEBUG] Using avg_per_night_before_discount: ${avg}`);
        } else if (rateInfo.totalprice_inclusive_all) {
          const nights = dateDiffNights(checkIn, checkOut);
          avg = toNumber(rateInfo.totalprice_inclusive_all, 0) / Math.max(nights, 1);
          console.log(`[DEBUG] Using totalprice_inclusive_all / nights: ${rateInfo.totalprice_inclusive_all} / ${nights} = ${avg}`);
        } else if (rateInfo.totalprice_room_only) {
          const nights = dateDiffNights(checkIn, checkOut);
          avg = toNumber(rateInfo.totalprice_room_only, 0) / Math.max(nights, 1);
          console.log(`[DEBUG] Using totalprice_room_only / nights: ${rateInfo.totalprice_room_only} / ${nights} = ${avg}`);
        } else if (rateInfo.exclusive_tax && typeof rateInfo.exclusive_tax === 'object') {
          // Handle case where exclusive_tax is an object with date keys
          const taxValues = Object.values(rateInfo.exclusive_tax).filter(v => Number.isFinite(Number(v)));
          if (taxValues.length > 0) {
            avg = toNumber(taxValues[0], 0);
            console.log(`[DEBUG] Using exclusive_tax value: ${avg}`);
          }
        }
        
        console.log(`[DEBUG] Final calculated avg price: ${avg}`);
        
        const baseTotal = toNumber(rateInfo.totalprice_inclusive_all || rateInfo.totalprice_room_only || 0, 0);
        const minAvail = toInt(r?.min_ava_rooms, 0);
        const currencySign = String((r?.currency_sign ?? r?.Currency_Sign) || "");

        // Extract rack_rate for main room, extra adult, and extra child
        const rackRate = toNumber(rateInfo.rack_rate, 0);
        const rackRateAdult = toNumber(r?.extra_adult_rates_info?.rack_rate, 0);
        const rackRateChild = toNumber(r?.extra_child_rates_info?.rack_rate, 0);

        const dayWiseBeforeDiscount = rateInfo?.day_wise_beforediscount;

        const total = baseTotal * (numRooms > 1 ? numRooms : 1);

        return {
          roomtypeunkid: String(r?.roomtypeunkid ?? r?.Roomtypeunkid ?? r?.RoomTypeUNKID ?? ""),
          roomrateunkid: String(r?.roomrateunkid ?? r?.room_rates_info?.rateplanunkid ?? r?.room_rates_info?.Rateplanunkid ?? r?.room_rates_info?.RatePlanUNKID ?? ""),
          ratetypeunkid: String(r?.ratetypeunkid ?? r?.room_rates_info?.ratetypeunkid ?? r?.room_rates_info?.Ratetypeunkid ?? r?.room_rates_info?.RateTypeUNKID ?? ""),
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
          extra_adult_rates_info: r?.extra_adult_rates_info,
          extra_child_rates_info: r?.extra_child_rates_info,
          day_wise_beforediscount: dayWiseBeforeDiscount,
          rack_rate: rackRate,
          rack_rate_adult: rackRateAdult,
          rack_rate_child: rackRateChild,
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
      if (maybePayload && (maybePayload?.Error || maybePayload?.ErrorCode)) {
        throw mapEzeeErrorToHttpError(maybePayload);
      }

      throw new HttpError(502, "Failed to fetch room availability");
    }
  },
};
