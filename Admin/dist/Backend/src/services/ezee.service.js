"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ezeeService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const errorHandler_1 = require("../middlewares/errorHandler");
const toIsoDateOnly = (value) => {
    const s = String(value ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
        return null;
    const dt = new Date(`${s}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime()))
        return null;
    return s;
};
const dateDiffNights = (checkInIso, checkOutIso) => {
    const a = new Date(`${checkInIso}T00:00:00.000Z`).getTime();
    const b = new Date(`${checkOutIso}T00:00:00.000Z`).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b))
        return 0;
    const ms = b - a;
    if (ms <= 0)
        return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
};
const toInt = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.trunc(n);
};
const toNumber = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};
const mapEzeeErrorToHttpError = (payload) => {
    const raw = String(payload?.Error ?? payload?.error ?? payload?.message ?? "");
    const code = String(payload?.ErrorCode ?? payload?.errorcode ?? "");
    const combined = `${code} ${raw}`.trim();
    if (combined.toLowerCase().includes("hotelcodeempty")) {
        return new errorHandler_1.HttpError(400, "HotelCodeEmpty");
    }
    if (combined.toLowerCase().includes("unauthreq") || combined.toLowerCase().includes("unauthorized")) {
        return new errorHandler_1.HttpError(401, "UNAUTHREQ");
    }
    if (combined.toLowerCase().includes("nightslimitexceeded")) {
        return new errorHandler_1.HttpError(400, "NightsLimitExceeded");
    }
    if (combined.toLowerCase().includes("datenotvalid") || combined.toLowerCase().includes("date not valid")) {
        return new errorHandler_1.HttpError(400, "DateNotvalid");
    }
    return new errorHandler_1.HttpError(502, raw || "Failed to fetch room availability");
};
exports.ezeeService = {
    async fetchRoomList(params) {
        const checkIn = toIsoDateOnly(params.checkIn);
        const checkOut = toIsoDateOnly(params.checkOut);
        if (!checkIn || !checkOut)
            throw new errorHandler_1.HttpError(400, "DateNotvalid");
        const nights = dateDiffNights(checkIn, checkOut);
        if (nights <= 0)
            throw new errorHandler_1.HttpError(400, "DateNotvalid");
        if (nights > 30)
            throw new errorHandler_1.HttpError(400, "NightsLimitExceeded");
        const adults = toInt(params.adults, 1);
        const children = toInt(params.children, 0);
        const numRooms = toInt(params.rooms, 1);
        if (adults < 1)
            throw new errorHandler_1.HttpError(400, "adults must be >= 1");
        if (children < 0)
            throw new errorHandler_1.HttpError(400, "children must be >= 0");
        if (numRooms < 1)
            throw new errorHandler_1.HttpError(400, "rooms must be >= 1");
        const url = new URL("booking/reservation_api/listing.php", env_1.env.EZEE_BASE_URL);
        url.searchParams.set("request_type", "RoomList");
        url.searchParams.set("HotelCode", env_1.env.EZEE_HOTEL_CODE);
        url.searchParams.set("APIKey", env_1.env.EZEE_API_KEY);
        url.searchParams.set("check_in_date", checkIn);
        url.searchParams.set("check_out_date", checkOut);
        url.searchParams.set("num_nights", String(nights));
        url.searchParams.set("number_adults", String(adults));
        url.searchParams.set("number_children", String(children));
        url.searchParams.set("num_rooms", String(numRooms));
        url.searchParams.set("promotion_code", "");
        url.searchParams.set("property_configuration_info", "0");
        url.searchParams.set("showtax", "0");
        url.searchParams.set("show_only_available_rooms", "1");
        url.searchParams.set("language", "en");
        try {
            const res = await axios_1.default.get(url.toString(), {
                timeout: 15000,
                validateStatus: () => true,
            });
            const payload = res.data;
            if (res.status >= 400) {
                throw new errorHandler_1.HttpError(502, "Failed to fetch room availability");
            }
            if (payload?.Success === false || payload?.Error || payload?.ErrorCode) {
                throw mapEzeeErrorToHttpError(payload);
            }
            const rawRooms = payload?.RoomList ??
                payload?.Room_List ??
                payload?.rooms ??
                payload?.data ??
                payload;
            const list = Array.isArray(rawRooms) ? rawRooms : Array.isArray(rawRooms?.Room) ? rawRooms.Room : [];
            const cleaned = list.map((r) => {
                const avg = toNumber(r?.room_rates_info?.avg_per_night_after_discount, 0);
                const baseTotal = toNumber(r?.room_rates_info?.totalprice_inclusive_all, 0);
                const minAvail = toInt(r?.min_ava_rooms, 0);
                const currencySign = String(r?.currency_sign ?? r?.Currency_Sign ?? "");
                const total = baseTotal * (numRooms > 1 ? numRooms : 1);
                return {
                    roomtypeunkid: String(r?.roomtypeunkid ?? r?.Roomtypeunkid ?? r?.RoomTypeUNKID ?? ""),
                    Room_Name: String(r?.Room_Name ?? r?.room_name ?? r?.RoomName ?? ""),
                    Room_Description: String(r?.Room_Description ?? r?.room_description ?? r?.RoomDescription ?? ""),
                    max_adult_occupancy: toInt(r?.max_adult_occupancy, 0),
                    max_child_occupancy: toInt(r?.max_child_occupancy, 0),
                    available_rooms: Number.isFinite(minAvail) ? Math.max(0, minAvail) : 0,
                    avg_price_per_night: avg,
                    total_price: total,
                    currency_sign: currencySign,
                    RoomAmenities: String(r?.RoomAmenities ?? r?.room_amenities ?? ""),
                    room_main_image: r?.room_main_image ? String(r.room_main_image) : undefined,
                };
            });
            return cleaned.filter((r) => r.roomtypeunkid && r.Room_Name);
        }
        catch (e) {
            if (e instanceof errorHandler_1.HttpError)
                throw e;
            const ax = e;
            const maybePayload = ax?.response?.data;
            if (maybePayload && (maybePayload?.Error || maybePayload?.ErrorCode)) {
                throw mapEzeeErrorToHttpError(maybePayload);
            }
            throw new errorHandler_1.HttpError(502, "Failed to fetch room availability");
        }
    },
};
