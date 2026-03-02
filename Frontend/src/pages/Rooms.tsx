import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { Wifi, Car, Tv, Bath, Users, Bed, Mountain, Coffee } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  if (lower === "lotus family suite") return "Lotus Family Suite";
  if (lower === "presidential suite" || lower === "presidentail suite") return "Presidential Suite";

  return raw;
};

const ALLOWED_ROOM_TYPES = new Set([
  "Deluxe Studio Suite",
  "Deluxe Edge View",
  "Lotus Family Suite",
  "Presidential Suite",
]);

const isPlan = (roomName: string, plan: "EP" | "CP" | "MAP" | "AP") => {
  const upper = String(roomName ?? "").toUpperCase();
  const re = new RegExp(`\\b${plan}\\b`, "i");
  return re.test(upper);
};

const Rooms = () => {
  const navigate = useNavigate();
  
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
      const { checkIn, checkOut } = getValidCheckInCheckOut();
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

  const isoToday = () => {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const addDaysIso = (iso: string, days: number) => {
    const dt = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime())) return iso;
    dt.setUTCDate(dt.getUTCDate() + days);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getValidCheckInCheckOut = () => {
    const today = isoToday();
    let checkIn = addDaysIso(today, 1);
    let checkOut = addDaysIso(checkIn, 2);
    // Defensive: ensure checkOut > checkIn
    if (checkIn >= checkOut) {
      checkIn = addDaysIso(today, 1);
      checkOut = addDaysIso(checkIn, 2);
    }
    return { checkIn, checkOut };
  };

  const fetchLiveRoomPrices = async () => {
    setLiveLoading(true);
    setLiveError(null);

    try {
      const { checkIn, checkOut } = getValidCheckInCheckOut();

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
      const { checkIn, checkOut } = getValidCheckInCheckOut();

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
    const exclusiveTaxObj = r?.room_rates_info?.exclusive_tax;
    if (exclusiveTaxObj && typeof exclusiveTaxObj === 'object') {
      const values = Object.values(exclusiveTaxObj)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) return values[0];
    }

    const avg = Number(r?.room_rates_info?.avg_per_night_after_discount ?? 0);
    if (Number.isFinite(avg) && avg > 0) return avg;

    const inc = r?.room_rates_info?.inclusive_tax_adjustment;
    if (inc && typeof inc === 'object') {
      const values = Object.values(inc)
        .map((v: any) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
      if (values.length > 0) return values[0];
    }

    return 0;
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
    const isMatch = (r: any) => {
      const apiBase = baseRoomTypeFromApiName(String(r?.Room_Name ?? ''));
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

        out.push({
          id: idx,
          title: roomType,
          subtitle: String(preferred?.Roomtype_Short_code ?? staticRoom?.subtitle ?? 'Luxury Suite'),
          images,
          description: String(preferred?.Room_Description ?? '').trim() || staticRoom?.description || 'Luxury accommodation',
          capacity: `${Number(preferred?.max_adult_occupancy ?? preferred?.Room_Max_adult ?? 0) || 2} Guests`,
          bedType: staticRoom?.bedType || 'King Bed',
          size: staticRoom?.size || 'Spacious',
          pricing: {
            weekday: `${currency}${price}`,
            weekend: `${currency}${price}`,
          },
          planPrices: {
            ep: ep ? `${getCurrencyFromRaw(ep)}${getAvgPriceFromRaw(ep)}` : '',
            cp: cp ? `${getCurrencyFromRaw(cp)}${getAvgPriceFromRaw(cp)}` : '',
            map: '',
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
        pricing: {
          weekday: `₹${room.pricePerNight}`,
          weekend: `₹${room.pricePerNight}`,
        },
        planPrices: {
          ep: `₹${room.epPricePerNight || room.pricePerNight}`,
          cp: `₹${room.cpPricePerNight || room.pricePerNight}`,
          map: `₹${room.mapPricePerNight || room.pricePerNight}`,
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
  }, [dbRooms, rawRooms]);

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
                    const candidates = rawRooms.filter((rr: any) => {
                      const rt = normalizeRoomType(String(rr?.Roomtype_Name ?? rr?.Roomtype ?? rr?.Room_Name ?? ''));
                      return rt.toLowerCase() === room.title.toLowerCase();
                    });
                    const cp = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
                    const ep = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'EP'));
                    const preferred = cp ?? ep;
                    if (preferred) {
                      const availabilityStatus = getAvailabilityStatus(getAvailabilityFromRaw(preferred));
                      return (
                        <div className={`absolute top-4 left-4 ${availabilityStatus.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                          {availabilityStatus.label}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {(() => {
                    const candidates = rawRooms.filter((rr: any) => {
                      const rt = normalizeRoomType(String(rr?.Roomtype_Name ?? rr?.Roomtype ?? rr?.Room_Name ?? ''));
                      return rt.toLowerCase() === room.title.toLowerCase();
                    });
                    const cp = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
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

                    if (cp) {
                      const price = getAvgPriceFromRaw(cp);
                      if (Number.isFinite(price) && price > 0) {
                        return (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-gold to-bronze text-gray-800 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg">
                            {currency}{price}/Night
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
                  ) : (() => {
                    const discountInfo = getDiscountInfo(room.title);
                    if (discountInfo && discountInfo.promoApplied && discountInfo.originalPrice && discountInfo.finalPrice !== discountInfo.originalPrice) {
                      return (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-gray-500">
                              ₹{discountInfo.originalPrice}
                            </span>
                            <span className="font-bold text-green-600">
                              ₹{discountInfo.finalPrice}
                            </span>
                          </div>
                          <div className="text-xs text-red-600 font-semibold mt-1">
                            Flat ₹{discountInfo.discountAmount} OFF
                          </div>
                        </div>
                      );
                    }
                    // Fallback to existing logic
                    const candidates = rawRooms.filter((rr: any) => {
                      const rt = normalizeRoomType(String(rr?.Roomtype_Name ?? rr?.Roomtype ?? rr?.Room_Name ?? ''));
                      return rt.toLowerCase() === room.title.toLowerCase();
                    });
                    const cp = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
                    const ep = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'EP'));
                    const preferred = cp ?? ep;
                    if (preferred) {
                      const price = getAvgPriceFromRaw(preferred);
                      const currency = getCurrencyFromRaw(preferred);
                      if (Number.isFinite(price) && price > 0) return `${currency}${price}/night`;
                    }
                    return 'Price unavailable';
                  })()}
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
                    const candidates = rawRooms.filter((rr: any) => {
                      const rt = normalizeRoomType(String(rr?.Roomtype_Name ?? rr?.Roomtype ?? rr?.Room_Name ?? ''));
                      return rt.toLowerCase() === room.title.toLowerCase();
                    });
                    const cp = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'CP'));
                    const ep = candidates.find((rr: any) => isPlan(String(rr?.Room_Name ?? ''), 'EP'));
                    const preferred = cp ?? ep;
                    const isSoldOut = preferred ? getAvailabilityFromRaw(preferred) < 1 : true;
                    
                    return (
                      <button
                        className={`px-6 py-3 rounded-full font-semibold transition-colors duration-200 flex-1 sm:flex-none ${
                          isSoldOut
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-gold text-gray-800 hover:bg-bronze'
                        }`}
                        onClick={() => {
                          if (!isSoldOut) {
                            goToBookingByName(room.title);
                          }
                        }}
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
