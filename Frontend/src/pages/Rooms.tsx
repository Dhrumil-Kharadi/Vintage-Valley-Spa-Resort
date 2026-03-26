import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { Wifi, Car, Tv, Bath, Users, Bed, Mountain, Coffee, Tag, CheckCircle, Calendar } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { rooms as staticRooms } from '../roomsData';
import { roomDatabaseService, DatabaseRoom } from '../lib/roomDatabase.service';
import { roomService, RoomPrice, RoomListResponse } from '../lib/roomService';

type UiRoom = {
  id: number;
  title: string;
  subtitle: string;
  images: string[];
  description: string;
  capacity: string;
  bedType: string;
  size: string;
  available: number;
  pricing: {
    weekday: string;
    weekend: string;
  };
  planPrices: {
    ep: string;
    cp: string;
    map: string;
  };
  amenities: { icon: any; name: string }[];
};

type EzeeRawRoom = any;

const normalizeRoomType = (value: string) => {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const lower = raw.toLowerCase();

  if (lower === "deluxe studio suite") return "Deluxe Studio Suite";
  if (lower === "deluxe edge view" || lower === "deluxe edge view ") return "Deluxe Edge View";
  if (lower === "lotus family suite" || lower === "lotus family suit") return "Lotus Family Suite";
  if (lower === "presidential suite" || lower === "presidentail suite") return "Presidential Suite"; // Handle typo

  return raw;
};

const ALLOWED_ROOM_TYPES = new Set([
  "Deluxe Studio Suite",
  "Deluxe Edge View",
  "Lotus Family Suite",
  "Presidential Suite",
]);

function isoToday() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysIso(iso: string, days: number) {
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime())) return iso;
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const isPlan = (roomName: string, plan: "EP" | "CP" | "MAP" | "AP") => {
  const upper = String(roomName ?? "").toUpperCase();
  const re = new RegExp(`\\b${plan}\\b`, "i");
  return re.test(upper);
};

