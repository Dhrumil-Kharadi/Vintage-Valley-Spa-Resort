import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type RoomDetails = {
  id: string | number;
  title: string;
  description: string;
  pricePerNight: number;
  person: number;
  amenities: string[];
  images: string[];
};

const parseRoomFromRoomsData = async (id: string): Promise<RoomDetails | null> => {
  try {
    const mod = await import('../roomsData');
    const rooms = (mod as any).rooms as Array<any>;
    const room = rooms?.find((r) => String(r.id) === String(id));

    if (!room) return null;

    const raw = room?.pricing?.weekday ?? '';
    const numeric = Number(String(raw).replace(/[^0-9]/g, ''));

    return {
      id: room.id,
      title: room.title,
      description: room.description,
      pricePerNight: Number.isFinite(numeric) && numeric > 0 ? numeric : 0,
      person: Number(room?.person ?? 2),
      amenities: (room.amenities ?? []).map((a: any) => a?.name).filter(Boolean),
      images: room.images ?? [],
    };
  } catch {
    return null;
  }
};

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [children5To10, setChildren5To10] = useState(0);
  const [extraAdultsAbove10, setExtraAdultsAbove10] = useState(0);
  const [roomType, setRoomType] = useState('standard');

  useEffect(() => {
    const controller = new AbortController();

    const loadRoom = async () => {
      if (!id) {
        setIsLoading(false);
        setRoom(null);
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
          person: Number(data?.person ?? 2),
          amenities: (data?.amenities ?? []).map((a: any) => (typeof a === 'string' ? a : a?.name)).filter(Boolean),
          images: data?.images ?? [],
        };

        setRoom(normalized);
      } catch {
        const fallback = await parseRoomFromRoomsData(id);
        setRoom(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoom();
    return () => controller.abort();
  }, [id]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const totalGuests = useMemo(() => {
    const base = Number(room?.person ?? 2);
    const kids = Number(children5To10 ?? 0);
    const extraAdults = Number(extraAdultsAbove10 ?? 0);
    const computed = base + kids + extraAdults;
    return Number.isFinite(computed) && computed > 0 ? computed : base;
  }, [room?.person, children5To10, extraAdultsAbove10]);

  const total = useMemo(() => {
    const perNight = room?.pricePerNight ?? 0;
    const base = perNight * nights;
    const childCharge = 1200 * children5To10 * nights;
    const extraAdultCharge = 1500 * extraAdultsAbove10 * nights;
    return base + childCharge + extraAdultCharge;
  }, [room?.pricePerNight, nights, children5To10, extraAdultsAbove10]);

  const charges = useMemo(() => {
    const perNight = room?.pricePerNight ?? 0;
    const base = perNight * nights;
    const childCharge = 1200 * children5To10 * nights;
    const extraAdultCharge = 1500 * extraAdultsAbove10 * nights;
    return { base, childCharge, extraAdultCharge };
  }, [room?.pricePerNight, nights, children5To10, extraAdultsAbove10]);

  const formattedTotal = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total);
    } catch {
      return String(total);
    }
  }, [total]);

  const formattedPerNight = useMemo(() => {
    const perNight = room?.pricePerNight ?? 0;
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(perNight);
    } catch {
      return String(perNight);
    }
  }, [room?.pricePerNight]);

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
                      Selected: {roomType}
                    </div>
                    <div className="bg-gray-800/5 text-gray-800 px-4 py-2 rounded-full font-medium">
                      Guests: {totalGuests}
                    </div>
                  </div>

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

            <div className="bg-white rounded-3xl p-6 sm:p-8 luxury-shadow">
              <h3 className="font-playfair text-3xl font-bold text-gray-800 mb-6">
                Booking Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="checkIn">
                    Check-in date
                  </label>
                  <input
                    id="checkIn"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="checkOut">
                    Check-out date
                  </label>
                  <input
                    id="checkOut"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                  <div className="text-xs text-gray-800/60 mt-1">₹1200 per child (per night)</div>
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                  <div className="text-xs text-gray-800/60 mt-1">₹1500 per person (per night, incl. extra mattress)</div>
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2" htmlFor="roomType">
                    Room type selection
                  </label>
                  <select
                    id="roomType"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="family">Family</option>
                    <option value="suite">Suite</option>
                  </select>
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
                  <span className="font-semibold text-gray-800">{formattedPerNight}</span>
                </div>

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Nights</span>
                  <span className="font-semibold text-gray-800">{nights}</span>
                </div>

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Room total</span>
                  <span className="font-semibold text-gray-800">₹{charges.base.toLocaleString('en-IN')}</span>
                </div>

                {(children5To10 > 0 || extraAdultsAbove10 > 0) && (
                  <div className="space-y-2">
                    {children5To10 > 0 && (
                      <div className="flex items-center justify-between text-gray-800/80">
                        <span>Children (5–10) × {children5To10}</span>
                        <span className="font-semibold text-gray-800">₹{charges.childCharge.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {extraAdultsAbove10 > 0 && (
                      <div className="flex items-center justify-between text-gray-800/80">
                        <span>Extra adults (10+) × {extraAdultsAbove10}</span>
                        <span className="font-semibold text-gray-800">₹{charges.extraAdultCharge.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gold/20 pt-4 flex items-center justify-between">
                  <span className="text-gray-800 font-semibold">Total</span>
                  <span className="text-gray-800 font-bold text-xl">{formattedTotal}</span>
                </div>

                <button
                  disabled={nights === 0}
                  className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200"
                  onClick={() => {
                    navigate('/');
                  }}
                >
                  Proceed to Payment
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
