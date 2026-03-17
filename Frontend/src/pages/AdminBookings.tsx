import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState, useRef, useMemo } from "react";
import { downloadBookingInvoicePdf } from "@/lib/invoicePdf";
import { toast } from "react-toastify";
import { Check, Pencil, Trash2, X, Tag, CheckCircle } from "lucide-react";
import { roomService } from "../lib/roomService";

const AdminBookings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState<string | null>(null);
  const [staffName, setStaffName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInText, setCheckInText] = useState("");
  const [checkOutText, setCheckOutText] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [extraAdults, setExtraAdults] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount?: number; type?: string; value?: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [mealPlanByDate, setMealPlanByDate] = useState<Record<string, MealPlan>>({});

  const [priceOverrideBase, setPriceOverrideBase] = useState<number | null>(null);
  const [isEditingPriceOverride, setIsEditingPriceOverride] = useState(false);
  const [priceOverrideInput, setPriceOverrideInput] = useState<string>("");

  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const [isEditingTotalOverride, setIsEditingTotalOverride] = useState(false);
  const [totalOverrideInput, setTotalOverrideInput] = useState<string>("");

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const checkInPickerRef = useRef<HTMLInputElement | null>(null);
  const checkOutPickerRef = useRef<HTMLInputElement | null>(null);
  const lastDateRangeKeyRef = useRef<string>("");

  const [activePromos, setActivePromos] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/promos', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (data?.ok && Array.isArray(data?.data?.promos)) {
          setActivePromos(data.data.promos.filter((p: any) => p.isActive && p.promoScope !== 'GLOBAL_FLAT'));
        }
      } catch { /* ignore */ }
    })();
  }, []);

  type MealPlan = "EP" | "CP" | "MAP";

  const normalizeRoomType = (value: string) => {
    const raw = String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const lower = raw.toLowerCase();

    if (lower === "deluxe studio suite") return "Deluxe Studio Suite";
    if (lower === "deluxe edge view" || lower === "deluxe edge view ") return "Deluxe Edge View";
    if (lower === "lotus family suite" || lower === "lotus family suit") return "Lotus Family Suite";
    if (lower === "presidential suite" || lower === "presidentail suite") return "Presidential Suite";

    return raw;
  };

  const baseRoomTypeFromApiName = (roomName: string) => {
    const raw = String(roomName ?? "").trim();
    if (!raw) return "";
    const base = raw.split(" - ")[0] ?? raw;
    return normalizeRoomType(base);
  };

  const getPlanFromRoomName = (name: string): MealPlan | null => {
    const upper = String(name ?? "").toUpperCase();
    if (upper.includes(" - EP") || upper.endsWith("EP")) return "EP";
    if (upper.includes(" - CP") || upper.endsWith("CP")) return "CP";
    if (upper.includes(" - MAP") || upper.endsWith("MAP")) return "MAP";
    return null;
  };

  const extractAvailabilityFromRaw = (r: any): number => {
    const minAvail = Number(r?.min_ava_rooms);
    if (Number.isFinite(minAvail)) return Math.max(0, minAvail);
    const avail = r?.available_rooms;
    if (avail && typeof avail === "object") {
      const values = Object.values(avail)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v));
      if (values.length > 0) return Math.max(0, Math.min(...values));
    }
    const fallback = Number(r?.available_rooms ?? 0);
    return Number.isFinite(fallback) ? Math.max(0, fallback) : 0;
  };

  const extractPricePerNightFromRaw = (r: any): number => {
    const directRackRate = Number(r?.rack_rate ?? 0);
    if (Number.isFinite(directRackRate) && directRackRate > 0) return directRackRate;

    const rackRate = Number(r?.room_rates_info?.rack_rate ?? 0);
    if (Number.isFinite(rackRate) && rackRate > 0) return rackRate;

    const name = String(r?.Room_Name ?? "");
    const isCp = name.toUpperCase().includes("CP");
    if (isCp && r?.room_rates_info?.exclusive_tax && typeof r.room_rates_info.exclusive_tax === "object") {
      const values = Object.values(r.room_rates_info.exclusive_tax)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) return values[0];
    }

    const exclusiveTaxObj = r?.room_rates_info?.exclusive_tax;
    if (exclusiveTaxObj && typeof exclusiveTaxObj === "object") {
      const values = Object.values(exclusiveTaxObj)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) return values[0];
    }

    const avg = Number(r?.room_rates_info?.avg_per_night_after_discount ?? 0);
    if (Number.isFinite(avg) && avg > 0) return avg;

    const inc = r?.room_rates_info?.inclusive_tax_adjustment;
    if (inc && typeof inc === "object") {
      const values = Object.values(inc)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) return values[0];
    }

    return 0;
  };

  const [livePlans, setLivePlans] = useState<{
    EP?: { pricePerNight: number; availability: number };
    CP?: { pricePerNight: number; availability: number };
    MAP?: { pricePerNight: number; availability: number };
  }>({});

  const availablePlanOptions = useMemo(() => {
    const candidates: MealPlan[] = ["EP", "CP", "MAP"];
    const present = candidates.filter((p) => {
      const price = Number((livePlans as any)?.[p]?.pricePerNight ?? 0);
      return Number.isFinite(price) && price > 0;
    });
    return present.length > 0 ? present : candidates;
  }, [livePlans]);

  const defaultPlanForSelection = useMemo<MealPlan>(() => {
    if (availablePlanOptions.includes("CP")) return "CP";
    if (availablePlanOptions.includes("MAP")) return "MAP";
    if (availablePlanOptions.includes("EP")) return "EP";
    return "CP";
  }, [availablePlanOptions]);

  const [livePlansLoading, setLivePlansLoading] = useState(false);
  const [livePlansError, setLivePlansError] = useState<string | null>(null);

  const [globalPromo, setGlobalPromo] = useState<{
    promoApplied: boolean;
    discountPerNight: number;
  } | null>(null);

  const formatDateDmy = (iso: string) => {
    if (!iso) return "";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = String(dt.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatDateFriendly = (iso: string) => {
    if (!iso) return "";
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return "";
    const d = dt.getDate();
    const suffix = d % 10 === 1 && d % 100 !== 11 ? "st" : d % 10 === 2 && d % 100 !== 12 ? "nd" : d % 10 === 3 && d % 100 !== 13 ? "rd" : "th";
    const month = dt.toLocaleString("en-IN", { month: "long" });
    const year = dt.getFullYear();
    return `${d}${suffix} ${month} ${year}`;
  };

  const parseDmyToIso = (dmy: string) => {
    const s = String(dmy ?? "").trim();
    const m = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(s);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
    if (mm < 1 || mm > 12) return null;
    if (dd < 1 || dd > 31) return null;
    const dt = new Date(yyyy, mm - 1, dd);
    if (Number.isNaN(dt.getTime())) return null;
    if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
    const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    return iso;
  };

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const visiblePromos = useMemo(() => {
    return activePromos.filter((p: any) => {
      // Hide GLOBAL_FLAT from selectable cards
      if (p.promoScope === 'GLOBAL_FLAT') return false;
      if (nights === 0) return true;
      const min = p.minNights != null ? Number(p.minNights) : 0;
      const max = p.maxNights != null ? Number(p.maxNights) : Infinity;
      if (nights < min || nights > max) return false;

      // New appliesTo logic
      if (p.appliesTo) {
        const appliesToLow = p.appliesTo.toLowerCase();
        if (appliesToLow.includes("night")) {
          const match = p.appliesTo.match(/(\d+)/);
          if (match) {
            const requiredNights = parseInt(match[1], 10);
            if (nights !== requiredNights) return false;
          }
        } else if (appliesToLow.includes("weekend")) {
          const start = new Date(checkIn);
          const end = new Date(checkOut);
          let hasWeekend = false;
          const current = new Date(start);
          while (current < end) {
            const day = current.getDay();
            if (day === 5 || day === 6) { // Friday or Saturday night
              hasWeekend = true;
              break;
            }
            current.setDate(current.getDate() + 1);
          }
          if (!hasWeekend) return false;
        }
      }

      return true;
    });
  }, [activePromos, nights, checkIn, checkOut]);

  const nightDates = useMemo(() => {
    if (!checkIn || nights <= 0) return [] as string[];
    const start = new Date(checkIn);
    if (!Number.isFinite(start.getTime())) return [] as string[];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const out: string[] = [];
    for (let i = 0; i < nights; i++) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd = String(cursor.getDate()).padStart(2, "0");
      out.push(`${yyyy}-${mm}-${dd}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [checkIn, nights]);

  useEffect(() => {
    const key = `${checkIn || ""}|${checkOut || ""}`;
    if (key !== lastDateRangeKeyRef.current) {
      lastDateRangeKeyRef.current = key;
      setMealPlanByDate({});
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (!nightDates.length) return;
    setMealPlanByDate((prev) => {
      const next: Record<string, MealPlan> = {};
      for (const d of nightDates) {
        const plan = prev[d];
        const normalized = plan === "EP" || plan === "CP" || plan === "MAP" ? plan : defaultPlanForSelection;
        next[d] = (availablePlanOptions as any).includes(normalized) ? normalized : defaultPlanForSelection;
      }
      return next;
    });
  }, [nightDates, availablePlanOptions, defaultPlanForSelection]);

  const todayIso = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const checkOutMinIso = useMemo(() => {
    if (!checkIn) return todayIso;
    const d = new Date(checkIn);
    if (!Number.isFinite(d.getTime())) return todayIso;
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [checkIn, todayIso]);

  useEffect(() => {
    if (!checkOut) return;
    if (checkOut < checkOutMinIso) setCheckOut(checkOutMinIso);
  }, [checkOut, checkOutMinIso]);

  useEffect(() => {
    setCheckInText(checkIn ? formatDateDmy(checkIn) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn]);

  useEffect(() => {
    setCheckOutText(checkOut ? formatDateDmy(checkOut) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOut]);

  useEffect(() => {
    if (!checkInTime) setCheckInTime("13:00");
    if (!checkOutTime) setCheckOutTime("11:00");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRoom = useMemo(() => {
    const idNum = Number(roomId);
    if (!Number.isFinite(idNum)) return null;
    return roomsList.find((r) => Number(r?.id) === idNum) ?? null;
  }, [roomId, roomsList]);

  useEffect(() => {
    const title = String(selectedRoom?.title ?? "").trim();
    if (!title) {
      setLivePlans({});
      setGlobalPromo(null);
      return;
    }
    if (!checkIn || !checkOut) return;

    let cancelled = false;
    const run = async () => {
      setLivePlansLoading(true);
      setLivePlansError(null);
      try {
        const titleNorm = normalizeRoomType(title);
        const listResp = await roomService.getRoomList({
          checkIn,
          checkOut,
          adults: 1,
          children: 0,
          rooms: 1,
        });

        const plans: any = {};

        // Primary source: /api/rooms includes CP/MAP variants (generated by backend)
        if (listResp.ok) {
          const roomsFromList = (listResp.data?.rooms ?? []) as any[];
          const roomTypeMatches = roomsFromList.filter((r) => {
            const base = baseRoomTypeFromApiName(String(r?.Room_Name ?? ""));
            return base.toLowerCase() === titleNorm.toLowerCase();
          });

          for (const r of roomTypeMatches) {
            const plan = getPlanFromRoomName(String(r?.Room_Name ?? ""));
            if (!plan) continue;
            const pricePerNight = extractPricePerNightFromRaw(r);
            const availability = extractAvailabilityFromRaw(r);
            plans[plan] = {
              pricePerNight: Number.isFinite(pricePerNight) ? pricePerNight : 0,
              availability: Number.isFinite(availability) ? availability : 0,
            };
          }
        }

        // Fallback source: /api/rooms/raw (if /api/rooms did not provide any plan variants)
        if (!plans.EP && !plans.CP && !plans.MAP) {
          const rawResp = await roomService.getRawRoomList({
            checkIn,
            checkOut,
            adults: 1,
            children: 0,
            rooms: 1,
          });

          if (!rawResp.success) {
            throw new Error(rawResp.message || rawResp.error || "Failed to fetch live rooms");
          }

          const list = (rawResp.rooms ?? []) as any[];
          const roomTypeMatches = list.filter((r) => {
            const rt = normalizeRoomType(String(r?.Roomtype_Name ?? "").trim());
            return rt.toLowerCase() === titleNorm.toLowerCase();
          });

          for (const r of roomTypeMatches) {
            const plan = getPlanFromRoomName(String(r?.Room_Name ?? ""));
            if (!plan) continue;
            const pricePerNight = extractPricePerNightFromRaw(r);
            const availability = extractAvailabilityFromRaw(r);
            plans[plan] = {
              pricePerNight: Number.isFinite(pricePerNight) ? pricePerNight : 0,
              availability: Number.isFinite(availability) ? availability : 0,
            };
          }
        }

        let promo: { promoApplied: boolean; discountPerNight: number } | null = null;
        if (listResp.ok) {
          const match = (r: any) => baseRoomTypeFromApiName(String(r?.Room_Name ?? "")) === titleNorm;
          const isCp = (r: any) => String(r?.Room_Name ?? "").toUpperCase().includes("CP");
          const cpRoom = (listResp.data.rooms ?? []).find((r: any) => match(r) && isCp(r));
          const anyRoom = cpRoom ?? (listResp.data.rooms ?? []).find((r: any) => match(r));
          if (anyRoom) {
            promo = {
              promoApplied: Boolean((anyRoom as any)?.promo_applied),
              discountPerNight: Number((anyRoom as any)?.discount_amount ?? 0),
            };
          }
        }

        if (!cancelled) {
          setLivePlans(plans);
          setGlobalPromo(promo);
        }
      } catch (e: any) {
        if (!cancelled) {
          setLivePlans({});
          setGlobalPromo(null);
          setLivePlansError(e?.message ?? "Failed to fetch live pricing");
        }
      } finally {
        if (!cancelled) setLivePlansLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedRoom?.title, checkIn, checkOut]);

  const priceEstimate = useMemo(() => {
    const room = selectedRoom;
    if (!room || nights <= 0) return null;

    const round2 = (n: number) => Math.round(n * 100) / 100;

    let epNights = 0;
    let cpNights = 0;
    let mapNights = 0;
    for (const d of nightDates) {
      const plan = mealPlanByDate[d] ?? "CP";
      if (plan === "EP") epNights += 1;
      if (plan === "CP") cpNights += 1;
      if (plan === "MAP") mapNights += 1;
    }

    const safeRooms = Number.isFinite(rooms) && rooms > 0 ? rooms : 1;
    const safeGuests = Number.isFinite(guests) && guests > 0 ? guests : 1;
    const safeChildren = Number.isFinite(children) && children >= 0 ? children : 0;
    const safeExtraAdults = Number.isFinite(extraAdults) && extraAdults >= 0 ? extraAdults : 0;

    const title = String(room?.title ?? "").toLowerCase();
    const mapRatePerGuestPerNight = title.includes("lotus") || title.includes("presidential")
      ? 2000
      : title.includes("deluxe") || title.includes("edge")
      ? 1000
      : 0;

    const basePerNight = Number(room.pricePerNight ?? 0);
    const liveEp = Number(livePlans?.EP?.pricePerNight ?? 0);
    const liveCp = Number(livePlans?.CP?.pricePerNight ?? 0);
    const liveMap = Number(livePlans?.MAP?.pricePerNight ?? 0);

    const effectiveEp = Number.isFinite(liveEp) && liveEp > 0 ? liveEp : basePerNight;
    const effectiveCp = Number.isFinite(liveCp) && liveCp > 0 ? liveCp : basePerNight;
    const effectiveMap = Number.isFinite(liveMap) && liveMap > 0 ? liveMap : basePerNight + mapRatePerGuestPerNight;

    const roomTotal = round2(
      (effectiveEp * epNights + effectiveCp * cpNights + (
        effectiveMap
      ) * mapNights) * safeRooms
    );
    const childCharge = round2(1200 * safeChildren * nights);
    const extraAdultCharge = round2(1500 * safeExtraAdults * nights);

    const globalFlatPerNight = globalPromo?.promoApplied ? Number(globalPromo?.discountPerNight ?? 0) : 0;
    const globalFlatDiscount = round2(Math.max(0, globalFlatPerNight) * nights * safeRooms);

    // keep these for UI breakdown compatibility
    const cpCharge = 0;
    const mapCharge = 0;
    const base = round2(Math.max(0, roomTotal - globalFlatDiscount) + childCharge + extraAdultCharge + cpCharge + mapCharge);
    const convenienceFee = 0;
    const gst = round2(base * 0.05);
    const total = round2(base + gst);

    return { roomTotal, childCharge, extraAdultCharge, cpCharge, mapCharge, base, convenienceFee, gst, total };
  }, [selectedRoom, nights, rooms, guests, children, extraAdults, nightDates, mealPlanByDate, livePlans, globalPromo?.promoApplied, globalPromo?.discountPerNight]);

  const baseLabel = useMemo(() => {
    if (!priceEstimate) return "Base";

    const plans = Object.values(mealPlanByDate ?? {});
    const hasMap = plans.includes("MAP");
    const hasCp = plans.includes("CP");

    if (hasMap) return "Base (Room With Breakfast & Dinner)";
    if (hasCp) return "Base (Room With Breakfast)";
    return "Base (Room)";
  }, [priceEstimate, mealPlanByDate]);

  const discountedEstimate = useMemo(() => {
    const pe = priceEstimate;
    if (!pe) return null;

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const base = Number(pe.base ?? 0);
    
    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === 'PERCENT') {
        discount = round2(base * (Number(appliedPromo.value) / 100));
      } else if (appliedPromo.type === 'FLAT') {
        discount = round2(Number(appliedPromo.value));
      } else {
        discount = round2(Number(appliedPromo.discountAmount ?? 0));
      }
    }

    discount = round2(Math.max(0, Math.min(base, discount)));
    const baseAfterDiscount = round2(Math.max(0, base - discount));
    const gst = round2(baseAfterDiscount * 0.05);
    const total = round2(baseAfterDiscount + gst);
    return { discount, baseAfterDiscount, gst, total };
  }, [priceEstimate, appliedPromo]);

  // Auto-discard promo if dates change and it's no longer valid
  useEffect(() => {
    if (!appliedPromo || !checkIn || !checkOut) return;

    const code = appliedPromo.code;
    const promoData = activePromos.find((p: any) => p.code === code);
    if (!promoData) {
      setAppliedPromo(null);
      return;
    }

    const min = promoData.minNights != null ? Number(promoData.minNights) : 0;
    const max = promoData.maxNights != null ? Number(promoData.maxNights) : Infinity;
    let isValid = (nights >= min && nights <= max);

    if (isValid && promoData.appliesTo) {
      const app = promoData.appliesTo.toLowerCase();
      if (app.includes("night")) {
        const match = promoData.appliesTo.match(/(\d+)/);
        if (match) {
          const req = parseInt(match[1], 10);
          if (nights !== req) isValid = false;
        }
      } else if (app.includes("weekend")) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        let hasWeekend = false;
        const cur = new Date(start);
        while (cur < end) {
          const day = cur.getDay();
          if (day === 5 || day === 6) { hasWeekend = true; break; }
          cur.setDate(cur.getDate() + 1);
        }
        if (!hasWeekend) isValid = false;
      }
    }

    if (!isValid) {
      setAppliedPromo(null);
      toast.info("Applied promo removed as it's no longer valid for the selected dates");
    }
  }, [checkIn, checkOut, nights, activePromos]);

  const effectiveEstimateForUi = useMemo(() => {
    const pe = priceEstimate;
    if (!pe) return null;

    const round2 = (n: number) => Math.round(n * 100) / 100;

    const computedBase = appliedPromo ? Number(discountedEstimate?.baseAfterDiscount ?? pe.base ?? 0) : Number(pe.base ?? 0);
    const baseCandidate = priceOverrideBase === null ? computedBase : Number(priceOverrideBase ?? 0);

    const computedGst = round2(baseCandidate * 0.05);
    const computedTotal = round2(baseCandidate + computedGst);

    if (totalOverride !== null) {
      const t = round2(Number(totalOverride ?? 0));
      const base = round2(t / 1.05);
      const gst = round2(t - base);
      return { base, gst, total: t, hasOverride: true };
    }

    return { base: baseCandidate, gst: computedGst, total: computedTotal, hasOverride: priceOverrideBase !== null };
  }, [appliedPromo, discountedEstimate?.baseAfterDiscount, priceEstimate, priceOverrideBase, totalOverride]);

  const formatInr = (value: any) => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return String(value ?? "0");
    const hasFraction = Math.abs(n % 1) > 0.000001;
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: hasFraction ? 2 : 0,
      }).format(n);
    } catch {
      return String(n);
    }
  };

  const formatMethod = (m: any) => {
    const s = String(m ?? "").trim();
    if (!s) return "—";
    return s.toUpperCase();
  };

  let cachedLogoDataUrl: string | null = null;
  const getLogoDataUrl = async () => {
    if (cachedLogoDataUrl) return cachedLogoDataUrl;

    const res = await fetch("/favicon.png", { cache: "force-cache" });
    if (!res.ok) throw new Error("Failed to load logo");
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read logo"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });

    cachedLogoDataUrl = dataUrl;
    return dataUrl;
  };

  const confirmedBookings = bookings.filter((b) => b?.status === "CONFIRMED");

  const filteredBookings = useMemo(() => {
    const q = String(search ?? "").trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const fromMs = from && Number.isFinite(from.getTime()) ? from.getTime() : null;
    const toMsRaw = to && Number.isFinite(to.getTime()) ? to.getTime() : null;
    const toMs = toMsRaw === null ? null : toMsRaw + (24 * 60 * 60 * 1000 - 1);

    return (confirmedBookings ?? []).filter((b: any) => {
      if (q) {
        const bookingNoForDisplay = Number(b?.bookingNo);
        const bookingRef = Number.isFinite(bookingNoForDisplay) && bookingNoForDisplay > 0 ? `VVR-${bookingNoForDisplay}` : String(b?.id ?? "");
        const hay = `${bookingRef} ${b?.id ?? ""} ${b?.staffName ?? ""} ${b?.status ?? ""} ${b?.amount ?? ""} ${b?.user?.name ?? ""} ${b?.user?.email ?? ""} ${b?.user?.phone ?? ""} ${b?.room?.title ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      const created = b?.createdAt ? new Date(b.createdAt) : null;
      const createdMs = created && Number.isFinite(created.getTime()) ? created.getTime() : null;
      if (fromMs !== null && createdMs !== null && createdMs < fromMs) return false;
      if (toMs !== null && createdMs !== null && createdMs > toMs) return false;
      if ((fromMs !== null || toMs !== null) && createdMs === null) return false;
      return true;
    });
  }, [confirmedBookings, search, fromDate, toDate]);

  const downloadBookingsCsv = () => {
    const list = filteredBookings;

    const escapeCsv = (v: any) => {
      const s = String(v ?? "");
      if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
      return s;
    };

    const rows = (list ?? []).map((b: any) => {
      const bookingNoForDisplay = Number(b?.bookingNo);
      const bookingRef = Number.isFinite(bookingNoForDisplay) && bookingNoForDisplay > 0 ? `VVR-${bookingNoForDisplay}` : String(b?.id ?? "");
      const created = b?.createdAt ? new Date(b.createdAt).toISOString() : "";
      const checkInIso = b?.checkIn ? new Date(b.checkIn).toISOString().slice(0, 10) : "";
      const checkOutIso = b?.checkOut ? new Date(b.checkOut).toISOString().slice(0, 10) : "";
      const method = b?.payments?.[0]?.method ?? b?.payments?.[0]?.provider ?? "";

      return [
        escapeCsv(bookingRef),
        escapeCsv(b?.staffName ?? ""),
        escapeCsv(b?.user?.name ?? ""),
        escapeCsv(b?.user?.email ?? ""),
        escapeCsv(b?.user?.phone ?? ""),
        escapeCsv(b?.room?.title ?? ""),
        escapeCsv(checkInIso),
        escapeCsv(checkOutIso),
        escapeCsv(b?.amount ?? ""),
        escapeCsv(method),
        escapeCsv(b?.status ?? ""),
        escapeCsv(created),
      ].join(",");
    });

    const csv = [
      "bookingId,staff,user,email,phone,room,checkIn,checkOut,amount,payment,status,createdAt",
      ...rows,
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = async (b: any) => {
    await downloadBookingInvoicePdf(b);
  };

  const deleteBooking = async (bookingId: string) => {
    const id = String(bookingId ?? "").trim();
    if (!id) return;
    const ok = window.confirm("Delete this booking? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/admin-api/bookings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to delete booking");
      toast.success("Booking deleted");
      await loadBookings();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete booking");
    }
  };

  const loadBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/admin-api/bookings", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load bookings");
        setBookings(data?.data?.bookings ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load bookings");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadBookings();

    const loadMeta = async () => {
      try {
        const [uRes, rRes] = await Promise.all([
          fetch("/admin-api/users", { credentials: "include" }),
          fetch("/admin-api/rooms", { credentials: "include" }),
        ]);

        const [uData, rData] = await Promise.all([
          uRes.json().catch(() => null),
          rRes.json().catch(() => null),
        ]);

        if (uRes.ok) setUsers(uData?.data?.users ?? []);
        if (rRes.ok) setRoomsList(rData?.data?.rooms ?? []);
      } catch {
        // ignore
      }
    };

    loadMeta();
  }, []);

  const submitManualBooking = async () => {
    setCreateError(null);
    setCreateOk(null);

    const staff = staffName.trim();
    const name = userName.trim();
    const email = userEmail.trim();
    const phone = userPhone.trim();
    const r = roomId.trim();
    if (!staff) {
      setCreateError("Staff name is required");
      toast.error("Staff name is required");
      return;
    }
    if (!name) {
      setCreateError("User name is required");
      toast.error("User name is required");
      return;
    }
    if (!email) {
      setCreateError("User email is required");
      toast.error("User email is required");
      return;
    }
    if (!phone) {
      setCreateError("User phone is required");
      toast.error("User phone is required");
      return;
    }
    if (!r || !Number.isFinite(Number(r))) {
      setCreateError("Valid Room ID is required");
      toast.error("Valid Room ID is required");
      return;
    }
    if (!checkIn) {
      setCreateError("Check-in date is required");
      toast.error("Check-in date is required");
      return;
    }
    if (!checkOut) {
      setCreateError("Check-out date is required");
      toast.error("Check-out date is required");
      return;
    }

    setCreating(true);
    try {
      const overrideAmount = effectiveEstimateForUi?.total ?? null;
      const res = await fetch("/admin-api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paymentMethod,
          staffName: staff,
          userName: name,
          userEmail: email,
          userPhone: phone,
          roomId: Number(r),
          checkIn,
          checkOut,
          checkInTime: checkInTime.trim() ? checkInTime.trim() : null,
          checkOutTime: checkOutTime.trim() ? checkOutTime.trim() : null,
          rooms,
          guests,
          adults,
          children,
          extraAdults,
          additionalInformation: additionalInformation.trim() ? additionalInformation.trim() : null,
          mealPlanByDate: nightDates.map((d) => ({ date: d, plan: mealPlanByDate[d] ?? "CP" })),
          amountOverride: overrideAmount !== null ? Number(overrideAmount) : undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to create booking");

      setCreateOk("Booking created (CONFIRMED) with Cash/UPI/Card payment.");
      toast.success("Booking created");
      await loadBookings();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create booking");
      toast.error(e?.message ?? "Failed to create booking");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Bookings" description="View and manage bookings.">

      {/* Promo Cards Strip */}
      {/* <div className="promo-section mb-8 relative">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="h-5 w-5 text-gold" />
          <h3 className="promo-title">
            Special Offers
          </h3>
        </div>
        <div className="promo-container">
          {visiblePromos && visiblePromos.length > 0 ? (
            visiblePromos.map((promo: any) => {
              const isActive = appliedPromo?.code === promo.code;
              return (
                <div 
                  key={promo.id || promo.code} 
                  onClick={() => {
                    if (isActive) {
                      setAppliedPromo(null);
                      setPromoInput('');
                      toast.info('Promo removed');
                    } else {
                      setAppliedPromo({
                        code: promo.code,
                        discountAmount: 0
                      });
                      setPromoInput(promo.code);
                      toast.success(`Promo ${promo.code} selected`);
                    }
                  }}
                  className={`promo-card group ${isActive ? 'border-2 border-gold bg-[#fff8f2] shadow-gold/20' : ''}`}
                >
                  <div className="relative z-10 w-3/4">
                    <h3 className="promo-card-value">
                      {promo.type === 'PERCENT' ? `${promo.value}%` : `₹${promo.value}`} <span>OFF</span>
                    </h3>
                    <p className="promo-card-label">
                      on {promo.applicableLabel || 'your stay'}
                    </p>
                  </div>

                  <div className="promo-card-graphic">
                    <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="w-full h-full drop-shadow-lg">
                      <path 
                        d="M 10 0 H 90 A 10 10 0 0 1 100 10 V 20 A 15 15 0 0 0 100 50 V 60 A 10 10 0 0 1 90 70 H 10 A 10 10 0 0 1 0 60 V 10 A 10 10 0 0 1 10 0 Z" 
                        fill="currentColor" 
                      />
                      <line x1="75" y1="5" x2="75" y2="65" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeDasharray="4 4" />
                      <text x="37.5" y="48" fontSize="32" fill="rgba(0,0,0,0.3)" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        {promo.type === 'PERCENT' ? '%' : '₹'}
                      </text>
                    </svg>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="promo-card pointer-events-none opacity-80">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-gray-500">
                  No Offers Available
                </h3>
              </div>
              <p>
                Check back later
              </p>
            </div>
          )}
        </div>
      </div> */}

      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        <div className="mb-8">
          <div className="text-gray-900 font-semibold mb-3">Cash/UPI/Card Payment</div>

          <div className="mb-4">
            <div className="text-xs text-gray-800/70 mb-1">Payment method</div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30 w-full md:w-1/2"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          {createError && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{createError}</div>
          )}
          {createOk && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{createOk}</div>
          )}

          <div className="mt-4">
            <div className="text-gray-800 font-semibold mb-2">Staff</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Staff name</div>
                <input
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Staff full name"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="hidden md:block" />
              <div className="hidden md:block" />
            </div>
          </div>

          <div className="mt-6">
            <div className="text-gray-800 font-semibold mb-2">Guest details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Name</div>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Full name"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Email</div>
                <input
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@example.com"
                  type="email"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Phone</div>
                <input
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-gray-800 font-semibold mb-2">Booking details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Room</div>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Select room</option>
                  {roomsList.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Number of rooms</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(rooms) ? rooms : 1)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 1 : Number.parseInt(digits, 10);
                    setRooms(Math.max(1, Math.min(10, Number.isFinite(n) ? n : 1)));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(rooms) || rooms < 1) setRooms(1);
                  }}
                  placeholder="1"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="hidden md:block" />

              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-in date</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/yyyy"
                    value={checkInText}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCheckInText(v);
                      const iso = parseDmyToIso(v);
                      if (iso) setCheckIn(iso);
                    }}
                    onBlur={() => {
                      const iso = parseDmyToIso(checkInText);
                      if (iso) setCheckIn(iso);
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = checkInPickerRef.current;
                      if (!el) return;
                      const anyEl = el as any;
                      if (typeof anyEl.showPicker === "function") anyEl.showPicker();
                      else el.click();
                    }}
                    className="px-4 py-3 rounded-2xl border border-gold/20 bg-white hover:bg-gold/10 transition-colors"
                  >
                    Select
                  </button>
                  <input
                    ref={checkInPickerRef}
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCheckIn(v);
                      setCheckInText(v ? formatDateDmy(v) : "");
                    }}
                    min={todayIso}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
                {checkIn && (
                  <div className="text-[11px] text-gray-800/60">
                    {formatDateDmy(checkIn)} ({formatDateFriendly(checkIn)})
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-out date</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/yyyy"
                    value={checkOutText}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCheckOutText(v);
                      const iso = parseDmyToIso(v);
                      if (iso) setCheckOut(iso);
                    }}
                    onBlur={() => {
                      const iso = parseDmyToIso(checkOutText);
                      if (iso) setCheckOut(iso);
                    }}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = checkOutPickerRef.current;
                      if (!el) return;
                      const anyEl = el as any;
                      if (typeof anyEl.showPicker === "function") anyEl.showPicker();
                      else el.click();
                    }}
                    className="px-4 py-3 rounded-2xl border border-gold/20 bg-white hover:bg-gold/10 transition-colors"
                  >
                    Select
                  </button>
                  <input
                    ref={checkOutPickerRef}
                    type="date"
                    value={checkOut}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCheckOut(v);
                      setCheckOutText(v ? formatDateDmy(v) : "");
                    }}
                    min={checkOutMinIso}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
                {checkOut && (
                  <div className="text-[11px] text-gray-800/60">
                    {formatDateDmy(checkOut)} ({formatDateFriendly(checkOut)})
                  </div>
                )}
              </div>
              <div className="hidden md:block" />

              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-in time</div>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-out time</div>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="hidden md:block" />
            </div>
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Total guests</div>
                <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-gray-50 text-gray-700">
                  {adults + children + extraAdults}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Adults</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(adults) ? adults : 1)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 0 : Number.parseInt(digits, 10);
                    setAdults(Math.max(0, Number.isFinite(n) ? n : 0));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(adults) || adults < 0) setAdults(0);
                  }}
                  placeholder="2"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Children (5–10 yrs)</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(children) ? children : 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 0 : Number.parseInt(digits, 10);
                    setChildren(Math.max(0, Number.isFinite(n) ? n : 0));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(children) || children < 0) setChildren(0);
                  }}
                  placeholder="0"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Extra adults (10+ yrs)</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(extraAdults) ? extraAdults : 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 0 : Number.parseInt(digits, 10);
                    setExtraAdults(Math.max(0, Number.isFinite(n) ? n : 0));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(extraAdults) || extraAdults < 0) setExtraAdults(0);
                  }}
                  placeholder="0"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1">
              <div className="text-xs text-gray-800/70">Any further information (optional)</div>
              <input
                value={additionalInformation}
                onChange={(e) => setAdditionalInformation(e.target.value)}
                placeholder="Special requests, arrival details, etc."
                className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-gray-800 font-semibold">Meal plan (day-wise)</div>

            {nightDates.length === 0 ? (
              <div className="text-gray-800/60 text-sm mt-2">Select check-in and check-out dates to choose meal plans.</div>
            ) : (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {nightDates.map((d) => (
                  <div key={d} className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40 flex items-center justify-between gap-3">
                    <div className="text-gray-800/80 text-sm">{formatDateFriendly(d)}</div>
                    <select
                      value={mealPlanByDate[d] ?? "CP"}
                      onChange={(e) => setMealPlanByDate((prev) => ({ ...prev, [d]: e.target.value as MealPlan }))}
                      className="px-3 py-2 rounded-xl border border-gold/20 bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-sm"
                    >
                      {availablePlanOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="text-gray-800 font-semibold mb-3 text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-gold" />
              Offers & Promotions
            </div>
            
            {/* Promo Cards Scroll Area */}
            {checkIn && checkOut && visiblePromos.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 mb-4">
                {visiblePromos.map((promo: any) => {
                  const isActive = appliedPromo?.code === promo.code;
                  return (
                    <div
                      key={promo.id}
                      onClick={() => {
                        if (isActive) {
                          setAppliedPromo(null);
                          toast.info("Promo removed");
                        } else if (priceEstimate) {
                          setAppliedPromo({
                            code: promo.code,
                            type: promo.type,
                            value: Number(promo.value)
                          });
                          toast.success(`Promo ${promo.code} applied`);
                        }
                      }}
                      className={`min-w-[240px] p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                        isActive 
                          ? 'border-gold bg-gold/5 shadow-md' 
                          : 'border-gold/10 bg-white hover:border-gold/30'
                      }`}
                    >
                      <div className="relative z-10">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {promo.type === 'PERCENT' ? `${promo.value}%` : `₹${promo.value}`} <span className="text-xs font-normal">OFF</span>
                        </div>
                        <div className="text-sm font-semibold text-gold mb-2">{promo.code}</div>
                        {(promo.minNights != null || promo.maxNights != null) && (
                          <div className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                            {promo.minNights != null && promo.maxNights != null
                              ? promo.minNights === promo.maxNights
                                ? `For ${promo.minNights} night${promo.minNights === 1 ? '' : 's'}`
                                : `For ${promo.minNights}–${promo.maxNights} nights`
                              : promo.minNights != null
                                ? `Min ${promo.minNights} night${promo.minNights === 1 ? '' : 's'}`
                                : `Up to ${promo.maxNights} night${promo.maxNights === 1 ? '' : 's'}`}
                          </div>
                        )}
                        {promo.appliesTo && (
                          <div className="text-[10px] text-gold/80 font-semibold mt-1 uppercase">
                            {promo.appliesTo}
                          </div>
                        )}
                      </div>
                      <div className="absolute right-[-15px] top-[-15px] opacity-5 group-hover:opacity-10 transition-opacity">
                        <Tag className="w-20 h-20" />
                      </div>
                      {isActive && (
                        <div className="absolute top-2 right-2 text-gold">
                          <CheckCircle className="w-5 h-5 fill-gold text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-2">
              {!appliedPromo ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-1/2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    disabled={promoLoading || !promoInput.trim() || !priceEstimate}
                    onClick={async () => {
                      const code = promoInput.trim();
                      if (!code) return;
                      if (!priceEstimate) {
                        toast.error("Select room and dates first");
                        return;
                      }

                      setPromoLoading(true);
                      try {
                        const res = await fetch("/api/promos/validate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ code, baseAmount: Number(priceEstimate.base ?? 0) }),
                        });
                        const data = await res.json().catch(() => null);
                        if (!res.ok) {
                          toast.error(data?.message || "Invalid Promocode");
                          return;
                        }
                        const p = data?.data?.promo;
                        if (!p) {
                          toast.error("Invalid promo code");
                          return;
                        }
                        setAppliedPromo({
                          code: p.code,
                          type: p.type,
                          value: Number(p.value),
                          discountAmount: Number(data?.data?.discountAmount ?? 0)
                        });
                        toast.success("Promo applied");
                      } catch {
                        toast.error("Failed to apply promo code");
                      } finally {
                        setPromoLoading(false);
                      }
                    }}
                    className="px-6 py-3 rounded-2xl font-semibold bg-gray-900 text-ivory hover:bg-gray-800 transition-colors disabled:opacity-60"
                  >
                    {promoLoading ? "Applying…" : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="w-full md:w-1/2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gold/5 border-2 border-gold rounded-2xl px-6 py-4">
                  <div className="text-gray-800/80 min-w-0">
                    <div className="font-bold text-gray-900 text-lg break-words">{appliedPromo.code}</div>
                    <div className="text-sm font-medium text-gold/80">Applied: {formatInr(discountedEstimate?.discount ?? 0)} OFF</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedPromo(null);
                      toast.info("Promo removed");
                    }}
                    className="px-5 py-2 rounded-full border-2 border-gold/20 text-gray-800 font-semibold hover:bg-gold/5 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-gray-800 font-semibold">Price estimate</div>
            <div className="mt-2">
              {!selectedRoom ? (
                <div className="text-gray-800/60 text-sm">Select a room to load live pricing.</div>
              ) : !checkIn || !checkOut ? (
                <div className="text-gray-800/60 text-sm">Select check-in and check-out dates to load live pricing.</div>
              ) : livePlansLoading ? (
                <div className="text-gray-800/60 text-sm">Loading live prices…</div>
              ) : livePlansError ? (
                <div className="text-red-600 text-sm">{livePlansError}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="text-xs text-gray-800/70">EP (per night)</div>
                    <div className="text-gray-900 font-semibold">{formatInr(livePlans?.EP?.pricePerNight ?? 0)}</div>
                    <div className="text-xs text-gray-800/70 mt-1">Avail: {Number(livePlans?.EP?.availability ?? 0)}</div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="text-xs text-gray-800/70">CP (per night)</div>
                    <div className="text-gray-900 font-semibold">{formatInr(livePlans?.CP?.pricePerNight ?? 0)}</div>
                    <div className="text-xs text-gray-800/70 mt-1">Avail: {Number(livePlans?.CP?.availability ?? 0)}</div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="text-xs text-gray-800/70">MAP (per night)</div>
                    <div className="text-gray-900 font-semibold">{formatInr(livePlans?.MAP?.pricePerNight ?? 0)}</div>
                    <div className="text-xs text-gray-800/70 mt-1">Avail: {Number(livePlans?.MAP?.availability ?? 0)}</div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="text-xs text-gray-800/70">Global promo</div>
                    {globalPromo?.promoApplied ? (
                      <>
                        <div className="text-green-700 font-semibold">ACTIVE</div>
                        <div className="text-xs text-gray-800/70 mt-1">Flat OFF / night: {formatInr(globalPromo?.discountPerNight ?? 0)}</div>
                      </>
                    ) : (
                      <div className="text-gray-900 font-semibold">INACTIVE</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {!priceEstimate ? (
              <div className="text-gray-800/60 text-sm mt-2">Select room and dates to see an estimate.</div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-800/70">{baseLabel}</span>
                    <div className="flex items-center gap-2">
                      {isEditingPriceOverride ? (
                        <>
                          <input
                            value={priceOverrideInput}
                            onChange={(e) => setPriceOverrideInput(e.target.value)}
                            inputMode="numeric"
                            className="w-28 px-2 py-1 rounded-lg border border-gold/20 bg-white text-gray-900 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const raw = String(priceOverrideInput ?? "").trim();
                              const n = Number(raw);
                              if (!raw || !Number.isFinite(n) || n < 0) {
                                toast.error("Enter a valid base amount");
                                return;
                              }
                              setPriceOverrideBase(n);
                              setIsEditingPriceOverride(false);
                            }}
                            className="p-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingPriceOverride(false);
                              setPriceOverrideInput(String(effectiveEstimateForUi?.base ?? priceEstimate.base ?? ""));
                            }}
                            className="p-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-900 font-semibold">{formatInr(effectiveEstimateForUi?.base ?? priceEstimate.base)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingPriceOverride(true);
                              setPriceOverrideInput(String(effectiveEstimateForUi?.base ?? priceEstimate.base ?? ""));
                            }}
                            className="p-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
                            title="Edit base amount"
                          >
                            <Pencil size={16} />
                          </button>
                          {priceOverrideBase !== null && (
                            <button
                              type="button"
                              onClick={() => {
                                setPriceOverrideBase(null);
                                toast.info("Custom price removed");
                              }}
                              className="px-3 py-1 rounded-full border border-gold/20 text-gray-800/80 hover:bg-gold/10 transition-colors text-xs"
                              title="Remove custom price"
                            >
                              Reset
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {Number(effectiveEstimateForUi?.gst ?? (appliedPromo ? discountedEstimate?.gst : priceEstimate.gst) ?? 0) > 0 && (
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-800/70">GST (5%)</span>
                      <span className="text-gray-900 font-semibold">{formatInr(effectiveEstimateForUi?.gst ?? (appliedPromo ? discountedEstimate?.gst ?? 0 : priceEstimate.gst))}</span>
                    </div>
                  </div>
                )}
                {appliedPromo && (discountedEstimate?.discount ?? 0) > 0 && (
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-800/70">Promo Code: </span>
                        <span className="text-xs text-green-600 font-medium">{appliedPromo.code}</span>
                      </div>
                      <span className="text-green-600 font-semibold">-{formatInr(discountedEstimate?.discount ?? 0)}</span>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount</span>
                    <div className="flex items-center gap-2">
                      {isEditingTotalOverride ? (
                        <>
                          <input
                            value={totalOverrideInput}
                            onChange={(e) => setTotalOverrideInput(e.target.value)}
                            inputMode="numeric"
                            className="w-28 px-2 py-1 rounded-lg border border-gold/20 bg-white text-gray-900 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const raw = String(totalOverrideInput ?? "").trim();
                              const n = Number(raw);
                              if (!raw || !Number.isFinite(n) || n < 0) {
                                toast.error("Enter a valid total amount");
                                return;
                              }
                              setTotalOverride(n);
                              setIsEditingTotalOverride(false);
                            }}
                            className="p-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingTotalOverride(false);
                              setTotalOverrideInput(String(effectiveEstimateForUi?.total ?? priceEstimate.total ?? ""));
                            }}
                            className="p-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-bold text-gray-900">{formatInr(effectiveEstimateForUi?.total ?? (appliedPromo ? discountedEstimate?.total ?? priceEstimate.total : priceEstimate.total))}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingTotalOverride(true);
                              setTotalOverrideInput(String(effectiveEstimateForUi?.total ?? priceEstimate.total ?? ""));
                            }}
                            className="p-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
                            title="Edit total amount"
                          >
                            <Pencil size={16} />
                          </button>
                          {totalOverride !== null && (
                            <button
                              type="button"
                              onClick={() => {
                                setTotalOverride(null);
                                toast.info("Custom total removed");
                              }}
                              className="px-3 py-1 rounded-full border border-gold/20 text-gray-800/80 hover:bg-gold/10 transition-colors text-xs"
                              title="Remove custom total"
                            >
                              Reset
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={submitManualBooking}
              disabled={creating}
              className="px-5 py-2.5 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create CONFIRMED booking"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : confirmedBookings.length === 0 ? (
          <div className="text-gray-800/70">No CONFIRMED bookings found.</div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div>
                  <label className="block text-xs text-gray-800/70 mb-1">Search</label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search booking / user / room / staff"
                    className="w-full md:w-72 px-4 py-2.5 rounded-2xl border border-gold/20 focus:outline-none focus:border-gold transition-colors bg-ivory/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-800/70 mb-1">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full md:w-44 px-4 py-2.5 rounded-2xl border border-gold/20 focus:outline-none focus:border-gold transition-colors bg-ivory/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-800/70 mb-1">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full md:w-44 px-4 py-2.5 rounded-2xl border border-gold/20 focus:outline-none focus:border-gold transition-colors bg-ivory/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFromDate("");
                    setToDate("");
                  }}
                  className="px-4 py-2.5 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors md:mb-[1px]"
                >
                  Clear
                </button>
              </div>

              <button
                type="button"
                onClick={downloadBookingsCsv}
                className="px-4 py-2.5 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors"
              >
                Download CSV
              </button>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-gray-800/70">No matching CONFIRMED bookings found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead>
                    <tr className="text-gray-800/60 text-sm">
                      <th className="py-3 pr-4">Booking ID</th>
                      <th className="py-3 pr-4">Staff</th>
                      <th className="py-3 pr-4">User</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Phone</th>
                      <th className="py-3 pr-4">Room</th>
                      <th className="py-3 pr-4">Dates</th>
                      <th className="py-3 pr-4">Promo</th>
                      <th className="py-3 pr-4">Discount</th>
                      <th className="py-3 pr-4">Amount</th>
                      <th className="py-3 pr-4">Payment</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3">Invoice</th>
                      <th className="py-3">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      const paid = Array.isArray((b as any)?.payments)
                        ? (b as any).payments.find((p: any) => String(p?.status ?? "").toUpperCase() === "PAID")
                        : null;

                      return (
                        <tr key={b.id} className="border-t border-gold/10">
                          <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">
                            {(() => {
                              const n = Number((b as any)?.bookingNo);
                              return Number.isFinite(n) && n > 0 ? `VVR-${n}` : b.id;
                            })()}
                          </td>
                          <td className="py-3 pr-4 text-gray-800/80">{String((b as any)?.staffName ?? "—")}</td>
                          <td className="py-3 pr-4 text-gray-800/80">{String((b as any)?.user?.name ?? "—")}</td>
                          <td className="py-3 pr-4 text-gray-800/80">{String((b as any)?.user?.email ?? "—")}</td>
                          <td className="py-3 pr-4 text-gray-800/80">{String((b as any)?.user?.phone ?? "—")}</td>
                          <td className="py-3 pr-4 text-gray-800/80">{String((b as any)?.room?.title ?? "—")}</td>
                          <td className="py-3 pr-4 text-gray-800/80">
                            {(() => {
                              const ci = (b as any)?.checkIn ? new Date((b as any).checkIn) : null;
                              const co = (b as any)?.checkOut ? new Date((b as any).checkOut) : null;
                              const ciTxt = ci && Number.isFinite(ci.getTime()) ? ci.toLocaleDateString("en-IN") : "—";
                              const coTxt = co && Number.isFinite(co.getTime()) ? co.toLocaleDateString("en-IN") : "—";
                              return `${ciTxt} - ${coTxt}`;
                            })()}
                          </td>
                          <td className="py-3 pr-4 text-gray-800/80">
                            {(() => {
                              const code = String((b as any)?.promoCode ?? '').trim();
                              const d = Number((b as any)?.discountAmount ?? 0);
                              const hasDiscount = Number.isFinite(d) && d > 0;
                              if (code) return code;
                              return hasDiscount ? 'GLOBAL' : '—';
                            })()}
                          </td>
                          <td className="py-3 pr-4 text-gray-800/80">
                            {(() => {
                              const d = Number((b as any)?.discountAmount ?? 0);
                              return Number.isFinite(d) && d > 0 ? formatInr(d) : '—';
                            })()}
                          </td>
                          <td className="py-3 pr-4 text-gray-800/80">{formatInr((b as any)?.amount)}</td>
                          <td className="py-3 pr-4 text-gray-800/80">{formatMethod((paid as any)?.method)}</td>
                          <td className="py-3 pr-4 text-gray-800/80">{String((b as any)?.status ?? "—")}</td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => downloadInvoice(b)}
                              className="px-4 py-2 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm"
                            >
                              Download
                            </button>
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => deleteBooking(b.id)}
                              className="p-2 rounded-full border border-gold/20 text-gray-800/80 hover:bg-gold/10 transition-colors"
                              title="Delete booking"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;