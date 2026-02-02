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
  const [checkInTime, setCheckInTime] = useState('13:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [rooms, setRooms] = useState(1);
  const [children5To10, setChildren5To10] = useState(0);
  const [extraAdultsAbove10, setExtraAdultsAbove10] = useState(0);
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) navigate('/login', { replace: true });
      } catch {
        navigate('/login', { replace: true });
      }
    };
    run();
  }, [navigate]);

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

  const adults = useMemo(() => {
    const baseAdults = Number(room?.person ?? 2);
    const extraAdults = Number(extraAdultsAbove10 ?? 0);
    const computed = baseAdults + extraAdults;
    return Number.isFinite(computed) && computed > 0 ? computed : baseAdults;
  }, [room?.person, extraAdultsAbove10]);

  const formatInr = (value: any) => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return String(value ?? '0');
    const hasFraction = Math.abs(n % 1) > 0.000001;
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: hasFraction ? 2 : 0,
      }).format(n);
    } catch {
      return String(n);
    }
  };

  const priceBreakdown = useMemo(() => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const perNight = room?.pricePerNight ?? 0;
    const safeRooms = Number.isFinite(rooms) && rooms > 0 ? rooms : 1;
    const roomTotal = round2(perNight * nights * safeRooms);
    const childCharge = round2(1200 * children5To10 * nights);
    const extraAdultCharge = round2(1500 * extraAdultsAbove10 * nights);
    const baseAmount = round2(roomTotal + childCharge + extraAdultCharge);
    const gstAmount = round2(baseAmount * 0.05);
    const totalAmount = round2(baseAmount + gstAmount);
    return { roomTotal, childCharge, extraAdultCharge, baseAmount, gstAmount, totalAmount };
  }, [room?.pricePerNight, nights, rooms, children5To10, extraAdultsAbove10]);

  const formattedTotal = useMemo(() => {
    return formatInr(priceBreakdown.totalAmount);
  }, [priceBreakdown.totalAmount]);

  const formattedPerNight = useMemo(() => {
    const perNight = room?.pricePerNight ?? 0;
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(perNight);
    } catch {
      return String(perNight);
    }
  }, [room?.pricePerNight]);

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
    if (err) return;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: Number(id),
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
        }),
      });

      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.error?.message ?? 'Booking failed');
        return;
      }

      const bookingId = data?.data?.booking?.id;
      const razorpay = data?.data?.razorpay;
      if (!bookingId || !razorpay?.orderId || !razorpay?.keyId) {
        setFormError('Payment initialization failed');
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok || !(window as any).Razorpay) {
        setFormError('Failed to load payment gateway');
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
              setFormError(verifyData?.error?.message ?? 'Payment verification failed');
              return;
            }

            navigate('/profile');
          } catch {
            setFormError('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setFormError('Payment cancelled');
          },
        },
      });

      rz.open();
    } catch {
      setFormError('Booking failed');
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
                  <input
                    id="checkIn"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={todayIso}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
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
                  <input
                    id="checkOut"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkOutMinIso}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
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
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                  <div className="text-xs text-gray-800/60 mt-1">₹1500 per person (per night, incl. extra mattress)</div>
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
                  <span className="font-semibold text-gray-800">{formattedPerNight}</span>
                </div>

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Nights</span>
                  <span className="font-semibold text-gray-800">{nights}</span>
                </div>

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>Room total</span>
                  <span className="font-semibold text-gray-800">{formatInr(priceBreakdown.roomTotal)}</span>
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
                  <span>Base amount</span>
                  <span className="font-semibold text-gray-800">{formatInr(priceBreakdown.baseAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-gray-800/80">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-gray-800">{formatInr(priceBreakdown.gstAmount)}</span>
                </div>

                <div className="border-t border-gold/20 pt-4 flex items-center justify-between">
                  <span className="text-gray-800 font-semibold">Total</span>
                  <span className="text-gray-800 font-bold text-xl">{formattedTotal}</span>
                </div>

                <button
                  disabled={nights === 0}
                  className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200"
                  onClick={() => {
                    submitBooking();
                  }}
                >
                  Confirm Booking
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
