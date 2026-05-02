import axios, { AxiosError } from "axios";
import { HttpError } from "../middlewares/errorHandler";
import { env } from "../config/env";

// ─── Types ───────────────────────────────────────────────────────────
interface InsertBookingResponse {
  Success?: boolean;
  Error?: string;
  ErrorCode?: string;
  "Error Details"?: {
    Error_Code: string;
    Error_Message: string;
  };
  ReservationNo?: string | string[];
  SubReservationNo?: string | string[];
  Inventory_Mode?: string;
  result?: string;
}

interface ConfirmBookingResponse {
  Success?: boolean;
  Error?: string;
  ErrorCode?: string;
  "Error Details"?: {
    Error_Code: string;
    Error_Message: string;
  };
  result?: string;
}

type EzeeApiPayload<T> = T | T[];

interface CreateAndConfirmBookingParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  specialRequest?: string | null;
  additionalInformation?: string | null;
  bookingPaymentMode: number;
  /** Final pre-tax base amount (after discount). When provided, baserate = finalBaseAmount / (nights × rooms) so eZee invoice matches our price after eZee adds its own GST. */
  finalBaseAmount?: number;
  /** Meal plan selected by user/admin (EP, CP, MAP). Passed as Package_Details to eZee so invoice shows the correct plan. */
  mealPlan?: "EP" | "CP" | "MAP";
  ezeeRoom: {
    roomtypeunkid: string;
    roomrateunkid: string;
    ratetypeunkid: string;
    available_rooms: number;
    room_rates_info?: any;
    avg_price_per_night?: number;
    extra_adult_rates_info?: any;
    extra_child_rates_info?: any;
  };
}

// ─── Utility helpers ─────────────────────────────────────────────────

function toInt(val: any, def: number): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

function assertNonEmpty(val: string, name: string): string {
  if (!val || val.trim() === "") {
    throw new HttpError(400, `${name} cannot be empty`);
  }
  return val.trim();
}

/** Truncate JSON for safe log embedding */
function safeJsonSnippet(data: any): string {
  try {
    const str = JSON.stringify(data);
    return str.length > 500 ? str.substring(0, 500) + "..." : str;
  } catch {
    return "[Invalid JSON]";
  }
}

function unwrapEzeePayload<T>(payload: EzeeApiPayload<T>): T {
  return Array.isArray(payload) ? (payload[0] as T) : payload;
}

function extractReservationNo(payload: any): string | null {
  const p: any = unwrapEzeePayload(payload);
  if (!p) return null;
  if (typeof p.ReservationNo === "string") return p.ReservationNo;
  if (Array.isArray(p.ReservationNo) && p.ReservationNo.length > 0) {
    return String(p.ReservationNo[0]);
  }
  return null;
}

function mapEzeeErrorDetailsToHttpError(payload: any, context: string): HttpError | null {
  const p: any = unwrapEzeePayload(payload);
  const details = p?.["Error Details"];
  if (!details) return null;
  const code = String(details.Error_Code ?? "").trim();
  const message = String(details.Error_Message ?? "").trim();
  if (!code || !message) return null;
  let statusCode = 400;
  if (code === "AuthenticationFailed") statusCode = 401;
  else if (code === "AuthorizationFailed") statusCode = 403;
  else if (code === "RecordNotFound") statusCode = 404;
  else if (code === "RatePlanNotAvailable" || code === "RoomNotAvailable") statusCode = 409;
  else if (code === "InvalidRequest" || code === "ParametersMissing") statusCode = 400;
  else if (code === "InternalError") statusCode = 500;
  else statusCode = 400;
  return new HttpError(statusCode, `${code} ${message}`);
}

function mapEzeeErrorToHttpError(payload: any, context: string): HttpError {
  const err = mapEzeeErrorDetailsToHttpError(payload, context);
  if (err) return err;
  const p: any = unwrapEzeePayload(payload);
  const message =
    p?.Error ||
    p?.ErrorMessage ||
    p?.error_message ||
    p?.Message ||
    p?.message ||
    "Unknown eZee API error";
  return new HttpError(502, `${context}: ${message}`);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ─── Date helpers ────────────────────────────────────────────────────

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Parse YYYY-MM-DD as local date (avoids timezone shift from ISO parse) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = String(dateStr).split("-").map((p) => Number(p));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(dateStr);
  }
  return new Date(y, m - 1, d);
}