const Rooms = () => {
  const navigate = useNavigate();
  const promoStripRef = useRef<HTMLDivElement>(null);
  
  const [dbRooms, setDbRooms] = useState<DatabaseRoom[]>([]);
  const [rawRooms, setRawRooms] = useState<EzeeRawRoom[]>([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [rawError, setRawError] = useState<string | null>(null);
  const [liveRoomPrices, setLiveRoomPrices] = useState<RoomPrice[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [roomListWithDiscount, setRoomListWithDiscount] = useState<RoomListResponse['data']['rooms']>([]);
  const [roomListLoading, setRoomListLoading] = useState(false);
  const [roomListError, setRoomListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Promo cards state
  const [activePromos, setActivePromos] = useState<any[]>([]);
  const [selectedRoomTitle, setSelectedRoomTitle] = useState<string | null>(null);
  const [hasInteractedWithDates, setHasInteractedWithDates] = useState(false);
  const [checkIn, setCheckIn] = useState<string>(isoToday());
  const [checkOut, setCheckOut] = useState<string>(addDaysIso(isoToday(), 1));

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const visiblePromos = useMemo(() => {
    // Before date selection, show all promos so users can browse offers
    if (!hasInteractedWithDates) return activePromos;

    // After date selection, only show promos matching the selected duration
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
  }, [activePromos, nights, hasInteractedWithDates]);

  // Fetch promos on mount
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
  }, []);

  const handlePromoClick = (promo: any) => {
    if (!selectedRoomTitle) {
      toast.info('Please select a room first', { autoClose: 2500 });
      return;
    }
    // Save promo to sessionStorage and navigate to booking
    try {
      sessionStorage.setItem('selectedPromo', JSON.stringify({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        applicableLabel: promo.applicableLabel || '',
      }));
    } catch { /* ignore */ }
    navigate(`/booking?room=${encodeURIComponent(selectedRoomTitle)}`);
  };

  // Fetch database rooms on component mount
  useEffect(() => {
    fetchDatabaseRooms();
    fetchRawRooms();
    fetchLiveRoomPrices();
    fetchRoomListWithDiscount();
  }, []);

  const fetchRoomListWithDiscount = async () => {
    setRoomListLoading(true);
    setRoomListError(null);

    try {
      const response = await roomService.getRoomList({
        checkIn,
        checkOut,
        adults: 1,
        children: 0,
        rooms: 1,
      });

      if (response.ok) {
        setRoomListWithDiscount(response.data.rooms || []);
        console.log('[DEBUG] fetched rooms with discount', response.data.rooms);
      } else {
        setRoomListWithDiscount([]);
        setRoomListError('Failed to fetch rooms');
      }
    } catch (_e) {
      setRoomListWithDiscount([]);
      setRoomListError('Unable to load rooms.');
    } finally {
      setRoomListLoading(false);
    }
  };

  const fetchLiveRoomPrices = async () => {
    setLiveLoading(true);
    setLiveError(null);

    try {
      const response = await roomService.getRoomPrices({
        checkIn,
        checkOut,
        adults: 1,
        children: 0,
        rooms: 1,
      });

      if (response.success) {
        setLiveRoomPrices(response.rooms);
      } else {
        setLiveRoomPrices([]);
        setLiveError(response.message || response.error || 'Failed to fetch live prices');
      }
    } catch (_e) {
      setLiveRoomPrices([]);
      setLiveError('Unable to load live prices.');
    } finally {
      setLiveLoading(false);
    }
  };

  const fetchRawRooms = async () => {
    setRawLoading(true);
    setRawError(null);

    try {
      const response = await roomService.getRawRoomList({
        checkIn,
        checkOut,
        adults: 1,
        children: 0,
        rooms: 1,
      });

      if (response.success) {
        setRawRooms(response.rooms || []);
      } else {
        setRawRooms([]);
        setRawError(response.message || response.error || 'Failed to fetch live rooms');
      }
    } catch (_e) {
      setRawRooms([]);
      setRawError('Unable to load live rooms.');
    } finally {
      setRawLoading(false);
    }
  };

  const fetchDatabaseRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await roomDatabaseService.getDatabaseRooms();
      
      if (response.success) {
        setDbRooms(response.rooms);
      } else {
        setError(response.error || 'Failed to fetch rooms');
        setDbRooms([]);
      }
    } catch (error) {
      setError('Unable to load rooms. Please try again.');
      setDbRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch data when dates change
  useEffect(() => {
    fetchRawRooms();
    fetchLiveRoomPrices();
    fetchRoomListWithDiscount();
  }, [checkIn, checkOut]);

  // Get database room for a room title
  const getDatabaseRoom = (roomTitle: string) => {
    return dbRooms.find(room => 
      room.title.toLowerCase().includes(roomTitle.toLowerCase()) ||
      roomTitle.toLowerCase().includes(room.title.toLowerCase())
    );
  };

  const getLiveRoomPrice = (roomTitle: string) => {
    const title = roomTitle.toLowerCase();
    return liveRoomPrices.find((p) => {
      const t = String(p.roomType ?? '').toLowerCase();
      return t.includes(title) || title.includes(t);
    });
  };

  const getAvailabilityFromRaw = (r: EzeeRawRoom) => {
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

  const getAvgPriceFromRaw = (r: EzeeRawRoom) => {
    const rateInfo = r?.room_rates_info || {};
    const directRackRate = Number((r as any)?.rack_rate ?? 0);
    const directDayWiseBeforeDiscount = (r as any)?.day_wise_beforediscount;

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
    
    console.log(`[ROOMS DEBUG] getAvgPriceFromRaw for room: ${r.Room_Name}`, {
      direct_day_wise_beforediscount: directDayWiseBeforeDiscount,
      direct_rack_rate: directRackRate,
      rack_rate: rateInfo.rack_rate,
      avg_price_per_night: r.avg_price_per_night,
      avg_per_night_after_discount: rateInfo.avg_per_night_after_discount,
      totalprice_inclusive_all: rateInfo.totalprice_inclusive_all,
      exclusive_tax: rateInfo.exclusive_tax
    });
    
    // PRIORITIZE day_wise_beforediscount as primary price source
    let price = 0;
    const dayWise = extractAvgFromDayWise(rateInfo.day_wise_beforediscount ?? directDayWiseBeforeDiscount);
    if (Number.isFinite(dayWise) && dayWise > 0) {
      price = dayWise;
      console.log(`[ROOMS DEBUG] Using day_wise_beforediscount (avg): ${price}`);
    } else if (rateInfo.avg_per_night_after_discount) {
      price = Number(rateInfo.avg_per_night_after_discount);
      console.log(`[ROOMS DEBUG] Using avg_per_night_after_discount: ${price}`);
    } else if (rateInfo.avg_per_night_before_discount) {
      price = Number(rateInfo.avg_per_night_before_discount);
      console.log(`[ROOMS DEBUG] Using avg_per_night_before_discount: ${price}`);
    } else if (rateInfo.totalprice_inclusive_all) {
      const nights = 1; // Default to 1 night for per night calculation
      price = Number(rateInfo.totalprice_inclusive_all) / nights;
      console.log(`[ROOMS DEBUG] Using totalprice_inclusive_all / nights: ${rateInfo.totalprice_inclusive_all} / ${nights} = ${price}`);
    } else if (rateInfo.totalprice_room_only) {
      const nights = 1;
      price = Number(rateInfo.totalprice_room_only) / nights;
      console.log(`[ROOMS DEBUG] Using totalprice_room_only / nights: ${rateInfo.totalprice_room_only} / ${nights} = ${price}`);
    } else if (rateInfo.exclusive_tax && typeof rateInfo.exclusive_tax === 'object') {
      const taxValues = Object.values(rateInfo.exclusive_tax)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (taxValues.length > 0) {
        price = taxValues[0];
        console.log(`[ROOMS DEBUG] Using exclusive_tax value: ${price}`);
      }
    } else if (Number.isFinite(directRackRate) && directRackRate > 0) {
      price = directRackRate;
      console.log(`[ROOMS DEBUG] Using fallback direct rack_rate: ${price}`);
    } else if (rateInfo.rack_rate && Number.isFinite(Number(rateInfo.rack_rate)) && Number(rateInfo.rack_rate) > 0) {
      price = Number(rateInfo.rack_rate);
      console.log(`[ROOMS DEBUG] Using fallback rack_rate: ${price}`);
    }
    
    // Final fallback to original avg_price_per_night
    if (price === 0) {
      price = Number(r.avg_price_per_night ?? 0);
      console.log(`[ROOMS DEBUG] Using fallback avg_price_per_night: ${price}`);
    }
    
    console.log(`[ROOMS DEBUG] Final extracted price: ${price}`);
    return price;
  };

  const getCurrencyFromRaw = (r: EzeeRawRoom) => {
    return String(r?.currency_sign ?? r?.currency_code ?? '₹');
  };

  const getImagesFromRaw = (r: EzeeRawRoom): string[] => {
    const images = Array.isArray(r?.RoomImages) ? r.RoomImages : [];
    const urls = images
      .map((img: any) => String(img?.room_main_image ?? img?.image ?? '').trim())
      .filter(Boolean);
    const main = String(r?.room_main_image ?? '').trim();
    const merged = [main, ...urls].filter(Boolean);
    return merged.length > 0 ? merged : ['/images/room/1.jpeg', '/images/room/4.jpeg', '/images/room/5.jpeg'];
  };

  const getAmenitiesFromRaw = (r: EzeeRawRoom): string[] => {
    const raw = String(r?.RoomAmenities ?? '').trim();
    if (!raw) return [];
    return raw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  };

  // Get price for selected pricing plan
  const getPriceForPlan = (room: DatabaseRoom) => room.pricePerNight;

  // Get discount info for a room from the new API
  const getDiscountInfo = (roomTitle: string) => {
    const titleNormalized = normalizeRoomType(String(roomTitle ?? '').trim()).toLowerCase();
    const baseRoomTypeFromApiName = (roomName: string) => {
      const raw = String(roomName ?? '').trim();
      if (!raw) return '';
      // "Deluxe Studio Suite - CP" -> "Deluxe Studio Suite"
      const base = raw.split(' - ')[0] ?? raw;
      return normalizeRoomType(base).toLowerCase();
    };
    const getAnyRoomTypeName = (r: any) => {
      return String(r?.Roomtype_Name ?? r?.Roomtype ?? r?.Room_Name ?? '').trim();
    };
    const isMatch = (r: any) => {
      const raw = getAnyRoomTypeName(r);
      const apiBase = baseRoomTypeFromApiName(raw);
      return apiBase === titleNormalized;
    };

    const cpRoom = roomListWithDiscount.find((r: any) => {
      if (!isMatch(r)) return false;
      return isPlan(String(r?.Room_Name ?? ''), 'CP');
    });
    const room = cpRoom ?? roomListWithDiscount.find(isMatch);
    if (!room) return null;
    return {
      originalPrice: room.original_price,
      discountAmount: room.discount_amount,
      finalPrice: room.final_price,
      promoApplied: room.promo_applied,
    };
  };

  // Get availability status (page no longer collects rooms count; assume 1 room)
  const getAvailabilityStatus = (availability: number) => {
    if (availability < 1) {
      return { status: 'sold-out', label: 'Sold Out', color: 'bg-red-500' };
    } else if (availability <= 2) {
      return { status: 'limited', label: `Only ${availability} Left`, color: 'bg-orange-500' };
    } else {
      return { status: 'available', label: `${availability} Available`, color: 'bg-green-500' };
    }
  };

  const goToBooking = (roomId: number) => {
    navigate(`/booking/${roomId}`);
  };

  const goToBookingByName = (roomName: string) => {
    const name = String(roomName ?? '').trim();
    if (!name) return;
    setSelectedRoomTitle(name);
    navigate(`/booking?room=${encodeURIComponent(name)}`);
  };

  const amenityIconByName: Record<string, any> = {
    wifi: Wifi,
    parking: Car,
    tv: Tv,
    bath: Bath,
    coffee: Coffee,
    balcony: Mountain,
    view: Mountain,
  };

  const toUiRooms = useMemo<UiRoom[]>(() => {
    // Prioritize roomListWithDiscount (from /api/rooms) over rawRooms (from /api/rooms/raw)
    if (roomListWithDiscount.length > 0) {
      console.log('[ROOMS DEBUG] Using roomListWithDiscount data:', roomListWithDiscount);
      
      const roomOrder = [
        'Deluxe Studio Suite',
        'Deluxe Edge View',
        'Lotus Family Suite',
        'Presidential Suite',
      ];

      const out: UiRoom[] = [];
      let idx = 0;
      for (const roomType of roomOrder) {
        // Find matching room from roomListWithDiscount
        const matchingRoom = roomListWithDiscount.find((r: any) => {
          const roomName = String(r?.Room_Name ?? '').toLowerCase();
          const roomBaseName = roomName.split(' - ')[0].toLowerCase();
          return roomName.includes(roomType.toLowerCase()) || 
                 roomType.toLowerCase().includes(roomBaseName) ||
                 normalizeRoomType(roomBaseName) === roomType;
        });
        
        // If no matching room found in roomListWithDiscount, try to find in rawRooms
        let finalMatchingRoom = matchingRoom;
        if (!matchingRoom && rawRooms.length > 0) {
          const rawMatchingRoom = rawRooms.find((r: any) => {
            const roomName = String(r?.Room_Name ?? '').toLowerCase();
            const roomBaseName = roomName.split(' - ')[0].toLowerCase();
            return roomName.includes(roomType.toLowerCase()) || 
                   roomType.toLowerCase().includes(roomBaseName) ||
                   normalizeRoomType(roomBaseName) === roomType;
          });
          if (rawMatchingRoom) {
            finalMatchingRoom = rawMatchingRoom;
          }
        }
        
        // If still no matching room, create a fallback room
          finalMatchingRoom = {
            roomtypeunkid: "0",
            Room_Name: `${roomType} - EP`,
            Room_Description: `${roomType} - EP`,
            max_adult_occupancy: 4,
            max_child_occupancy: 2,
            available_rooms: 0,
            rack_rate: roomType === 'Lotus Family Suite' ? 8000 : 
                      roomType === 'Presidential Suite' ? 12500 :
                      roomType === 'Deluxe Edge View' ? 5500 : 4500,
            avg_price_per_night: roomType === 'Lotus Family Suite' ? 7500 :
                                roomType === 'Presidential Suite' ? 11875 :
                                roomType === 'Deluxe Edge View' ? 5225 : 4275,
            total_price: roomType === 'Lotus Family Suite' ? 7500 :
                        roomType === 'Presidential Suite' ? 11875 :
                        roomType === 'Deluxe Edge View' ? 5225 : 4275,
            currency_sign: '₹',
            RoomAmenities: 'WiFi, AC, TV',
          } as any;

        idx += 1;

        const staticRoom = staticRooms.find((sr) => sr.title.toLowerCase() === roomType.toLowerCase());
        // Use day_wise_beforediscount as primary price, fallback to avg_price_per_night or pricePerNight
        const price = getAvgPriceFromRaw(finalMatchingRoom);
        const currency = String(finalMatchingRoom.currency_sign || '₹');
        const amenities = String(finalMatchingRoom.RoomAmenities || '').split(',').map(a => a.trim()).filter(Boolean);

        // Derive EP/CP/MAP plan prices from actual API variants first (some rooms only have CP/MAP)
        const candidatesForType = [...roomListWithDiscount, ...rawRooms].filter((rr: any) => {
          const rt = normalizeRoomType(String(rr?.Roomtype_Name ?? rr?.Roomtype ?? rr?.Room_Name ?? '')).toLowerCase();
          return rt === roomType.toLowerCase();
        });
        const epRoom = candidatesForType.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'EP'));
        const cpRoom = candidatesForType.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
        const mapRoom = candidatesForType.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'MAP'));

        const epFromApi = epRoom ? getAvgPriceFromRaw(epRoom) : 0;
        const cpFromApi = cpRoom ? getAvgPriceFromRaw(cpRoom) : 0;
        const mapFromApi = mapRoom ? getAvgPriceFromRaw(mapRoom) : 0;

        // Fallback: compute from base price only if a plan variant is missing
        const base = Number.isFinite(price) && price > 0 ? price : 0;
        const epPrice = Number.isFinite(epFromApi) && epFromApi > 0 ? epFromApi : 0;
        const cpPrice = Number.isFinite(cpFromApi) && cpFromApi > 0 ? cpFromApi : base + 500;
        const mapPrice = Number.isFinite(mapFromApi) && mapFromApi > 0 ? mapFromApi : base + 1000;

        const avail = Math.max(0, ...candidatesForType.map((c: any) => getAvailabilityFromRaw(c)));

        console.log(`[ROOMS DEBUG] Processed ${roomType}:`, {
          day_wise_beforediscount: (finalMatchingRoom as any)?.day_wise_beforediscount,
          rack_rate: finalMatchingRoom.rack_rate,
          avg_price_per_night: finalMatchingRoom.avg_price_per_night,
          pricePerNight: finalMatchingRoom.pricePerNight,
          finalPrice: price,
          epPrice,
          cpPrice,
          mapPrice,
          currency,
          roomData: finalMatchingRoom
        });

        out.push({
          id: idx,
          title: roomType,
          subtitle: String(finalMatchingRoom?.Roomtype_Short_code ?? staticRoom?.subtitle ?? 'Luxury Suite'),
          images: staticRoom?.images && staticRoom.images.length > 0 ? staticRoom.images : ['/images/room/1.jpeg', '/images/room/4.jpeg', '/images/room/5.jpeg'],
          description: staticRoom?.description || String(finalMatchingRoom?.Room_Description ?? '').trim() || 'Luxury accommodation',
          capacity: `${Number(finalMatchingRoom?.max_adult_occupancy ?? 0) || 2} Guests`,
          bedType: staticRoom?.bedType || 'King Bed',
          size: staticRoom?.size || 'Spacious',
          available: avail,
          pricing: {
            weekday: !hasInteractedWithDates ? `₹0` : `${currency}${price}`,
            weekend: !hasInteractedWithDates ? `₹0` : `${currency}${price}`,
          },
          planPrices: {
            ep: epPrice > 0 ? `${currency}${epPrice}` : '',
            cp: cpPrice > 0 ? `${currency}${cpPrice}` : '',
            map: mapPrice > 0 ? `${currency}${mapPrice}` : '',
          },
          amenities: (amenities.length > 0 ? amenities : []).map((name) => {
            const key = String(name ?? '').toLowerCase();
            const Icon =
              amenityIconByName[
                Object.keys(amenityIconByName).find((k) => key.includes(k)) ?? ''
              ] ?? Coffee;
            return { icon: Icon, name };
          }),
        });
      }

      return out;
    }

    // Fallback to rawRooms if roomListWithDiscount is empty
    if (rawRooms.length > 0) {
      const byRoomType = new Map<string, EzeeRawRoom[]>();
      for (const r of rawRooms) {
        const roomTypeRaw = String(r?.Roomtype_Name ?? r?.Roomtype ?? r?.Room_Name ?? '').trim();
        if (!roomTypeRaw) continue;
        const key = normalizeRoomType(roomTypeRaw);
        const list = byRoomType.get(key) ?? [];
        list.push(r);
        byRoomType.set(key, list);
      }

      const roomOrder = [
        'Deluxe Studio Suite',
        'Deluxe Edge View',
        'Lotus Family Suite',
        'Presidential Suite',
      ];

      const out: UiRoom[] = [];
      let idx = 0;
      for (const roomType of roomOrder) {
        const list = byRoomType.get(roomType);
        if (!list || !list.length) continue;

        const cp = list.find((rr) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
        const ep = list.find((rr) => isPlan(String(rr?.Room_Name ?? ''), 'EP'));
        const preferred = cp ?? ep ?? list[0];
        if (!preferred) continue;

        idx += 1;

        const staticRoom = staticRooms.find((sr) => sr.title.toLowerCase() === roomType.toLowerCase());
        const images = staticRoom?.images && staticRoom.images.length > 0 ? staticRoom.images : getImagesFromRaw(preferred);
        const price = getAvgPriceFromRaw(preferred);
        const currency = getCurrencyFromRaw(preferred);
        const amenities = getAmenitiesFromRaw(preferred);

        // Calculate EP/CP/MAP prices based on extracted price
        const epPrice = price;
        const cpPrice = price + 500;
        const mapPrice = price + 1000;

        const avail = Math.max(0, ...list.map((c: any) => getAvailabilityFromRaw(c)));

        out.push({
          id: idx,
          title: roomType,
          subtitle: String(preferred?.Roomtype_Short_code ?? staticRoom?.subtitle ?? 'Luxury Suite'),
          images,
          description: String(preferred?.Room_Description ?? '').trim() || staticRoom?.description || 'Luxury accommodation',
          capacity: `${Number(preferred?.max_adult_occupancy ?? preferred?.Room_Max_adult ?? 0) || 2} Guests`,
          bedType: staticRoom?.bedType || 'King Bed',
          size: staticRoom?.size || 'Spacious',
          available: avail,
          pricing: {
            weekday: !hasInteractedWithDates ? `₹0` : `${currency}${price}`,
            weekend: !hasInteractedWithDates ? `₹0` : `${currency}${price}`,
          },
          planPrices: {
            ep: ep ? `${getCurrencyFromRaw(ep)}${getAvgPriceFromRaw(ep)}` : `${currency}${epPrice}`,
            cp: cp ? `${getCurrencyFromRaw(cp)}${getAvgPriceFromRaw(cp)}` : `${currency}${cpPrice}`,
            map: `${currency}${mapPrice}`,
          },
          amenities: (amenities.length > 0 ? amenities : []).map((name) => {
            const key = String(name ?? '').toLowerCase();
            const Icon =
              amenityIconByName[
                Object.keys(amenityIconByName).find((k) => key.includes(k)) ?? ''
              ] ?? Coffee;
            return { icon: Icon, name };
          }),
        });
      }

      return out;
    }

    return dbRooms.map((room) => {
      // Find matching static room for additional data (images, etc.)
      const staticRoom = staticRooms.find(sr => 
        sr.title.toLowerCase().includes(room.title.toLowerCase()) ||
        room.title.toLowerCase().includes(sr.title.toLowerCase())
      );
      
      return {
        id: room.id,
        title: room.title,
        subtitle: staticRoom?.subtitle || 'Luxury Suite',
        images: staticRoom?.images && staticRoom.images.length > 0 
          ? staticRoom.images 
          : room.images.length > 0 
            ? room.images.map(img => img.url)
            : ['/images/room/1.jpeg', '/images/room/4.jpeg', '/images/room/5.jpeg'],
        description: room.description,
        capacity: `${room.person} Guests`,
        bedType: staticRoom?.bedType || 'King Bed',
        size: staticRoom?.size || 'Spacious',
        available: room.availableRooms ?? 0,
        pricing: {
          weekday: !hasInteractedWithDates ? `₹0` : `₹${room.pricePerNight}`,
          weekend: !hasInteractedWithDates ? `₹0` : `₹${room.pricePerNight}`,
        },
        planPrices: {
          ep: `₹${room.epPricePerNight || room.pricePerNight}`,
          cp: `₹${room.cpPricePerNight || (room.pricePerNight + 500)}`,
          map: `₹${room.mapPricePerNight || (room.pricePerNight + 1000)}`,
        },
        amenities: room.amenities.map((a) => {
          const key = String(a?.name ?? '').toLowerCase();
          const Icon =
            amenityIconByName[
              Object.keys(amenityIconByName).find((k) => key.includes(k)) ?? ''
            ] ?? Coffee;
          return { icon: Icon, name: String(a?.name ?? '') };
        }),
      };
    });
  }, [dbRooms, rawRooms, roomListWithDiscount]);

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      {/* Hero Section with Date Picker */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-6">
            Luxury Accommodations
          </h1>
          <p className="text-xl text-ivory/80 max-w-2xl mx-auto mb-8">
            Discover our collection of thoughtfully designed suites, each offering a unique blend of comfort and elegance
          </p>
          
          {error && (
            <div className="text-ivory/90 text-sm mb-4">
              {error}
            </div>
          )}

          {liveError && (
            <div className="text-ivory/90 text-sm mb-4">
              {liveError}
            </div>
          )}

          {rawError && (
            <div className="text-ivory/90 text-sm mb-4">
              {rawError}
            </div>
          )}

          {loading && (
            <div className="text-ivory/90 text-sm">
              Loading rooms...
            </div>
          )}

          {liveLoading && (
            <div className="text-ivory/90 text-sm">
              Loading live prices...
            </div>
          )}

          {rawLoading && (
            <div className="text-ivory/90 text-sm">
              Loading live rooms...
            </div>
          )}
          {/* Date Picker Section */}
          <div className="mt-12 max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-bronze/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-ivory/80 text-sm font-medium mb-1 ml-1 uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-gold" /> Check-in Date
                </label>
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    setHasInteractedWithDates(true);
                  }}
                  min={isoToday()}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all hover:bg-white/20 cursor-pointer text-lg font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-ivory/80 text-sm font-medium mb-1 ml-1 uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-gold" /> Check-out Date
                </label>
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    setHasInteractedWithDates(true);
                  }}
                  min={addDaysIso(checkIn, 1)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-ivory focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all hover:bg-white/20 cursor-pointer text-lg font-medium"
                />
              </div>
            </div>
            {hasInteractedWithDates && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gold animate-fade-in">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium uppercase tracking-widest">Pricing & Offers Updated for {nights} {nights === 1 ? 'Night' : 'Nights'}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Promo Cards Strip */}
      <section id="special-offers" className="promo-section bg-gradient-to-br from-ivory via-white to-ivory/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="h-5 w-5 text-gold" />
            <h3 className="promo-title">
              Special Offers
            </h3>
            {!selectedRoomTitle && (
              <span className="text-sm text-gray-800/50 ml-auto italic">
                Select a room below to use a promo
              </span>
            )}
          </div>
          <div
            ref={promoStripRef}
            className="promo-container"
          >
            {visiblePromos && visiblePromos.length > 0 ? (
              visiblePromos.map((promo: any) => (
                <div
                  key={promo.id || promo.code}
                  onClick={() => handlePromoClick(promo)}
                  className="promo-card group"
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
              ))
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
      </section>

      {/* Rooms Section */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto space-y-16">
          {toUiRooms.length === 0 ? (
            <div className="text-gray-800/70">No rooms found.</div>
          ) : (
            toUiRooms.map((room, index) => (
              <div 
                key={room.id} 
                id={room.title.replace(/\s+/g, '-').toLowerCase()}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}>
              {/* Images */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <div className="relative">
                  <img
                    src={room.images[0]}
                    alt={room.title}
                    className="w-full h-96 object-cover rounded-3xl luxury-shadow"
                  />
                  {(() => {
                    const availabilityStatus = getAvailabilityStatus(room.available);
                    return (
                      <div className={`absolute top-4 left-4 ${availabilityStatus.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                        {availabilityStatus.label}
                      </div>
                    );
                  })()}
                  {(() => {
                    const candidates = [...roomListWithDiscount, ...rawRooms].filter((rr: any) => {
                      const rt = normalizeRoomType(String(rr?.Roomtype_Name ?? rr?.Roomtype ?? rr?.Room_Name ?? ''));
                      return rt.toLowerCase() === room.title.toLowerCase();
                    });
                    const cp = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
                    const ep = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'EP'));
                    const preferred = cp ?? ep ?? candidates[0];
                    const currency = cp ? getCurrencyFromRaw(cp) : '₹';
                    const discountInfo = getDiscountInfo(room.title);

                    if (
                      discountInfo &&
                      discountInfo.promoApplied &&
                      Number.isFinite(Number(discountInfo.finalPrice)) &&
                      Number(discountInfo.finalPrice) > 0
                    ) {
                      return (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-gold to-bronze text-gray-800 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg">
                          {currency}{Number(discountInfo.finalPrice)}/Night
                        </div>
                      );
                    }

                    if (preferred) {
                      const currencyToUse = getCurrencyFromRaw(preferred) || currency;
                      const price = getAvgPriceFromRaw(preferred);
                      if (Number.isFinite(price) && price > 0) {
                        return (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-gold to-bronze text-gray-800 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg">
                            {currencyToUse}{price}/Night
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
                <div className="mt-3 text-sm text-gray-800/70">
                  {loading || liveLoading || rawLoading || roomListLoading ? (
                    'Loading rooms...'
                  ) : error || liveError || rawError || roomListError ? (
                    'Price unavailable. Please try again.'
                  ) : (
                    null
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {room.images.slice(1).map((image, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={image}
                      alt={`${room.title} ${imgIndex + 2}`}
                      className="w-full h-32 object-cover rounded-2xl"
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                <h2 className="font-playfair text-4xl font-bold text-gray-800 mb-2">
                  {room.title}
                </h2>
                <p className="font-vibes text-2xl text-gold mb-6">
                  {room.subtitle}
                </p>
                <p className="text-gray-800/80 text-lg leading-relaxed mb-6">
                  {room.description}
                </p>

                {/* Room Details */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gold" />
                    <span className="text-gray-800/80">{room.capacity}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bed className="h-5 w-5 text-gold" />
                    <span className="text-gray-800/80">{room.bedType}</span>
                  </div>
                  <div className="flex items-center space-x-2 col-span-2">
                    <Mountain className="h-5 w-5 text-gold" />
                    <span className="text-gray-800/80">{room.size}
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-8">
                  <h3 className="font-playfair text-xl font-semibold text-gray-800 mb-4">
                    Premium Amenities
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {room.amenities.map((amenity, amenityIndex) => (
                      <div key={amenityIndex} className="flex items-center space-x-3">
                        <amenity.icon className="h-4 w-4 text-gold" />
                        <span className="text-gray-800/80 text-sm">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {(() => {
                    const candidates = [...roomListWithDiscount, ...rawRooms].filter((rr: any) => {
                      const rt = normalizeRoomType(String(rr?.Roomtype_Name ?? rr?.Roomtype ?? rr?.Room_Name ?? ''));
                      return rt.toLowerCase() === room.title.toLowerCase();
                    });
                    const cp = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
                    const ep = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'EP'));
                    const preferred = cp ?? ep ?? candidates[0];
                    const avail = Math.max(0, ...candidates.map((c: any) => getAvailabilityFromRaw(c)));
                    const isSoldOut = preferred ? avail < 1 : true;
                    
                    return (
                      <button
                        onClick={() => {
                          if (!room.title) return;
                          setSelectedRoomTitle(room.title);
                          goToBookingByName(room.title);
                        }}
                        className={`px-6 py-3 rounded-full font-semibold transition-colors duration-200 ${
                          isSoldOut
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                            : 'bg-gold text-gray-800 hover:bg-bronze'
                        }`}
                        disabled={isSoldOut}
                      >
                        {isSoldOut ? 'Sold Out' : 'Book This Suite'}
                      </button>
                    );
                  })()}
                  <button
                    className="border-2 border-gray-800 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-ivory transition-colors duration-200 flex-1 sm:flex-none"
                    onClick={() => {
                      const msg = encodeURIComponent("Hey there! 👋 I'm interested in planning my stay and would love to know more about availability, rates, and any current offers. Could you please assist me? ");
                      window.open(`https://wa.me/919371179888?text=${msg}`, '_blank');
                    }}
                  >
                    Enquire Now
                  </button>
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Special Offers */}
      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-playfair text-4xl font-bold text-gray-800 mb-8">
            Special Packages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gold/10 to-bronze/10 rounded-3xl p-8 border border-gold/20">
              <h3 className="font-playfair text-2xl font-semibold text-gray-800 mb-4">
                Weekend Getaway
              </h3>
              <p className="text-gray-800/80 mb-6">
                Perfect 2-night weekend package including breakfast and nature activities
              </p>
              <button
                className="bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200"
                onClick={() => navigate('/tariff')}
              >
                Learn More
              </button>
            </div>
            <div className="bg-gradient-to-br from-gray-800/5 to-gray-800/10 rounded-3xl p-8 border border-gray-800/20">
              <h3 className="font-playfair text-2xl font-semibold text-gray-800 mb-4">
                Extended Stay
              </h3>
              <p className="text-gray-800/80 mb-6">
                Book 4+ nights and enjoy exclusive discounts, complimentary meals, and premium services
              </p>
              <button
                className="bg-gray-800 text-ivory px-6 py-3 rounded-full font-semibold hover:bg-gray-800/80 transition-colors duration-200"
                onClick={() => {
                  const msg = encodeURIComponent(`Hello 👋, I'm interested in the Extended Stay offer.\nI’d like to know more about the discounts, complimentary meals, and premium services for bookings of 4 nights or more.\nPlease share the details. Thanks!`);
                  window.open(`https://wa.me/919371179888?text=${msg}`, '_blank');
                }}
              >
                Get Details
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Rooms;
