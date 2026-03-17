"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ezeeBookingService = void 0;
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
const mapEzeeErrorToHttpError = (payload, fallbackMessage) => {
    const raw = String(payload?.Error ?? payload?.error ?? payload?.message ?? "");
    const code = String(payload?.ErrorCode ?? payload?.errorcode ?? "");
    const combined = `${code} ${raw}`.trim();
    if (combined.toLowerCase().includes("hotelcodeempty")) {
        return new errorHandler_1.HttpError(400, "HotelCodeEmpty");
    }
    if (combined.toLowerCase().includes("unauthreq") || combined.toLowerCase().includes("unauthorized")) {
        return new errorHandler_1.HttpError(401, "UNAUTHREQ");
    }
    if (combined.toLowerCase().includes("datenotvalid") || combined.toLowerCase().includes("date not valid")) {
        return new errorHandler_1.HttpError(400, "DateNotvalid");
    }
    return new errorHandler_1.HttpError(502, raw || fallbackMessage);
};
const buildCommaSeparatedRates = (rates) => {
    const cleaned = rates.map((r) => {
        const n = Number(r);
        if (!Number.isFinite(n) || n < 0)
            return 0;
        return Math.round(n);
    });
    return cleaned.join(",");
};
const extractPerNightRatesFromRoom = (room, checkIn, nights) => {
    const exclusiveTax = room?.room_rates_info?.exclusive_tax;
    const inclusiveTaxAdj = room?.room_rates_info?.inclusive_tax_adjustment;
    const rates = [];
    const cursor = new Date(`${checkIn}T00:00:00.000Z`);
    for (let i = 0; i < nights; i++) {
        const yyyy = cursor.getUTCFullYear();
        const mm = String(cursor.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(cursor.getUTCDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        let v = undefined;
        if (exclusiveTax && typeof exclusiveTax === "object")
            v = exclusiveTax[key];
        if (v === undefined && inclusiveTaxAdj && typeof inclusiveTaxAdj === "object")
            v = inclusiveTaxAdj[key];
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) {
            rates.push(n);
        }
        else {
            const avg = Number(room?.avg_price_per_night ?? 0);
            rates.push(Number.isFinite(avg) && avg > 0 ? avg : 0);
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return rates;
};
exports.ezeeBookingService = {
    async createAndConfirmBooking(params) {
        if (!env_1.env.EZEE_BASE_URL || !env_1.env.EZEE_HOTEL_CODE || !env_1.env.EZEE_API_KEY) {
            throw new errorHandler_1.HttpError(500, "eZee configuration missing");
        }
        const checkIn = toIsoDateOnly(params.checkIn);
        const checkOut = toIsoDateOnly(params.checkOut);
        if (!checkIn || !checkOut)
            throw new errorHandler_1.HttpError(400, "DateNotvalid");
        const nights = dateDiffNights(checkIn, checkOut);
        if (nights <= 0)
            throw new errorHandler_1.HttpError(400, "DateNotvalid");
        const adults = toInt(params.adults, 1);
        const children = toInt(params.children, 0);
        const rooms = toInt(params.rooms, 1);
        if (rooms < 1)
            throw new errorHandler_1.HttpError(400, "rooms must be >= 1");
        if (adults < 1)
            throw new errorHandler_1.HttpError(400, "adults must be >= 1");
        if (children < 0)
            throw new errorHandler_1.HttpError(400, "children must be >= 0");
        if (!params.ezeeRoom?.roomtypeunkid || !params.ezeeRoom?.roomrateunkid || !params.ezeeRoom?.ratetypeunkid) {
            throw new errorHandler_1.HttpError(400, "Missing eZee room mapping (roomtypeunkid/roomrateunkid/ratetypeunkid)");
        }
        if (!Number.isFinite(params.ezeeRoom.available_rooms) || params.ezeeRoom.available_rooms < rooms) {
            throw new errorHandler_1.HttpError(400, "Room not available");
        }
        const perNightRates = extractPerNightRatesFromRoom(params.ezeeRoom, checkIn, nights);
        const baserate = buildCommaSeparatedRates(perNightRates);
        const bookingData = {
            Room_Details: {
                Room_1: {
                    Rateplan_Id: String(params.ezeeRoom.roomrateunkid),
                    Ratetype_Id: String(params.ezeeRoom.ratetypeunkid),
                    Roomtype_Id: String(params.ezeeRoom.roomtypeunkid),
                    baserate,
                    extradultrate: "0",
                    extrachildrate: "0",
                    number_adults: String(adults),
                    number_children: String(children),
                    ...(children > 0 ? { ExtraChild_Age: "0" } : {}),
                    Title: "",
                    First_Name: String(params.firstName ?? "").trim() || "Guest",
                    Last_Name: String(params.lastName ?? "").trim() || "",
                    Gender: "",
                    SpecialRequest: String(params.specialRequest ?? params.additionalInformation ?? "").trim(),
                },
            },
            check_in_date: checkIn,
            check_out_date: checkOut,
            Booking_Payment_Mode: String(params.bookingPaymentMode),
            Email_Address: String(params.email ?? "").trim(),
            Source_Id: "",
            MobileNo: String(params.phone ?? "").trim(),
            Address: "",
            State: "",
            Country: "",
            City: "",
            Zipcode: "",
            Fax: "",
            Device: "DESKTOP",
            Languagekey: "en",
            paymenttypeunkid: "",
        };
        const insertUrl = new URL("booking/reservation_api/listing.php", env_1.env.EZEE_BASE_URL);
        insertUrl.searchParams.set("request_type", "InsertBooking");
        insertUrl.searchParams.set("HotelCode", env_1.env.EZEE_HOTEL_CODE);
        insertUrl.searchParams.set("APIKey", env_1.env.EZEE_API_KEY);
        insertUrl.searchParams.set("BookingData", JSON.stringify(bookingData));
        let insertPayload;
        try {
            const res = await axios_1.default.get(insertUrl.toString(), {
                timeout: 20000,
                validateStatus: () => true,
            });
            insertPayload = res.data;
            if (res.status >= 400) {
                throw new errorHandler_1.HttpError(502, "Failed to create booking in eZee");
            }
            if (insertPayload?.Success === false || insertPayload?.Error || insertPayload?.ErrorCode) {
                throw mapEzeeErrorToHttpError(insertPayload, "Failed to create booking in eZee");
            }
        }
        catch (e) {
            if (e instanceof errorHandler_1.HttpError)
                throw e;
            const ax = e;
            const maybePayload = ax?.response?.data;
            if (maybePayload && (maybePayload?.Error || maybePayload?.ErrorCode)) {
                throw mapEzeeErrorToHttpError(maybePayload, "Failed to create booking in eZee");
            }
            throw new errorHandler_1.HttpError(502, "Failed to create booking in eZee");
        }
        const reservationNo = String(insertPayload?.ReservationNo ?? "").trim();
        if (!reservationNo)
            throw new errorHandler_1.HttpError(502, "eZee booking created but ReservationNo missing");
        const inventoryMode = insertPayload?.Inventory_Mode ? String(insertPayload.Inventory_Mode) : null;
        const subReservationNos = Array.isArray(insertPayload?.SubReservationNo)
            ? (insertPayload?.SubReservationNo ?? []).map((s) => String(s))
            : [];
        const processData = {
            Action: "ConfirmBooking",
            ReservationNo: reservationNo,
            Inventory_Mode: inventoryMode ?? "",
            Error_Text: "",
        };
        const processUrl = new URL("booking/reservation_api/listing.php", env_1.env.EZEE_BASE_URL);
        processUrl.searchParams.set("request_type", "ProcessBooking");
        processUrl.searchParams.set("HotelCode", env_1.env.EZEE_HOTEL_CODE);
        processUrl.searchParams.set("APIKey", env_1.env.EZEE_API_KEY);
        processUrl.searchParams.set("Process_Data", JSON.stringify(processData));
        try {
            const res = await axios_1.default.get(processUrl.toString(), {
                timeout: 20000,
                validateStatus: () => true,
            });
            const payload = res.data;
            if (res.status >= 400) {
                throw new errorHandler_1.HttpError(502, "Failed to confirm booking in eZee");
            }
            if (payload?.Success === false || payload?.Error || payload?.ErrorCode) {
                throw mapEzeeErrorToHttpError(payload, "Failed to confirm booking in eZee");
            }
            const result = String(payload?.result ?? "").toLowerCase();
            if (result && result !== "success") {
                throw new errorHandler_1.HttpError(502, payload?.message ? String(payload.message) : "Failed to confirm booking in eZee");
            }
        }
        catch (e) {
            if (e instanceof errorHandler_1.HttpError)
                throw e;
            const ax = e;
            const maybePayload = ax?.response?.data;
            if (maybePayload && (maybePayload?.Error || maybePayload?.ErrorCode)) {
                throw mapEzeeErrorToHttpError(maybePayload, "Failed to confirm booking in eZee");
            }
            throw new errorHandler_1.HttpError(502, "Failed to confirm booking in eZee");
        }
        return { reservationNo, subReservationNos, inventoryMode };
    },
};