/** Ensure a date string is strictly YYYY-MM-DD — no timestamps, no timezone */
function toStrictDateStr(dateStr: string): string {
  const s = String(dateStr ?? "").trim();
  if (DATE_REGEX.test(s)) return s;
  // Try to salvage from ISO or other formats
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) {
    throw new HttpError(400, `Invalid date format: "${s}" — expected YYYY-MM-DD`);
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ─── Rate helpers ────────────────────────────────────────────────────

function buildRateCsv(perNightRates: Record<string, number>, checkIn: Date, nights: number, fallback: number): string {
  const values: string[] = [];
  const cursor = new Date(checkIn);
  for (let i = 0; i < nights; i++) {
    const key = toDateKey(cursor);
    const v = Number(perNightRates[key]);
    const rate = Number.isFinite(v) && v > 0 ? v : fallback;
    values.push(String(Math.round(rate)));
    cursor.setDate(cursor.getDate() + 1);
  }
  return values.join(",");
}

function extractPerNightRatesFromRoom(ezeeRoom: any, _checkIn: Date, _nights: number): Record<string, number> {
  const rates: Record<string, number> = {};
  if (!ezeeRoom?.room_rates_info) return rates;
  const info = ezeeRoom.room_rates_info;
  const perNightFields = [
    "day_wise_baserackrate",
    "day_wise_rates",
    "daily_rates",
    "per_night_rates",
    "rates",
  ];
  for (const field of perNightFields) {
    if (info[field] && typeof info[field] === "object") {
      Object.assign(rates, info[field]);
      break;
    }
  }
  return rates;
}

function extractPerNightRatesFromExtra(extraRatesInfo: any, checkIn: Date, nights: number): Record<string, number> {
  const rates: Record<string, number> = {};
  if (!extraRatesInfo) return rates;
  if (typeof extraRatesInfo === "object") {
    if (extraRatesInfo.day_wise_rates) {
      Object.assign(rates, extraRatesInfo.day_wise_rates);
    } else if (extraRatesInfo.rates) {
      Object.assign(rates, extraRatesInfo.rates);
    } else {
      const flatRate = Number(extraRatesInfo.rate || extraRatesInfo.amount || 0);
      if (Number.isFinite(flatRate) && flatRate > 0) {
        const date = new Date(checkIn);
        for (let i = 0; i < nights; i++) {
          rates[toDateKey(date)] = flatRate;
          date.setDate(date.getDate() + 1);
        }
      }
    }
  }
  return rates;
}

function pickSingleRate(perNightRates: Record<string, number>): number {
  const values = Object.values(perNightRates).filter((v) => Number.isFinite(v) && v > 0);
  if (values.length === 0) return 0;
  return values[0];
}

// ─── URL builder ─────────────────────────────────────────────────────

function buildEzeeReservationApiUrl(requestType: string, query: Record<string, string>): string {
  const base = new URL("booking/reservation_api/listing.php", env.EZEE_BASE_URL);
  base.searchParams.set("request_type", requestType);
  base.searchParams.set("HotelCode", env.EZEE_HOTEL_CODE || "");
  base.searchParams.set("APIKey", env.EZEE_API_KEY || "");
  base.searchParams.set("language", "en");

  const raw = base.toString();
  const joiner = raw.includes("?") ? "&" : "?";
  const tail = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${v}`)
    .join("&");
  return `${raw}${joiner}${tail}`;
}

// ─── Payload sanitisation ────────────────────────────────────────────

/** Strip undefined/null from any object (deep). Converts null → "" for strings. */
function sanitizePayload(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (_key, value) => {
    if (value === undefined) return undefined; // JSON.stringify already drops undefined
    if (value === null) return "";              // null → empty string for eZee
    return value;
  }));
}

/** Diagnose what might be wrong with a booking payload — returns list of issues */
function diagnosePayload(data: any, nights: number): string[] {
  const issues: string[] = [];

  // Top-level checks
  if (!data.check_in_date) issues.push("check_in_date is missing or empty");
  if (!data.check_out_date) issues.push("check_out_date is missing or empty");
  if (!DATE_REGEX.test(data.check_in_date)) issues.push(`check_in_date "${data.check_in_date}" is not YYYY-MM-DD`);
  if (!DATE_REGEX.test(data.check_out_date)) issues.push(`check_out_date "${data.check_out_date}" is not YYYY-MM-DD`);
  if (!data.Email_Address) issues.push("Email_Address is missing or empty");
  if (data.Booking_Payment_Mode === undefined)
    issues.push("Booking_Payment_Mode is missing");

  // Room_Details checks (array format — proven to work with this property)
  if (!data.Room_Details) {
    issues.push("Room_Details is missing entirely");
  } else {
    const rooms: any[] = Array.isArray(data.Room_Details) ? data.Room_Details : Object.values(data.Room_Details);
    if (rooms.length === 0) issues.push("Room_Details is empty (no rooms)");
    rooms.forEach((rd: any, idx: number) => {
      const label = `Room[${idx}]`;
      if (!rd) { issues.push(`${label} is null/undefined`); return; }
      if (!rd.Rateplan_Id) issues.push(`${label}.Rateplan_Id is missing/empty`);
      if (!rd.Ratetype_Id) issues.push(`${label}.Ratetype_Id is missing/empty`);
      if (!rd.Roomtype_Id) issues.push(`${label}.Roomtype_Id is missing/empty`);
      if (!rd.baserate) issues.push(`${label}.baserate is missing/empty`);
      if (rd.number_adults === undefined || rd.number_adults === "") issues.push(`${label}.number_adults is missing/empty`);
      if (rd.number_children === undefined) issues.push(`${label}.number_children is missing`);
      if (!rd.First_Name) issues.push(`${label}.First_Name is missing/empty`);
      if (!rd.Last_Name) issues.push(`${label}.Last_Name is missing/empty`);

      // Validate baserate CSV count matches nights
      if (rd.baserate && nights > 0) {
        const csvCount = String(rd.baserate).split(",").length;
        if (csvCount !== nights) {
          issues.push(`${label}.baserate has ${csvCount} values but expected ${nights} (one per night)`);
        }
      }
      if (rd.extradultrate && nights > 0) {
        const csvCount = String(rd.extradultrate).split(",").length;
        if (csvCount !== nights) {
          issues.push(`${label}.extradultrate has ${csvCount} values but expected ${nights}`);
        }
      }
      if (rd.extrachildrate && nights > 0) {
        const csvCount = String(rd.extrachildrate).split(",").length;
        if (csvCount !== nights) {
          issues.push(`${label}.extrachildrate has ${csvCount} values but expected ${nights}`);
        }
      }
    });
  }

  // Check for any undefined values at top level
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) issues.push(`Top-level field "${k}" is undefined`);
  }

  return issues;
}

// ─── Main booking function ───────────────────────────────────────────

export async function createAndConfirmBooking(params: CreateAndConfirmBookingParams): Promise<{
  reservationNo: string;
  subReservationNos: string[];
  inventoryMode: string | null;
}> {
  console.log("🚀 [EZEE] ===== STARTING EZEE BOOKING PROCESS =====");

  // ── 1. Validate & normalise dates (STRICT YYYY-MM-DD) ──────────
  if (!params.checkIn || !params.checkOut) {
    throw new HttpError(400, "checkIn and checkOut dates are required");
  }

  const checkInStr = toStrictDateStr(params.checkIn);
  const checkOutStr = toStrictDateStr(params.checkOut);

  const checkIn = parseLocalDate(checkInStr);
  const checkOut = parseLocalDate(checkOutStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  checkIn.setHours(0, 0, 0, 0);
  checkOut.setHours(0, 0, 0, 0);

  if (checkIn < now) throw new HttpError(400, "Check-in date cannot be in the past");
  if (checkOut <= checkIn) throw new HttpError(400, "Check-out date must be after check-in date");

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) throw new HttpError(400, "DateNotvalid");

  // ── 2. Validate numeric params ──────────────────────────────────
  const adults = toInt(params.adults, 1);
  const children = toInt(params.children, 0);
  const rooms = toInt(params.rooms, 1);

  const bookingPaymentMode = Number(params.bookingPaymentMode);
  if (!Number.isFinite(bookingPaymentMode) || bookingPaymentMode < 0) {
    throw new HttpError(400, "Invalid Booking_Payment_Mode");
  }

  if (rooms < 1) throw new HttpError(400, "rooms must be >= 1");
  if (adults < 1) throw new HttpError(400, "adults must be >= 1");
  if (children < 0) throw new HttpError(400, "children must be >= 0");

  // ── 3. Validate eZee room IDs (MUST come from availability API) ─
  if (!params.ezeeRoom?.roomtypeunkid || !params.ezeeRoom?.roomrateunkid || !params.ezeeRoom?.ratetypeunkid) {
    throw new HttpError(400, "Missing eZee room mapping (roomtypeunkid/roomrateunkid/ratetypeunkid). These must come from the availability API response.");
  }

  const email = String(params.email ?? "").trim();
  if (!email) throw new HttpError(400, "Email_Address is required");

  const firstName = String(params.firstName ?? "").trim() || "Guest";
  const lastName = String(params.lastName ?? "").trim() || "Guest";

  if (!Number.isFinite(params.ezeeRoom.available_rooms) || params.ezeeRoom.available_rooms < rooms) {
    throw new HttpError(400, "Room not available");
  }

  // ── 4. Build rate CSVs (one value per night, comma-separated) ───
  //
  // Use day_wise_beforediscount as the PRIMARY source for baserate.
  // This array contains the actual per-night room rates from eZee.
  // 
  const dayWise = (params.ezeeRoom as any)?.room_rates_info?.day_wise_beforediscount;
  
  let baserateValues: number[] = [];
  
  if (Array.isArray(dayWise) && dayWise.length > 0) {
    // day_wise_beforediscount is an array of per-night rates
    baserateValues = dayWise.map((v: any) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
    });
    // Ensure we have exactly `nights` values — pad with last value if needed
    while (baserateValues.length < nights) {
      baserateValues.push(baserateValues[baserateValues.length - 1] || 0);
    }
    // Trim to exactly `nights` values
    baserateValues = baserateValues.slice(0, nights);
  }

  // Validate we have valid rates
  const hasValidRates = baserateValues.length > 0 && baserateValues.every(v => v > 0);
  if (!hasValidRates) {
    throw new HttpError(400, "Unable to determine baserate for eZee booking (day_wise_beforediscount missing or empty)");
  }

  // ── Override baserate with finalBaseAmount if provided ──
  // When our system applies a discount, we compute the final pre-tax base amount.
  // We send (finalBaseAmount / nights / rooms) as the per-night baserate to eZee.
  // eZee then adds its own 5% GST on top, producing the correct grand total.
  const finalBase = Number(params.finalBaseAmount ?? 0);
  if (Number.isFinite(finalBase) && finalBase > 0 && nights > 0 && rooms > 0) {
    const perNightRate = Math.round(finalBase / (nights * rooms));
    const originalRates = [...baserateValues];
    baserateValues = Array(nights).fill(Math.max(0, perNightRate));
    console.log("💰 [EZEE] Using finalBaseAmount for baserate (discount applied):", {
      originalRates,
      finalBaseAmount: finalBase,
      perNightRate,
      adjustedRates: baserateValues,
      nights,
      rooms,
    });
  }
  
  // eZee expects comma-separated per-night rates
  const baserate = baserateValues.map(v => String(v)).join(",");

  const extraAdultRates = extractPerNightRatesFromExtra(params.ezeeRoom?.extra_adult_rates_info, checkIn, nights);
  const extraChildRates = extractPerNightRatesFromExtra(params.ezeeRoom?.extra_child_rates_info, checkIn, nights);
  const extraAdultSingle = pickSingleRate(extraAdultRates);
  const extraChildSingle = pickSingleRate(extraChildRates);
  const extradultrate = buildRateCsv(extraAdultRates, checkIn, nights, extraAdultSingle);
  const extrachildrate = buildRateCsv(extraChildRates, checkIn, nights, extraChildSingle);

  // ── 5. Optional config ──────────────────────────────────────────
  // Per eZee guidelines and standalone testing, sending Source_Id 
  // or paymenttypeunkid can artificially restrict availability and 
  // cause "RoomsNotAvailable" errors if the rate plan isn't mapped 
  // to that source ID in eZee. We will always send empty strings.

  // ── 6. Build Room_Details OBJECT (Room_1, Room_2, …) ────────────
  //
  // CRITICAL: IDs MUST come directly from the availability API response.
  //   Rateplan_Id  = roomrateunkid  (the rate plan)
  //   Ratetype_Id  = ratetypeunkid  (the rate type / meal plan)
  //   Roomtype_Id  = roomtypeunkid  (the room type)
  //
  // For this property, each meal plan variant (EP/CP/MAP/AP) has its OWN
  // ratetypeunkid and roomrateunkid.  The EP variant often has all 3 IDs
  // identical — eZee rejects this with ParametersMissing.  The caller
  // MUST select a CP/MAP variant that has distinct IDs.
  //
  const roomtypeId = assertNonEmpty(String(params.ezeeRoom.roomtypeunkid), "Roomtype_Id");
  const rateplanId = assertNonEmpty(String(params.ezeeRoom.roomrateunkid), "Rateplan_Id (roomrateunkid)");
  const ratetypeId = assertNonEmpty(String(params.ezeeRoom.ratetypeunkid), "Ratetype_Id (ratetypeunkid)");

  // ── ID DISTINCTNESS CHECK ───────────────────────────────────────
  const allIdentical = (roomtypeId === rateplanId && rateplanId === ratetypeId);

  console.log("🔑 [EZEE] ID CHECK (from availability API):", {
    Roomtype_Id: roomtypeId,
    Rateplan_Id: rateplanId,
    Ratetype_Id: ratetypeId,
    allIdentical,
  });

  if (allIdentical) {
    console.warn(
      "⚠️ [EZEE] All 3 IDs are IDENTICAL (" + roomtypeId + "). " +
      "This is an EP-only variant. Proceeding — eZee may accept or reject."
    );
  }

  const baseRateStr = assertNonEmpty(String(baserate), "baserate");
  const extraAdultStr = String(extradultrate || "0");
  const extraChildStr = String(extrachildrate || "0");

  // ── 6b. Build Room_Details as OBJECT (Room_1, Room_2, …) ────────────
  // ONLY include fields specified in eZee API docs — nothing extra.
  //
  const roomDetails: Record<string, any> = {};
  for (let i = 1; i <= rooms; i++) {
    roomDetails[`Room_${i}`] = {
      Rateplan_Id: String(rateplanId),
      Ratetype_Id: String(ratetypeId),
      Roomtype_Id: String(roomtypeId),
      baserate: baseRateStr,
      extradultrate: extraAdultStr,
      extrachildrate: extraChildStr,
      number_adults: String(adults),
      number_children: String(children),
      ...(children > 0 ? { ExtraChild_Age: "0" } : {}),
      Title: "",
      First_Name: String(firstName),
      Last_Name: String(lastName),
      Gender: "",
      SpecialRequest: String(params.specialRequest ?? params.additionalInformation ?? "").trim(),
    };
  }

  console.log("📦 [EZEE] FINAL CLEAN ROOM PAYLOAD:", JSON.stringify(roomDetails, null, 2));

  // ── 7. Build top-level BookingData (exact eZee format) ────────────
  const bookingData: Record<string, any> = {
    Room_Details: roomDetails,
    check_in_date: checkInStr,
    check_out_date: checkOutStr,
    Booking_Payment_Mode: String(bookingPaymentMode),
    Email_Address: String(email),
    Source_Id: "",
    MobileNo: String(params.phone ?? "").trim(),
    Address: "",
    State: "",
    Country: "",
    City: "",
    Zipcode: "",
    Fax: "",
    Device: "",
    Languagekey: "en",
    paymenttypeunkid: "",
  };

  // ── 8. Sanitize: remove undefined/null fields ───────────────────
  const cleanedBookingData = sanitizePayload(bookingData);

  // ── 9. Pre-flight validation ────────────────────────────────────
  const issues = diagnosePayload(cleanedBookingData, nights);
  if (issues.length > 0) {
    console.error("❌ [EZEE] Pre-flight validation FAILED:", issues);
    console.error("❌ [EZEE] Payload that failed validation:", JSON.stringify(cleanedBookingData, null, 2));
    throw new HttpError(400, `eZee payload validation failed: ${issues.join("; ")}`);
  }

  // Room_Details must be object format with Room_1, Room_2 keys (per eZee docs)
  if (Array.isArray(cleanedBookingData.Room_Details)) {
    const obj: Record<string, any> = {};
    (cleanedBookingData.Room_Details as any[]).forEach((r: any, i: number) => {
      obj[`Room_${i + 1}`] = r;
    });
    cleanedBookingData.Room_Details = obj;
  }

  // ── 10. Build POST form data (eZee requires POST, not GET) ──────
  //
  // PROVEN: Standalone test showed GET always returns ParametersMissing
  // regardless of encoding. POST with form data returns ReservationNo.
  //
  const bookingDataJson = JSON.stringify(cleanedBookingData);

  const insertUrlBase = new URL("booking/reservation_api/listing.php", env.EZEE_BASE_URL);
  const insertFormData = new URLSearchParams();
  insertFormData.append("request_type", "InsertBooking");
  insertFormData.append("HotelCode", env.EZEE_HOTEL_CODE || "");
  insertFormData.append("APIKey", env.EZEE_API_KEY || "");
  insertFormData.append("BookingData", bookingDataJson);

  // ── 11. Final debug logs ──────────────────────────────────────
  console.log("🏨 [EZEE] Creating booking in eZee PMS (POST)...");
  console.log("📋 [EZEE] Booking Data:", JSON.stringify(cleanedBookingData, null, 2));
  console.log("🔍 [EZEE] Pre-flight summary:", {
    Room_Keys: Object.keys(cleanedBookingData.Room_Details),
    nights,
    check_in_date: cleanedBookingData.check_in_date,
    check_out_date: cleanedBookingData.check_out_date,
    Booking_Payment_Mode: cleanedBookingData.Booking_Payment_Mode,
    Email_Address: cleanedBookingData.Email_Address,
    Source_Id: cleanedBookingData.Source_Id ?? "(not set)",
    paymenttypeunkid: cleanedBookingData.paymenttypeunkid ?? "(not set)",
    MobileNo: cleanedBookingData.MobileNo || "(empty)",
    baserate_sample: cleanedBookingData.Room_Details?.Room_1?.baserate,
    extradultrate_sample: cleanedBookingData.Room_Details?.Room_1?.extradultrate,
    extrachildrate_sample: cleanedBookingData.Room_Details?.Room_1?.extrachildrate,
    json_length: bookingDataJson.length,
  });

  // ── 12. Call InsertBooking API (POST with form data) ──────────────
  try {
    const response = await axios.post<EzeeApiPayload<InsertBookingResponse>>(
      insertUrlBase.toString(),
      insertFormData.toString(),
      {
        timeout: 30000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    console.log("📨 [EZEE] InsertBooking Raw Response:", safeJsonSnippet(response.data));

    const insertPayload = unwrapEzeePayload(response.data);
    const errDetails = mapEzeeErrorDetailsToHttpError(insertPayload, "Failed to create booking in eZee");
    if (errDetails) {
      console.error("❌ [EZEE] InsertBooking error:", errDetails.message);
      console.error("❌ [EZEE] Full eZee response:", JSON.stringify(response.data));
      console.error("❌ [EZEE] BookingData sent:", JSON.stringify(cleanedBookingData, null, 2));

      const errorCode = String((insertPayload as any)?.["Error Details"]?.Error_Code ?? "").trim();
      if (errorCode === "ParametersMissing") {
        // Run diagnostics
        const postIssues = diagnosePayload(cleanedBookingData, nights);
        console.error("🔬 [EZEE] ParametersMissing diagnostics:", {
          issuesFound: postIssues.length > 0 ? postIssues : "No local issues detected — may be eZee-side validation",
          Room_Details_structure: Object.keys(cleanedBookingData.Room_Details || {}),
          hasEmptyStringFields: Object.entries(cleanedBookingData)
            .filter(([k, v]) => k !== "Fax" && k !== "SpecialRequest" && k !== "MobileNo" && v === "")
            .map(([k]) => k),
          idValues: {
            Rateplan_Id: cleanedBookingData.Room_Details?.Room_1?.Rateplan_Id,
            Ratetype_Id: cleanedBookingData.Room_Details?.Room_1?.Ratetype_Id,
            Roomtype_Id: cleanedBookingData.Room_Details?.Room_1?.Roomtype_Id,
          },
          hint: "Check that IDs match availability API response. Verify baserate has correct number of comma-separated values matching nights count.",
        });
      }

      throw new HttpError(
        errDetails.statusCode,
        `${errDetails.message}. bookingData=${safeJsonSnippet(cleanedBookingData)}`
      );
    }

    if ((insertPayload as any)?.Success === false || (insertPayload as any)?.Error || (insertPayload as any)?.ErrorCode) {
      console.error("❌ [EZEE] InsertBooking API error:", insertPayload);
      throw mapEzeeErrorToHttpError(insertPayload, "Failed to create booking in eZee");
    }

    const reservationNo = extractReservationNo(insertPayload);
    const inventoryMode = insertPayload?.Inventory_Mode ? String(insertPayload.Inventory_Mode) : null;
    const subReservationNos = Array.isArray(insertPayload?.SubReservationNo)
      ? (insertPayload?.SubReservationNo ?? []).map((s) => String(s))
      : [];

    if (!reservationNo) {
      console.error("❌ [EZEE] No reservation number in response:", safeJsonSnippet(insertPayload));
      throw new HttpError(502, `eZee booking created but ReservationNo missing. payload=${safeJsonSnippet(insertPayload)}`);
    }

    console.log("✅ [EZEE] Booking created successfully!");
    console.log("🎫 [EZEE] Reservation Number:", reservationNo);
    console.log("📊 [EZEE] Inventory Mode:", inventoryMode || "N/A");

    if (!inventoryMode) {
      console.warn("⚠️ [EZEE] Inventory_Mode missing from InsertBooking response — using 'ALLOCATED' as default");
    }

    // ── 13. Call ProcessBooking (ConfirmBooking) ──────────────────
    const processData = {
      Action: "ConfirmBooking",
      ReservationNo: String(reservationNo),
      Inventory_Mode: String(inventoryMode || "ALLOCATED"),
      Error_Text: "",
    };

    const processFormData = new URLSearchParams();
    processFormData.append("request_type", "ProcessBooking");
    processFormData.append("HotelCode", env.EZEE_HOTEL_CODE || "");
    processFormData.append("APIKey", env.EZEE_API_KEY || "");
    processFormData.append("Process_Data", JSON.stringify(processData));

    const processUrlBase = new URL("booking/reservation_api/listing.php", env.EZEE_BASE_URL);

    console.log("🔐 [EZEE] Processing booking (ConfirmBooking) via POST...");
    console.log("📋 [EZEE] Process Data:", JSON.stringify(processData, null, 2));

    const processResponse = await axios.post<EzeeApiPayload<ConfirmBookingResponse>>(
      processUrlBase.toString(),
      processFormData.toString(),
      {
        timeout: 30000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );
    console.log("📨 [EZEE] ProcessBooking Raw Response:", safeJsonSnippet(processResponse.data));

    const processPayload = unwrapEzeePayload(processResponse.data);
    const processErr = mapEzeeErrorDetailsToHttpError(processPayload, "Failed to confirm booking in eZee");
    if (processErr) {
      console.error("❌ [EZEE] ProcessBooking error:", processErr);
      throw new HttpError(processErr.statusCode, `${processErr.message}. reservationNo=${reservationNo}`);
    }

    if ((processPayload as any)?.Success === false || (processPayload as any)?.Error || (processPayload as any)?.ErrorCode) {
      console.error("❌ [EZEE] ProcessBooking API error:", processPayload);
      throw mapEzeeErrorToHttpError(processPayload, "Failed to confirm booking in eZee");
    }

    console.log("✅ [EZEE] Booking confirmed successfully!");
    console.log("🏁 [EZEE] ===== BOOKING PROCESS COMPLETED =====");
    console.log("🎫 [EZEE] Final Reservation Number:", reservationNo);
    console.log("📊 [EZEE] Final Inventory Mode:", inventoryMode || "ALLOCATED");
    console.log("📋 [EZEE] Sub-Reservations:", subReservationNos.join(", ") || "N/A");

    return {
      reservationNo,
      subReservationNos,
      inventoryMode: inventoryMode || "ALLOCATED",
    };
  } catch (e: any) {
    console.error("💥 [EZEE] Booking exception:", e.message);
    if (e instanceof HttpError) throw e;

    const ax = e as AxiosError;
    const maybePayload: any = (ax as any)?.response?.data;
    if (maybePayload) {
      console.error("💥 [EZEE] Axios error response data:", JSON.stringify(maybePayload));
      throw mapEzeeErrorToHttpError(maybePayload, "Failed to create booking in eZee");
    }

    throw new HttpError(502, `Failed to create booking in eZee: ${e.message}`);
  }
}

export const ezeeBookingService = {
  createAndConfirmBooking,
};
