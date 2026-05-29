import Navbar from '@/components/Navbar';
import Footer from '../components/Footer';
import FloatingContact from '../components/FloatingContact';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { usePolicyModals } from '@/components/PolicyModals';
import { Star, Tag, CheckCircle } from 'lucide-react';
import { roomDatabaseService, DatabaseRoom } from '../lib/roomDatabase.service';
import { roomService } from '../lib/roomService';

type RoomDetails = {
  id: string | number;
  title: string;
  description: string;
  pricePerNight: number;
  epPricePerNight?: number | null;
  cpPricePerNight?: number | null;
  mapPricePerNight?: number | null;
  person: number;
  amenities: string[];
  images: string[];
  availableRooms: number;
  day_wise_beforediscount?: any;
};

type MealPlan = 'EP' | 'CP' | 'MAP';

type EzeeRawRoom = any;

const normalizeRoomType = (value: string) => {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const lower = raw.toLowerCase();

  if (lower === "deluxe studio suite") return "Deluxe Studio Suite";
  if (lower === "deluxe edge view" || lower === "deluxe edge view ") return "Deluxe Edge View";
  if (lower === "lotus family suite") return "Lotus Family Suite";
  if (lower === "presidential suite" || lower === "presidentail suite") return "Presidential Suite";

  return raw;
};

const baseRoomTypeFromApiName = (roomName: string) => {
  const raw = String(roomName ?? '').trim();
  if (!raw) return '';
  const base = raw.split(' - ')[0] ?? raw;
  return normalizeRoomType(base);
};

const parseRoomFromDatabase = async (id: string): Promise<RoomDetails | null> => {
  try {
    const response = await roomDatabaseService.getDatabaseRooms();
    
    if (!response.success) {
      return null;
    }

    const room = response.rooms.find((r: DatabaseRoom) => String(r.id) === String(id));

    if (!room) return null;

    return {
      id: room.id,
      title: room.title,
      description: room.description,
      pricePerNight: room.pricePerNight,
      epPricePerNight: room.epPricePerNight,
      cpPricePerNight: room.cpPricePerNight,
      mapPricePerNight: room.mapPricePerNight,
      person: room.person,
      amenities: room.amenities.map((a: any) => a?.name).filter(Boolean),
      images: room.images.length > 0 ? room.images.map((img: any) => img.url) : ['/images/room/1.jpeg'],
      availableRooms: room.availableRooms,
    };
  } catch {
    return null;
  }
};

const Booking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roomNameFromQuery = useMemo(() => {
    const raw = searchParams.get('room');
    return raw ? String(raw).trim() : '';
  }, [searchParams]);

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [resolvedRoomId, setResolvedRoomId] = useState<number | null>(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  });

  const [ezeeLoading, setEzeeLoading] = useState(false);
  const [ezeeError, setEzeeError] = useState<string | null>(null);
  const [ezeePlans, setEzeePlans] = useState<{
    EP?: { pricePerNight: number; availability: number; extraAdultPerNight: number; extraChildPerNight: number };
    CP?: { pricePerNight: number; availability: number; extraAdultPerNight: number; extraChildPerNight: number };
    MAP?: { pricePerNight: number; availability: number; extraAdultPerNight: number; extraChildPerNight: number };
  }>({});

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [checkInText, setCheckInText] = useState('');
  const [checkOutText, setCheckOutText] = useState('');
  const [checkInTime, setCheckInTime] = useState('13:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [rooms, setRooms] = useState(1);
  const [children5To10, setChildren5To10] = useState(0);
  const [extraAdultsAbove10, setExtraAdultsAbove10] = useState(0);
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type?: string; value?: number; discountAmount?: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [activePromos, setActivePromos] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/promos');
        const data = await res.json().catch(() => null);
        if (data?.ok && Array.isArray(data?.data?.promos)) {
          setActivePromos(data.data.promos.filter((p: any) => p.isActive && p.promoScope !== 'GLOBAL_FLAT'));
        }
      } catch { /* ignore */ }
    })();

    try {
      const sp = sessionStorage.getItem('selectedPromo');
      if (sp) {
        const promo = JSON.parse(sp);
        setAppliedPromo({
          code: promo.code,
          type: promo.type,
          value: Number(promo.value)
        });
        sessionStorage.removeItem('selectedPromo');
        setTimeout(() => {
          document.getElementById('promo-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    } catch { /* ignore */ }
  }, []);

  const [globalPromo, setGlobalPromo] = useState<{
    promoApplied: boolean;
    originalPerNight: number;
    finalPerNight: number;
    discountPerNight: number;
  } | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const { openTerms } = usePolicyModals();

  const [mealPlanByDate, setMealPlanByDate] = useState<Record<string, MealPlan>>({});

  const epAvailable = useMemo(() => {
    const p = Number(ezeePlans?.EP?.pricePerNight ?? 0);
    return Number.isFinite(p) && p > 0;
  }, [ezeePlans?.EP?.pricePerNight]);

  const checkInPickerRef = useRef<HTMLInputElement | null>(null);
  const checkOutPickerRef = useRef<HTMLInputElement | null>(null);
  const lastDateRangeKeyRef = useRef<string>('');

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
    const iso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    return iso;
  };

  const pendingKey = useMemo(() => {
    if (id) return `pending_booking:id:${id}`;
    if (roomNameFromQuery) return `pending_booking:room:${normalizeRoomType(roomNameFromQuery)}`;
    return '';
  }, [id, roomNameFromQuery]);

  const savePendingBooking = () => {
    if (!pendingKey) return;
    try {
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({
          checkIn,
          checkOut,
          checkInTime,
          checkOutTime,
          rooms,
          children5To10,
          extraAdultsAbove10,
          additionalInformation,
          promoInput,
          appliedPromo,
          termsAccepted,
          mealPlanByDate,
        })
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!pendingKey) return;
    try {
      sessionStorage.setItem('last_booking_redirect', `${location.pathname}${location.search}`);
    } catch {
      // ignore
    }
    try {
      const raw = sessionStorage.getItem(pendingKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.checkIn === 'string') setCheckIn(parsed.checkIn);
      if (typeof parsed?.checkOut === 'string') setCheckOut(parsed.checkOut);
      if (typeof parsed?.checkInTime === 'string') setCheckInTime(parsed.checkInTime);
      if (typeof parsed?.checkOutTime === 'string') setCheckOutTime(parsed.checkOutTime);
      if (Number.isFinite(Number(parsed?.rooms))) setRooms(Number(parsed.rooms));
      if (Number.isFinite(Number(parsed?.children5To10))) setChildren5To10(Number(parsed.children5To10));
      if (Number.isFinite(Number(parsed?.extraAdultsAbove10))) setExtraAdultsAbove10(Number(parsed.extraAdultsAbove10));
      if (typeof parsed?.additionalInformation === 'string') setAdditionalInformation(parsed.additionalInformation);
      if (typeof parsed?.promoInput === 'string') setPromoInput(parsed.promoInput);
      if (parsed?.appliedPromo && typeof parsed?.appliedPromo?.code === 'string') {
        setAppliedPromo(parsed.appliedPromo);
      }
      if (typeof parsed?.termsAccepted === 'boolean') setTermsAccepted(parsed.termsAccepted);
      if (parsed?.mealPlanByDate && typeof parsed.mealPlanByDate === 'object') {
        setMealPlanByDate(parsed.mealPlanByDate as any);
      }
      toast.info('Continue your booking and proceed to payment.');
    } catch {
      // ignore
    }
  }, [pendingKey]);

  useEffect(() => {
    setCheckInText(checkIn ? formatDateDmy(checkIn) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn]);

  useEffect(() => {
    setCheckOutText(checkOut ? formatDateDmy(checkOut) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOut]);

  useEffect(() => {
    const controller = new AbortController();

    const loadRoom = async () => {
      if (!id) {
        setIsLoading(false);
        setRoom(
          roomNameFromQuery
            ? {
                id: roomNameFromQuery,
                title: roomNameFromQuery,
                description: '',
                pricePerNight: 0,
                epPricePerNight: null,
                cpPricePerNight: null,
                mapPricePerNight: null,
                person: 2,
                amenities: [],
                images: ['/images/room/1.jpeg'],
                availableRooms: 0,
              }
            : null
        );
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch(`/api/rooms/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load room');
        const data = await res.json();

        const normalized: RoomDetails = {
          id,
          title: data?.title ?? data?.name ?? 'Suite',
          description: data?.description ?? '',
          pricePerNight: Number(data?.pricePerNight ?? data?.price ?? 0),
          epPricePerNight: data?.epPricePerNight ?? null,
          cpPricePerNight: data?.cpPricePerNight ?? null,
          mapPricePerNight: data?.mapPricePerNight ?? null,
          person: Number(data?.person ?? 2),
          amenities: (data?.amenities ?? []).map((a: any) => (typeof a === 'string' ? a : a?.name)).filter(Boolean),
          images: data?.images ?? [],
          availableRooms: data?.availableRooms ?? 0,
        };

        setRoom(normalized);
      } catch {
        const fallback = await parseRoomFromDatabase(id);
        setRoom(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoom();
    return () => controller.abort();
  }, [id, roomNameFromQuery]);

  useEffect(() => {
    const n = Number(id);
    if (Number.isFinite(n)) {
      setResolvedRoomId(n);
    }
  }, [id]);

  useEffect(() => {
    const title = String(roomNameFromQuery ?? '').trim();
    if (!title) return;
    if (resolvedRoomId) return;

    let cancelled = false;
    const run = async () => {
      try {
        const response = await roomDatabaseService.getDatabaseRooms();
        if (!response.success) return;

        const match = response.rooms.find((r: DatabaseRoom) => {
          const t = String(r?.title ?? '').trim().toLowerCase();
          const q = title.toLowerCase();
          return t === q || t.includes(q) || q.includes(t);
        });
        if (!cancelled && match?.id != null) {
          setResolvedRoomId(Number(match.id));
          setRoom((prev) => (prev ? { ...prev, id: match.id, title: match.title } : prev));
        }
      } catch {
        // ignore
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [roomNameFromQuery, resolvedRoomId]);

  const getPlanFromRoomName = (name: string): MealPlan | null => {
    const upper = String(name ?? '').toUpperCase();
    if (upper.includes(' - EP') || upper.endsWith('EP')) return 'EP';
    if (upper.includes(' - CP') || upper.endsWith('CP')) return 'CP';
    if (upper.includes(' - MAP') || upper.endsWith('MAP')) return 'MAP';
    if (upper.includes(' - AP') || upper.endsWith('AP')) return null;
    return null;
  };

const extractPricePerNight = (r: EzeeRawRoom): number => {
    const rateInfo = r?.room_rates_info || {};

    const extractAvgFromDayWise = (dayWise: any): number => {
      if (!dayWise) return 0;
      if (Array.isArray(dayWise)) {
        const values = dayWise
          .map((v: any) => Number(v))
          .filter((v: any) => Number.isFinite(v) && v > 0);
        if (values.length === 0) return 0;
        return values.reduce((a: number, b: number) => a + b, 0) / values.length;
      }
      if (typeof dayWise === 'object') {
        const values = Object.values(dayWise)
          .map((v: any) => Number(v))
          .filter((v: any) => Number.isFinite(v) && v > 0);
        if (values.length === 0) return 0;
        return values.reduce((a: number, b: number) => a + b, 0) / values.length;
      }
      return 0;
    };
    
    console.log(`[FRONTEND DEBUG] extractPricePerNight for room: ${r.Room_Name}`, {
      day_wise_beforediscount: rateInfo.day_wise_beforediscount,
      rack_rate: rateInfo.rack_rate,
      avg_price_per_night: r.avg_price_per_night,
      avg_per_night_after_discount: rateInfo.avg_per_night_after_discount,
      totalprice_inclusive_all: rateInfo.totalprice_inclusive_all,
      exclusive_tax: rateInfo.exclusive_tax
    });
    
    // PRIORITIZE day_wise_beforediscount as primary price source
    let price = 0;
    const dayWise = extractAvgFromDayWise(rateInfo.day_wise_beforediscount);
    if (Number.isFinite(dayWise) && dayWise > 0) {
      price = dayWise;
      console.log(`[FRONTEND DEBUG] Using day_wise_beforediscount (avg): ${price}`);
    } else if (rateInfo.avg_per_night_after_discount) {
      price = Number(rateInfo.avg_per_night_after_discount);
      console.log(`[FRONTEND DEBUG] Using avg_per_night_after_discount: ${price}`);
    } else if (rateInfo.avg_per_night_before_discount) {
      price = Number(rateInfo.avg_per_night_before_discount);
      console.log(`[FRONTEND DEBUG] Using avg_per_night_before_discount: ${price}`);
    } else if (rateInfo.totalprice_inclusive_all && nights > 0) {
      price = Number(rateInfo.totalprice_inclusive_all) / nights;
      console.log(`[FRONTEND DEBUG] Using totalprice_inclusive_all / nights: ${rateInfo.totalprice_inclusive_all} / ${nights} = ${price}`);
    } else if (rateInfo.totalprice_room_only && nights > 0) {
      price = Number(rateInfo.totalprice_room_only) / nights;
      console.log(`[FRONTEND DEBUG] Using totalprice_room_only / nights: ${rateInfo.totalprice_room_only} / ${nights} = ${price}`);
    } else if (rateInfo.exclusive_tax && typeof rateInfo.exclusive_tax === 'object') {
      const taxValues = Object.values(rateInfo.exclusive_tax)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (taxValues.length > 0) {
        price = taxValues[0];
        console.log(`[FRONTEND DEBUG] Using exclusive_tax value: ${price}`);
      }
    }
    
    // Final fallback to original avg_price_per_night
    if (price === 0) {
      price = Number(r.avg_price_per_night ?? 0);
      console.log(`[FRONTEND DEBUG] Using fallback avg_price_per_night: ${price}`);
    }
    
    console.log(`[FRONTEND DEBUG] Final extracted price: ${price}`);
    return price;
  };

  const extractAvailability = (r: EzeeRawRoom): number => {
    const minAvail = Number(r?.min_ava_rooms);
    if (Number.isFinite(minAvail)) return Math.max(0, minAvail);
    const avail = r?.available_rooms;
    if (avail && typeof avail === 'object') {
      const values = Object.values(avail)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v));
      if (values.length > 0) return Math.max(0, Math.min(...values));
    }
    const fallback = Number(r?.available_rooms ?? 0);
    return Number.isFinite(fallback) ? Math.max(0, fallback) : 0;
  };

  const extractExtraPerNight = (extra: any): number => {
    if (!extra || typeof extra !== 'object') return 0;
    // Use rack_rate as primary base if available
    const rack = Number(extra?.rack_rate ?? 0);
    if (Number.isFinite(rack) && rack > 0) {
      console.log(`[FRONTEND DEBUG] Using extra rack_rate: ${rack}`);
      return rack;
    }
    // Prefer inclusive_tax_adjustment (first night), fallback to exclusive_tax
    const inc = extra?.inclusive_tax_adjustment;
    if (inc && typeof inc === 'object') {
      const values = Object.values(inc)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) {
        console.log(`[FRONTEND DEBUG] Using extra inclusive_tax_adjustment: ${values[0]}`);
        return values[0];
      }
    }
    const excl = extra?.exclusive_tax;
    if (excl && typeof excl === 'object') {
      const values = Object.values(excl)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) {
        console.log(`[FRONTEND DEBUG] Using extra exclusive_tax: ${values[0]}`);
        return values[0];
      }
    }
    console.log(`[FRONTEND DEBUG] No extra rate found, returning 0`);
    return 0;
  };

  useEffect(() => {
    const title = String(room?.title ?? roomNameFromQuery ?? '').trim();
    if (!title) return;
    if (!checkIn || !checkOut) return;

    let cancelled = false;
    const run = async () => {
      setEzeeLoading(true);
      setEzeeError(null);
      try {
        const adultsCount = (() => {
          const baseAdults = Number(room?.person ?? 2);
          const extraAdults = Number(extraAdultsAbove10 ?? 0);
          const computed = baseAdults + extraAdults;
          return Number.isFinite(computed) && computed > 0 ? computed : baseAdults;
        })();

        const resp = await roomService.getRoomList({
          checkIn,
          checkOut,
          adults: Number.isFinite(adultsCount) ? adultsCount : 1,
          children: Number.isFinite(children5To10) ? children5To10 : 0,
          rooms: Number.isFinite(rooms) ? rooms : 1,
        });

        if (resp.ok && resp.data.rooms.length > 0) {
          console.log('[FRONTEND DEBUG] getRoomList response:', resp.data.rooms);
          
          const plans: {
            EP?: { pricePerNight: number; availability: number; extraAdultPerNight: number; extraChildPerNight: number };
            CP?: { pricePerNight: number; availability: number; extraAdultPerNight: number; extraChildPerNight: number };
            MAP?: { pricePerNight: number; availability: number; extraAdultPerNight: number; extraChildPerNight: number };
          } = {};

          for (const r of resp.data.rooms) {
            const planHint = String(r?.Room_Name ?? '');
            const plan = getPlanFromRoomName(planHint);
            if (!plan) continue;
            
            const extracted = extractPricePerNight(r);
            const price = Number.isFinite(extracted) && extracted > 0 ? extracted : Number(r.avg_price_per_night || r.pricePerNight || 0);
            const availability = extractAvailability(r);
            // Use rack_rate_adult and rack_rate_child if available, otherwise fall back to extraction
            const extraAdultPerNight = r.rack_rate_adult && Number.isFinite(Number(r.rack_rate_adult)) && Number(r.rack_rate_adult) > 0 
              ? Number(r.rack_rate_adult) 
              : extractExtraPerNight(r?.extra_adult_rates_info);
            const extraChildPerNight = r.rack_rate_child && Number.isFinite(Number(r.rack_rate_child)) && Number(r.rack_rate_child) > 0
              ? Number(r.rack_rate_child)
              : extractExtraPerNight(r?.extra_child_rates_info);
            
            console.log(`[FRONTEND DEBUG] Processed plan ${plan}:`, {
              price,
              availability,
              roomName: r.Room_Name,
              avg_price_per_night: r.avg_price_per_night,
              pricePerNight: r.pricePerNight
            });
            
            plans[plan] = { pricePerNight: price, availability, extraAdultPerNight, extraChildPerNight };
          }

          if (!cancelled) {
            setEzeePlans(plans);
            
            // Find the specific room that matches the selected room type to get its day-wise before-discount rates
            const titleNorm = normalizeRoomType(String(room?.title ?? roomNameFromQuery ?? ''));
            const getAnyRoomTypeName = (r: any) => {
              return String(r?.Roomtype_Name ?? r?.Roomtype ?? r?.Room_Name ?? '').trim();
            };
            const match = (r: any) => {
              const raw = getAnyRoomTypeName(r);
              if (!raw) return false;
              const base = raw.split(' - ')[0] ?? raw;
              return normalizeRoomType(base) === titleNorm;
            };
            
            const matchingRoom = resp.data.rooms.find(match);
            const baseDayWise = (matchingRoom as any)?.day_wise_beforediscount ?? (matchingRoom as any)?.room_rates_info?.day_wise_beforediscount;
            const baseDayWiseAvg = (() => {
              if (!baseDayWise) return null;
              if (Array.isArray(baseDayWise)) {
                const vals = baseDayWise.map((v: any) => Number(v)).filter((v: any) => Number.isFinite(v) && v > 0);
                if (vals.length === 0) return null;
                return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
              }
              if (typeof baseDayWise === 'object') {
                const vals = Object.values(baseDayWise).map((v: any) => Number(v)).filter((v: any) => Number.isFinite(v) && v > 0);
                if (vals.length === 0) return null;
                return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
              }
              return null;
            })();
            
            console.log('[FRONTEND DEBUG] Found matching room for day_wise_beforediscount:', {
              roomTitle: room?.title,
              roomNameFromQuery,
              titleNorm,
              matchingRoom: matchingRoom?.Room_Name,
              day_wise_beforediscount: baseDayWise,
              baseDayWiseAvg,
            });
            
            const bestPlanPerNight =
              Number(plans?.CP?.pricePerNight ?? 0) ||
              Number(plans?.MAP?.pricePerNight ?? 0) ||
              Number(plans?.EP?.pricePerNight ?? 0) ||
              0;
            const anyAvail = Math.max(
              Number(plans?.EP?.availability ?? 0),
              Number(plans?.CP?.availability ?? 0),
              Number(plans?.MAP?.availability ?? 0)
            );
            setRoom((prev) =>
              prev
                ? {
                    ...prev,
                    availableRooms: Number.isFinite(anyAvail) ? anyAvail : prev.availableRooms,
                    pricePerNight:
                      Number(prev?.pricePerNight ?? 0) > 0
                        ? prev.pricePerNight
                        : baseDayWiseAvg && Number.isFinite(baseDayWiseAvg) && baseDayWiseAvg > 0
                          ? baseDayWiseAvg
                          : Number.isFinite(bestPlanPerNight) && bestPlanPerNight > 0
                            ? bestPlanPerNight
                            : prev.pricePerNight,
                    day_wise_beforediscount: baseDayWise ?? prev.day_wise_beforediscount,
                  }
                : prev
            );
          }
        } else {
          throw new Error(resp.message || resp.error || 'Failed to fetch live rooms');
        }
      } catch (e: any) {
        if (!cancelled) {
          setEzeePlans({});
          setEzeeError(String(e?.message ?? 'Unable to fetch live prices'));
        }
      } finally {
        if (!cancelled) setEzeeLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [room?.title, roomNameFromQuery, checkIn, checkOut, room?.person, extraAdultsAbove10, children5To10, rooms]);

  useEffect(() => {
    const title = String(room?.title ?? roomNameFromQuery ?? '').trim();
    if (!title) return;
    if (!checkIn || !checkOut) return;

    let cancelled = false;
    const run = async () => {
      try {
        const resp = await roomService.getRoomList({
          checkIn,
          checkOut,
          adults: 1,
          children: 0,
          rooms: 1,
        });

        if (!resp.ok) {
          if (!cancelled) setGlobalPromo(null);
          return;
        }

        const titleNorm = normalizeRoomType(title);
        const getAnyRoomTypeName = (r: any) => {
          return String(r?.Roomtype_Name ?? r?.Roomtype ?? r?.Room_Name ?? '').trim();
        };
        const match = (r: any) => {
          const raw = getAnyRoomTypeName(r);
          if (!raw) return false;
          return baseRoomTypeFromApiName(raw) === titleNorm;
        };
        const isCp = (r: any) => String(r?.Room_Name ?? '').toUpperCase().includes('CP');

        const cpRoom = (resp.data.rooms ?? []).find((r: any) => match(r) && isCp(r));
        const anyRoom = cpRoom ?? (resp.data.rooms ?? []).find((r: any) => match(r));
        if (!anyRoom) {
          if (!cancelled) setGlobalPromo(null);
          return;
        }

        const promoApplied = Boolean(anyRoom?.promo_applied);
        const originalPerNight = Number(anyRoom?.original_price ?? 0);
        const finalPerNight = Number(anyRoom?.final_price ?? 0);
        const discountPerNight = Number(anyRoom?.discount_amount ?? 0);

        if (!cancelled) {
          setGlobalPromo({
            promoApplied,
            originalPerNight: Number.isFinite(originalPerNight) ? originalPerNight : 0,
            finalPerNight: Number.isFinite(finalPerNight) ? finalPerNight : 0,
            discountPerNight: Number.isFinite(discountPerNight) ? discountPerNight : 0,
          });
        }
      } catch {
        if (!cancelled) setGlobalPromo(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [room?.title, roomNameFromQuery, checkIn, checkOut]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const nightDates = useMemo(() => {
    if (!checkIn || nights <= 0) return [] as string[];
    const start = new Date(checkIn);
    if (!Number.isFinite(start.getTime())) return [] as string[];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const out: string[] = [];
    for (let i = 0; i < nights; i++) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      out.push(`${yyyy}-${mm}-${dd}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [checkIn, nights]);

  const visiblePromos = useMemo(() => {
    // Before dates are selected, show all promos
    if (nights === 0) return activePromos;

    // After dates are selected, only show promos matching the selected duration
    return activePromos.filter((p: any) => {
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
  }, [activePromos, nights]);

  useEffect(() => {
    const key = `${checkIn || ''}|${checkOut || ''}`;
    if (key !== lastDateRangeKeyRef.current) {
      lastDateRangeKeyRef.current = key;
      setMealPlanByDate({});
      
      // Auto-discard promo if it no longer fits the date range
      if (appliedPromo) {
        const promoData = activePromos.find(p => p.code === appliedPromo.code);
        if (promoData) {
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
            toast.info(`Promo code ${appliedPromo.code} removed (not valid for selected dates)`);
          }
        }
      }
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (!nightDates.length) return;
    setMealPlanByDate((prev) => {
      const next: Record<string, MealPlan> = {};
      for (const d of nightDates) {
        const plan = prev[d];
        next[d] = plan === 'EP' || plan === 'CP' || plan === 'MAP' ? plan : 'CP';
      }
      return next;
    });
  }, [nightDates]);

  useEffect(() => {
    // If EP isn't available for this room/date range, remove EP from any previously-selected day-wise plans.
    if (!nightDates.length) return;
    if (epAvailable) return;
    setMealPlanByDate((prev) => {
      const next: Record<string, MealPlan> = { ...prev };
      let changed = false;
      for (const d of nightDates) {
        if (next[d] === 'EP') {
          next[d] = 'CP';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [epAvailable, nightDates]);

  const todayIso = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const checkOutMinIso = useMemo(() => {
    if (!checkIn) return todayIso;
    const d = new Date(checkIn);
    if (!Number.isFinite(d.getTime())) return todayIso;
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [checkIn, todayIso]);

  const totalGuests = useMemo(() => {
    const base = Number(room?.person ?? 2);
    const kids = Number(children5To10 ?? 0);
    const extraAdults = Number(extraAdultsAbove10 ?? 0);
    const computed = base + kids + extraAdults;
    return Number.isFinite(computed) && computed > 0 ? computed : base;
  }, [room?.person, children5To10, extraAdultsAbove10]);

  const effectivePlanPrice = useMemo(() => {
    // Use the same pricing logic as the room page
    const baseDayWise = (room as any)?.day_wise_beforediscount;
    const baseDayWiseAvg = (() => {
      if (!baseDayWise) return 0;
      if (Array.isArray(baseDayWise)) {
        const vals = baseDayWise.map((v: any) => Number(v)).filter((v: any) => Number.isFinite(v) && v > 0);
        if (vals.length === 0) return 0;
        return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      }
      if (typeof baseDayWise === 'object') {
        const vals = Object.values(baseDayWise).map((v: any) => Number(v)).filter((v: any) => Number.isFinite(v) && v > 0);
        if (vals.length === 0) return 0;
        return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      }
      return 0;
    })();
    const basePrice = baseDayWiseAvg > 0 ? baseDayWiseAvg : Number(room?.pricePerNight ?? 0);
    
    // Calculate EP/CP/MAP prices based on base price
    const epPrice = basePrice;
    const cpPrice = basePrice + 500;
    const mapPrice = basePrice + 1000;

    console.log('[FRONTEND DEBUG] effectivePlanPrice calculated:', {
      pricePerNight: room?.pricePerNight,
      basePrice,
      epPrice,
      cpPrice,
      mapPrice,
    });

    // Always use our calculated prices to ensure consistency with room page
    return {
      EP: epPrice,
      CP: cpPrice,
      MAP: mapPrice,
    } as Record<MealPlan, number>;
  }, [room?.pricePerNight, (room as any)?.day_wise_beforediscount, room?.title, roomNameFromQuery]);

  const effectiveExtraAdultPerNight = useMemo(() => {
    const ep = Number(ezeePlans?.EP?.extraAdultPerNight ?? 0);
    const cp = Number(ezeePlans?.CP?.extraAdultPerNight ?? 0);
    const map = Number(ezeePlans?.MAP?.extraAdultPerNight ?? 0);
    return {
      EP: Number.isFinite(ep) ? ep : 0,
      CP: Number.isFinite(cp) ? cp : 0,
      MAP: Number.isFinite(map) ? map : 0,
    } as Record<MealPlan, number>;
  }, [ezeePlans?.CP?.extraAdultPerNight, ezeePlans?.EP?.extraAdultPerNight, ezeePlans?.MAP?.extraAdultPerNight]);

  const effectiveExtraChildPerNight = useMemo(() => {
    const ep = Number(ezeePlans?.EP?.extraChildPerNight ?? 0);
    const cp = Number(ezeePlans?.CP?.extraChildPerNight ?? 0);
    const map = Number(ezeePlans?.MAP?.extraChildPerNight ?? 0);
    return {
      EP: Number.isFinite(ep) ? ep : 0,
      CP: Number.isFinite(cp) ? cp : 0,
      MAP: Number.isFinite(map) ? map : 0,
    } as Record<MealPlan, number>;
  }, [ezeePlans?.CP?.extraChildPerNight, ezeePlans?.EP?.extraChildPerNight, ezeePlans?.MAP?.extraChildPerNight]);

  const selectedPlan = useMemo(() => {
    if (!nightDates.length) return 'CP' as MealPlan;
    let hasCp = false;
    let hasMap = false;
    let hasEp = false;
    for (const d of nightDates) {
      const p = mealPlanByDate[d] ?? 'CP';
      if (p === 'MAP') hasMap = true;
      if (p === 'CP') hasCp = true;
      if (p === 'EP') hasEp = true;
    }
    if (hasMap) return 'MAP' as MealPlan;
    if (hasCp) return 'CP' as MealPlan;
    if (hasEp) return 'EP' as MealPlan;
    return 'CP' as MealPlan;
  }, [mealPlanByDate, nightDates]);

  const adults = useMemo(() => {
    const baseAdults = Number(room?.person ?? 2);
    const extraAdults = Number(extraAdultsAbove10 ?? 0);
    const computed = baseAdults + extraAdults;
    return Number.isFinite(computed) && computed > 0 ? computed : baseAdults;
  }, [room?.person, extraAdultsAbove10]);

  const formatInr = (value: any) => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return String(value ?? '0');
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      return String(n);
    }
  };

  const priceBreakdown = useMemo(() => {
    console.log('[FRONTEND DEBUG] priceBreakdown recalculated with mealPlanByDate:', mealPlanByDate);
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const safeRooms = Number.isFinite(rooms) && rooms > 0 ? rooms : 1;

    const basePerNight = Number(room?.pricePerNight ?? 0);
    const roomTotal = round2(
      nightDates.reduce((sum, d) => {
        const plan = mealPlanByDate[d] ?? 'CP';
        const pn = effectivePlanPrice[plan] ?? basePerNight;
        console.log(`[FRONTEND DEBUG] Date ${d}, plan ${plan}, price ${pn}`);
        return sum + pn;
      }, 0) * safeRooms
    );

    const childCharge = round2(
      nightDates.reduce((sum, d) => {
        const plan = mealPlanByDate[d] ?? 'CP';
        const perNight = effectiveExtraChildPerNight[plan] ?? 0;
        return sum + perNight;
      }, 0) * children5To10 * safeRooms
    );
    const extraAdultCharge = round2(
      nightDates.reduce((sum, d) => {
        const plan = mealPlanByDate[d] ?? 'CP';
        const perNight = effectiveExtraAdultPerNight[plan] ?? 0;
        return sum + perNight;
      }, 0) * extraAdultsAbove10 * safeRooms
    );

    const globalFlatPerNight = globalPromo?.promoApplied ? Number(globalPromo?.discountPerNight ?? 0) : 0;
    const globalFlatDiscount = round2(Math.max(0, globalFlatPerNight) * nightDates.length * safeRooms);
    const discountedRoomTotal = round2(Math.max(0, roomTotal - globalFlatDiscount));

    const baseAmount = round2(Math.max(0, discountedRoomTotal + childCharge + extraAdultCharge));
    const gstAmount = round2(baseAmount * 0.05);
    const amountAfterGst = round2(baseAmount + gstAmount);
    const serviceFeeAmount = round2(amountAfterGst * 0.02);
    const taxAndServiceFeesAmount = round2(gstAmount + serviceFeeAmount);
    const totalAmount = round2(baseAmount + taxAndServiceFeesAmount);
    console.log('[FRONTEND DEBUG] priceBreakdown', {
      roomTotal,
      childCharge,
      extraAdultCharge,
      baseAmount,
      gstAmount,
      serviceFeeAmount,
      taxAndServiceFeesAmount,
      totalAmount,
    });
    return {
      roomTotal,
      discountedRoomTotal,
      childCharge,
      extraAdultCharge,
      baseAmount,
      taxAndServiceFeesAmount,
      totalAmount,
    };
  }, [room?.pricePerNight, (room as any)?.day_wise_beforediscount, effectivePlanPrice, rooms, nights, nightDates, mealPlanByDate, children5To10, extraAdultsAbove10, effectiveExtraAdultPerNight, effectiveExtraChildPerNight, globalPromo?.promoApplied, globalPromo?.discountPerNight]);

  const discounted = useMemo(() => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const base = Number(priceBreakdown.baseAmount ?? 0);
    
    let calcDiscount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === 'PERCENT' && Number.isFinite(appliedPromo.value)) {
        calcDiscount = (base * (appliedPromo.value as number)) / 100;
      } else if (appliedPromo.type === 'FLAT' && Number.isFinite(appliedPromo.value)) {
        calcDiscount = appliedPromo.value as number;
      } else {
        calcDiscount = appliedPromo.discountAmount ?? 0;
      }
    }
    
    const discount = round2(Math.max(0, Math.min(base, calcDiscount)));
    const baseAfterDiscount = round2(Math.max(0, base - discount));
    const gstAmount = round2(baseAfterDiscount * 0.05);
    const amountAfterGst = round2(baseAfterDiscount + gstAmount);
    const serviceFeeAmount = round2(amountAfterGst * 0.02);
    const taxAndServiceFees = round2(gstAmount + serviceFeeAmount);
    const total = round2(baseAfterDiscount + taxAndServiceFees);
    return { discount, baseAfterDiscount, taxAndServiceFees, total };
  }, [priceBreakdown.baseAmount, appliedPromo]);

  const formattedTotal = useMemo(() => {
    return formatInr(appliedPromo ? discounted.total : priceBreakdown.totalAmount);
  }, [appliedPromo, discounted.total, priceBreakdown.totalAmount]);

  const formattedPerNight = useMemo(() => {
    if (nights === 0) return '₹ 0';
    const basePerNight = Number(room?.pricePerNight ?? 0);
    const perNight = effectivePlanPrice[selectedPlan] ?? basePerNight;
    const globalFlat = globalPromo?.promoApplied ? Number(globalPromo?.discountPerNight ?? 0) : 0;
    const finalPerNight = Math.max(0, perNight - (Number.isFinite(globalFlat) ? globalFlat : 0));
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(finalPerNight);
    } catch {
      return String(finalPerNight);
    }
  }, [room?.pricePerNight, selectedPlan, effectivePlanPrice, globalPromo?.promoApplied, globalPromo?.discountPerNight, nights]);

  const baseLabel = useMemo(() => {
    if (selectedPlan === 'CP') return 'Base (Room With Breakfast)';
    if (selectedPlan === 'MAP') return 'Base (Room With Breakfast & Dinner)';
    return 'Base (Room)';
  }, [selectedPlan]);

  const validate = () => {
    if (!room) return 'Room not loaded';
    if (!checkIn) return 'Check-in date is required';
    if (!checkOut) return 'Check-out date is required';
    if (!checkInTime) return 'Check-in time is required';
    if (!checkOutTime) return 'Check-out time is required';
    if (!Number.isFinite(rooms) || rooms < 1) return 'Number of rooms is required';
    if (!Number.isFinite(totalGuests) || totalGuests <= 0) return 'Total guests is required';
    if (!Number.isFinite(adults) || adults <= 0) return 'Adults is required';
    if (!Number.isFinite(children5To10) || children5To10 < 0) return 'Children is required';
    if (!Number.isFinite(extraAdultsAbove10) || extraAdultsAbove10 < 0) return 'Extra adults is required';

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (!Number.isFinite(checkInDate.getTime())) return 'Invalid check-in date';
    if (!Number.isFinite(checkOutDate.getTime())) return 'Invalid check-out date';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inDay = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    if (inDay.getTime() < today.getTime()) return 'Check-in date must be today or a future date';
    if (checkOutDate.getTime() <= checkInDate.getTime()) return 'Check-out date must be after check-in date';

    if (!termsAccepted) return 'Please accept Terms & Conditions to proceed';

    return null;
  };

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  let cachedCheckoutLogoDataUrl: string | null = null;
  const getCheckoutLogoDataUrl = async () => {
    if (cachedCheckoutLogoDataUrl) return cachedCheckoutLogoDataUrl;

    const res = await fetch('/favicon.png', { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to load logo');
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read logo'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });

    cachedCheckoutLogoDataUrl = dataUrl;
    return dataUrl;
  };

  const submitBooking = async () => {
    const err = validate();
    setFormError(err);
    if (err) {
      toast.error(err);
      return;
    }

    if (!resolvedRoomId || !Number.isFinite(resolvedRoomId)) {
      const msg = 'Room not loaded. Please go back and select a room again.';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // --- LIVE AVAILABILITY CHECK BEFORE BOOKING ---
      const adultsCount = (() => {
        const baseAdults = Number(room?.person ?? 2);
        const extraAdults = Number(extraAdultsAbove10 ?? 0);
        const computed = baseAdults + extraAdults;
        return Number.isFinite(computed) && computed > 0 ? computed : baseAdults;
      })();

      const liveResp = await roomService.getRoomList({
        checkIn,
        checkOut,
        adults: Number.isFinite(adultsCount) ? adultsCount : 1,
        children: Number.isFinite(children5To10) ? children5To10 : 0,
        rooms: Number.isFinite(rooms) ? rooms : 1,
      });

      if (!liveResp.ok || !liveResp.data.rooms || liveResp.data.rooms.length === 0) {
        setFormError('Room is currently not available for the selected dates.');
        toast.error('Room is currently not available for the selected dates.');
        setIsSubmitting(false);
        return;
      }

      const titleNorm = normalizeRoomType(String(room?.title ?? roomNameFromQuery ?? ''));
      const getAnyRoomTypeName = (r: any) => String(r?.Roomtype_Name ?? r?.Roomtype ?? r?.Room_Name ?? '').trim();
      
      const liveRoomMatches = liveResp.data.rooms.filter((r: any) => {
        const raw = getAnyRoomTypeName(r);
        if (!raw) return false;
        const base = raw.split(' - ')[0] ?? raw;
        return normalizeRoomType(base) === titleNorm;
      });

      if (liveRoomMatches.length === 0) {
        setFormError('Room is currently not available for the selected dates.');
        toast.error('Room is currently not available for the selected dates.');
        setIsSubmitting(false);
        return;
      }

      let maxAvail = 0;
      for (const r of liveRoomMatches) {
         const avail = extractAvailability(r);
         if (avail > maxAvail) maxAvail = avail;
      }

      if (maxAvail < rooms) {
        const msg = maxAvail === 0 
          ? 'Room is currently not available for the selected dates.'
          : `Only ${maxAvail} room(s) available for the selected dates.`;
        setFormError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }
      // --- END LIVE CHECK ---

      const finalTotal = appliedPromo ? discounted.total : priceBreakdown.totalAmount;
      
      console.log('[FRONTEND DEBUG] Sending booking with total amount:', {
        roomTitle: room?.title,
        day_wise_beforediscount: (room as any)?.day_wise_beforediscount,
        nights,
        rooms,
        mealPlanByDate,
        finalTotal,
        priceBreakdown
      });

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: resolvedRoomId,
          checkIn,
          checkOut,
          checkInTime,
          checkOutTime,
          rooms,
          guests: totalGuests,
          adults,
          children: children5To10,
          extraAdults: extraAdultsAbove10,
          additionalInformation: additionalInformation.trim() ? additionalInformation.trim() : null,
          promoCode: appliedPromo?.code ?? null,
          mealPlanByDate: nightDates.map((d) => ({ date: d, plan: mealPlanByDate[d] ?? 'CP' })),
          totalAmount: finalTotal,
        }),
      });

      if (res.status === 401) {
        savePendingBooking();
        navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`, { replace: true });
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error?.message ?? 'Booking failed';
        setFormError(msg);
        toast.error(msg);
        return;
      }

      const bookingId = data?.data?.booking?.id;
      const razorpay = data?.data?.razorpay;
      
      console.log('[FRONTEND DEBUG] Received Razorpay data:', {
        bookingId,
        razorpay,
        sentTotalAmount: finalTotal
      });
      
      if (!bookingId || !razorpay?.orderId || !razorpay?.keyId) {
        setFormError('Payment initialization failed');
        toast.error('Payment initialization failed');
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok || !(window as any).Razorpay) {
        setFormError('Failed to load payment gateway');
        toast.error('Failed to load payment gateway');
        return;
      }

      let checkoutLogo: string | undefined = undefined;
      try {
        checkoutLogo = await getCheckoutLogoDataUrl();
      } catch {
        checkoutLogo = undefined;
      }

      const rz = new (window as any).Razorpay({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency ?? 'INR',
        name: 'VintageValley Resort',
        description: `Booking for ${room?.title ?? 'Room'}`,
        order_id: razorpay.orderId,
        image: checkoutLogo,
        theme: { color: '#3399cc' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`/api/bookings/${bookingId}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => null);
            if (!verifyRes.ok) {
              const msg = verifyData?.error?.message ?? 'Payment verification failed';
              setFormError(msg);
              toast.error(msg);
              return;
            }

            toast.success('Payment successful. Booking confirmed.');
            if (pendingKey) {
              try {
                sessionStorage.removeItem(pendingKey);
              } catch {
              }
            }
            navigate('/profile');
          } catch {
            setFormError('Payment verification failed');
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setFormError('Payment cancelled');
            toast.info('Payment cancelled');
          },
        },
      });

      rz.open();
    } catch {
      setFormError('Booking failed');
      toast.error('Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/rooms')}
            className="text-ivory/80 hover:text-gold transition-colors"
          >
            ← Back to Rooms
          </button>
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mt-6">
            Booking
          </h1>
          <p className="text-xl text-ivory/80 max-w-2xl mt-4">
            Confirm your stay details and proceed to payment.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white rounded-3xl p-6 sm:p-8 luxury-shadow">
              {isLoading ? (
                <div className="text-gray-800/70">Loading room details...</div>
              ) : !room ? (
                <div className="text-gray-800/70">Room not found.</div>
              ) : (
                <>
                  <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                    {room.title}
                  </h2>
                  <p className="text-gray-800/80 text-lg leading-relaxed mb-6">
                    {room.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="bg-gold/15 text-gray-800 px-4 py-2 rounded-full font-semibold">
                      {formattedPerNight} / night
                    </div>
                    <div className="bg-gray-800/5 text-gray-800 px-4 py-2 rounded-full font-medium">
                      Guests: {totalGuests}
                    </div>
                  </div>

                  {(ezeeLoading || ezeeError) && (
                    <div className="mb-6">
                      {ezeeLoading && (
                        <div className="text-sm text-gray-800/70">Loading live plan prices...</div>
                      )}
                      {ezeeError && (
                        <div className="text-sm text-red-700">{ezeeError}</div>
                      )}
                    </div>
                  )}

                  {room.images?.length > 0 && (
                    <>
                      <div className="relative">
                        <img
                          src={room.images[0]}
                          alt={room.title}
                          className="w-full h-80 sm:h-96 object-cover rounded-3xl"
                        />
                      </div>
                      {room.images.length > 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                          {room.images.slice(1).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${room.title} ${idx + 2}`}
                              className="w-full h-28 sm:h-32 object-cover rounded-2xl"
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {room.amenities?.length > 0 && (
                    <div className="mt-8">
                      <h3 className="font-playfair text-xl font-semibold text-gray-800 mb-4">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {room.amenities.map((a, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-gold rounded-full" />
                            <span className="text-gray-800/80">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Promo Cards Strip */}
            <div id="promo-section" className="promo-section mb-8 p-6 sm:p-8 bg-white rounded-3xl luxury-shadow border border-gold/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-gold" />
                  <h3 className="promo-title">
                    Special Offers
                  </h3>
                </div>
                {appliedPromo && (
                  <button 
                    type="button"
                    onClick={() => { setAppliedPromo(null); toast.info('Promo removed'); }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear Promo
                  </button>
                )}
              </div>
              <div 
                className="promo-container"
              >
                {visiblePromos && visiblePromos.length > 0 ? (
                  visiblePromos.map((promo: any) => {
                    const isActive = appliedPromo?.code === promo.code;
                    return (
                      <div
                        key={promo.id || promo.code}
                        onClick={() => {
                          if (isActive) {
                            setAppliedPromo(null);
                            toast.info('Promo removed');
                          } else {
                            if (nights === 0) {
                                toast.info('Please select dates first', { autoClose: 2500 });
                                return;
                            }
                            setAppliedPromo({
                              code: promo.code,
                              type: promo.type,
                              value: Number(promo.value)
                            });
                            toast.success(`Promo ${promo.code} applied`);
                          }
                        }}
                        className={`promo-card group ${
                          isActive 
                            ? 'border-2 border-gold bg-[#fff8f2] shadow-gold/20' 
                            : ''
                        }`}
                      >
                        <div className="relative z-10 w-3/4">
                          <h3 className="promo-card-value">
                            {promo.type === 'PERCENT' ? `${promo.value}%` : `₹${promo.value}`} <span>OFF</span>
                          </h3>
                          <p className="promo-card-label">
                            on {promo.applicableLabel || 'your stay'}
                          </p>
                          {(promo.minNights != null || promo.maxNights != null) && (
                            <p className="text-xs mt-1 opacity-70 font-medium">
                              {promo.minNights != null && promo.maxNights != null
                                ? promo.minNights === promo.maxNights
                                  ? `For ${promo.minNights} night${promo.minNights === 1 ? '' : 's'} only`
                                  : `For ${promo.minNights}–${promo.maxNights} nights`
                                : promo.minNights != null
                                  ? `Min ${promo.minNights} night${promo.minNights === 1 ? '' : 's'}`
                                  : `Up to ${promo.maxNights} night${promo.maxNights === 1 ? '' : 's'}`}
                            </p>
                          )}
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
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 luxury-shadow">
              <h3 className="font-playfair text-3xl font-bold text-gray-800 mb-6">
                Booking Details
              </h3>

              {formError && (
                <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-6">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="checkIn">
                    Check-in date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="checkIn"
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
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = checkInPickerRef.current;
                        if (!el) return;
                        const anyEl = el as any;
                        if (typeof anyEl.showPicker === 'function') anyEl.showPicker();
                        else el.click();
                      }}
                      className="px-4 py-3 rounded-xl border-2 border-gold/20 bg-white hover:bg-gold/10 transition-colors"
                      aria-label="Select check-in date"
                      title="Select check-in date"
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
                        setCheckInText(v ? formatDateDmy(v) : '');
                      }}
                      min={todayIso}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </div>
                  {checkIn && (
                    <div className="text-xs text-gray-800/60 mt-1">
                      {formatDateDmy(checkIn)} ({formatDateFriendly(checkIn)})
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="checkInTime">
                    Check-in time
                  </label>
                  <input
                    id="checkInTime"
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="checkOut">
                    Check-out date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="checkOut"
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
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = checkOutPickerRef.current;
                        if (!el) return;
                        const anyEl = el as any;
                        if (typeof anyEl.showPicker === 'function') anyEl.showPicker();
                        else el.click();
                      }}
                      className="px-4 py-3 rounded-xl border-2 border-gold/20 bg-white hover:bg-gold/10 transition-colors"
                      aria-label="Select check-out date"
                      title="Select check-out date"
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
                        setCheckOutText(v ? formatDateDmy(v) : '');
                      }}
                      min={checkOutMinIso}
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                  </div>
                  {checkOut && (
                    <div className="text-xs text-gray-800/60 mt-1">
                      {formatDateDmy(checkOut)} ({formatDateFriendly(checkOut)})
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="checkOutTime">
                    Check-out time
                  </label>
                  <input
                    id="checkOutTime"
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="rooms">
                    Number of rooms
                  </label>
                  <input
                    id="rooms"
                    type="number"
                    min={1}
                    max={10}
                    value={rooms}
                    onChange={(e) => setRooms(Math.max(1, Math.min(10, Number(e.target.value))))}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2">
                    Total guests
                  </label>
                  <div className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 bg-ivory/50 text-gray-800 font-semibold">
                    {totalGuests}
                  </div>
                  <div className="text-xs text-gray-800/60 mt-1">
                    Auto: room capacity ({room?.person ?? 2}) + children + extra adults
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-800 font-medium">
                      Meal plan (day-wise)
                    </label>
                  </div>
                  {nightDates.length === 0 ? (
                    <div className="text-sm text-gray-800/60">Select valid dates to choose plan day-wise.</div>
                  ) : (
                    <div className="space-y-3">
                      {nightDates.map((d) => (
                        <div key={d} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="text-sm text-gray-800/80 sm:w-44">{formatDateFriendly(d)}</div>
                          <select
                            value={mealPlanByDate[d] ?? 'CP'}
                            onChange={(e) => {
                              const v = e.target.value as MealPlan;
                              setMealPlanByDate((prev) => ({ ...prev, [d]: v }));
                            }}
                            className="w-full sm:w-52 px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                          >
                            {epAvailable && <option value="EP">EP</option>}
                            <option value="CP">CP</option>
                            <option value="MAP">MAP</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="children5To10">
                    Children (5–10 yrs)
                  </label>
                  <input
                    id="children5To10"
                    type="number"
                    min={0}
                    value={children5To10}
                    onChange={(e) => setChildren5To10(Math.max(0, Number(e.target.value)))}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="extraAdultsAbove10">
                    Extra adults (10+ yrs)
                  </label>
                  <input
                    id="extraAdultsAbove10"
                    type="number"
                    min={0}
                    value={extraAdultsAbove10}
                    onChange={(e) => setExtraAdultsAbove10(Math.max(0, Number(e.target.value)))}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="additionalInformation">
                    Any further information
                  </label>
                  <textarea
                    id="additionalInformation"
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50 min-h-[110px]"
                    placeholder="Special requests, medical needs, late check-in, food preference…"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sm:p-8 luxury-shadow sticky top-28">
              <h3 className="font-playfair text-3xl font-bold text-gray-800 mb-6">
                Price Summary
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Per night</span>
                  <span className="font-semibold text-gray-800">{nights === 0 ? '₹0' : formattedPerNight}</span>
                </div>

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Nights</span>
                  <span className="font-semibold text-gray-800">{nights}</span>
                </div>

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Room total</span>
                  <span className="font-semibold text-gray-800">
                    {formatInr(
                      globalPromo?.promoApplied
                        ? (priceBreakdown as any).discountedRoomTotal ?? priceBreakdown.roomTotal
                        : priceBreakdown.roomTotal
                    )}
                  </span>
                </div>

                {(children5To10 > 0 || extraAdultsAbove10 > 0) && (
                  <div className="space-y-2">
                    {children5To10 > 0 && (
                      <div className="flex items-center justify-between text-gray-800/80">
                        <span>Children (5–10) × {children5To10}</span>
                        <span className="font-semibold text-gray-800">{formatInr(priceBreakdown.childCharge)}</span>
                      </div>
                    )}
                    {extraAdultsAbove10 > 0 && (
                      <div className="flex items-center justify-between text-gray-800/80">
                        <span>Extra adults (10+) × {extraAdultsAbove10}</span>
                        <span className="font-semibold text-gray-800">{formatInr(priceBreakdown.extraAdultCharge)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>{baseLabel}</span>
                </div>

                {appliedPromo && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Promo Code: {appliedPromo.code}</span>
                    <span className="font-semibold">-{formatInr(discounted.discount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Tax and services fees</span>
                  <span className="font-semibold text-gray-800">
                    {formatInr(
                      appliedPromo
                        ? discounted.taxAndServiceFees
                        : priceBreakdown.taxAndServiceFeesAmount
                    )}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="text-gray-800 font-semibold mb-2">Promo code</div>
                  {!appliedPromo ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Enter promo code"
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                      />
                      <button
                        type="button"
                        disabled={promoLoading || !promoInput.trim() || nights === 0}
                        onClick={async () => {
                          const code = promoInput.trim();
                          if (!code) return;
                          if (nights === 0) {
                            toast.error('Select valid dates first');
                            return;
                          }
                          setPromoLoading(true);
                          try {
                            const res = await fetch('/api/promos/validate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ 
                              code, 
                              baseAmount: Number(priceBreakdown.baseAmount ?? 0),
                              nights,
                              checkIn,
                              checkOut
                            }),
                            });
                            const data = await res.json().catch(() => null);
                            if (!res.ok) {
                              toast.error('Invalid Promocode');
                              return;
                            }
                            const promoObj = data?.data?.promo;
                            const promoCode = String(promoObj?.code ?? code).trim();
                            if (!promoCode) {
                              toast.error('Invalid promo code');
                              return;
                            }
                            setAppliedPromo({ 
                              code: promoCode, 
                              type: promoObj?.type,
                              value: promoObj?.value ? Number(promoObj.value) : undefined,
                              discountAmount: Number(data?.data?.discountAmount ?? 0) 
                            });
                            toast.success('Promo applied');
                          } catch {
                            toast.error('Failed to apply promo code');
                          } finally {
                            setPromoLoading(false);
                          }
                        }}
                        className="px-4 py-3 rounded-xl font-semibold bg-gold text-gray-800 hover:bg-bronze transition-colors disabled:opacity-60"
                      >
                        {promoLoading ? 'Applying…' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gold/10 border border-gold/20 rounded-2xl px-4 py-3">
                      <div className="text-gray-800/80">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          {appliedPromo.code}
                          <span className="text-[10px] bg-gold text-white px-2 py-0.5 rounded-full font-bold uppercase">Applied</span>
                        </div>
                        <div className="text-sm text-gray-800/70">
                          {appliedPromo.type === 'PERCENT' ? `(${appliedPromo.value}% OFF) ` : ''}
                          Discount: {formatInr(discounted.discount)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          toast.info('Promo removed');
                        }}
                        className="px-4 py-2 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <div className="text-gray-800 font-semibold mb-2">
                    <span>Terms & Conditions</span>
                    <span className="text-amber-800">*</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-start gap-3 text-gray-800/80 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setTermsAccepted(next);
                          if (next && formError === 'Please accept Terms & Conditions to proceed') {
                            setFormError(null);
                          }
                        }}
                        className="mt-1 h-4 w-4 accent-gray-800"
                      />
                      <span>
                        I accept Terms & Conditions
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={openTerms}
                      className="h-9 w-9 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
                      aria-label="Read Terms & Conditions"
                      title="Read Terms & Conditions"
                    >
                      i
                    </button>
                  </div>
                  {!termsAccepted && formError === 'Please accept Terms & Conditions to proceed' && (
                    <p className="mt-2 text-sm text-red-600">Please accept Terms & Conditions</p>
                  )}
                </div>

                {appliedPromo && discounted.discount > 0 && (
                  <div className="flex items-center justify-between text-gray-800/80">
                    <span>Discount</span>
                    <span className="font-semibold text-gray-800">- {formatInr(discounted.discount)}</span>
                  </div>
                )}

                <div className="border-t border-gold/20 pt-4 flex items-center justify-between">
                  <span className="text-gray-800 font-semibold">Total</span>
                  <span className="text-gray-800 font-bold text-xl">{formattedTotal}</span>
                </div>

                <button
                  disabled={nights === 0 || isSubmitting || ezeeLoading}
                  className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  onClick={() => {
                    submitBooking();
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : ezeeLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                      Fetching Live Prices...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>

                {nights === 0 && (
                  <p className="text-sm text-gray-800/60">
                    Select valid check-in and check-out dates to calculate total.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Booking;
