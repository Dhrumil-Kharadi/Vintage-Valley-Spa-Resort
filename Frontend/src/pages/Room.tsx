import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import axios from "axios";
import { useMemo, useState } from "react";
import { openEzeeBookingEngine } from "../services/ezeeBookingService";

interface Room {
  roomtypeunkid: string;
  Room_Name: string;
  Room_Description: string;
  max_adult_occupancy: number;
  max_child_occupancy: number;
  available_rooms: number;
  avg_price_per_night: number;
  total_price: number;
  currency_sign: string;
  RoomAmenities: string;
  room_main_image?: string;
}

const isoToday = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDaysIso = (iso: string, days: number) => {
  const dt = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(dt.getTime())) return iso;
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toCurrency = (amount: any, currencySign: string) => {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return `${currencySign}${amount ?? 0}`;
  const hasFraction = Math.abs(n % 1) > 0.000001;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0,
    }).format(n);
  } catch {
    return `${currencySign}${n}`;
  }
};

const RoomPage = () => {
  const today = useMemo(() => isoToday(), []);

  const [checkIn, setCheckIn] = useState<string>(today);
  const [checkOut, setCheckOut] = useState<string>(addDaysIso(today, 1));
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Room[]>([]);

  const search = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get("/api/rooms", {
        params: {
          checkIn,
          checkOut,
          adults,
          children,
          rooms,
        },
        withCredentials: true,
      });

      const list = (res.data?.data?.rooms ?? []) as Room[];
      setResults(Array.isArray(list) ? list : []);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? e?.message ?? "Failed to fetch rooms";
      setError(String(msg));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const amenityTags = (amenities: string) => {
    const raw = String(amenities ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return raw;
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      <section className="pt-24 pb-10 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-3">Rooms</h1>
          <p className="text-lg text-ivory/80 max-w-2xl">
            Search live availability and pricing for your selected dates.
          </p>

          <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-ivory/90 text-sm mb-2">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-ivory/90 text-sm mb-2">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-ivory/90 text-sm mb-2">Adults</label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 outline-none focus:ring-2 focus:ring-gold"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-ivory/90 text-sm mb-2">Children</label>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 outline-none focus:ring-2 focus:ring-gold"
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-ivory/90 text-sm mb-2">Rooms</label>
                <select
                  value={rooms}
                  onChange={(e) => setRooms(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/90 text-gray-800 outline-none focus:ring-2 focus:ring-gold"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={search}
                disabled={loading}
                className="bg-gold text-gray-800 px-8 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 disabled:opacity-60"
              >
                {loading ? "Searching..." : "Search"}
              </button>

              {error && <div className="text-ivory/90 text-sm">{error}</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-gray-800/70">Loading availability…</div>
          ) : results.length === 0 ? (
            <div className="text-gray-800/70">Search to view available rooms.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map((room) => (
                <div
                  key={room.roomtypeunkid}
                  className="bg-white rounded-3xl overflow-hidden luxury-shadow transform transition-transform duration-200 hover:scale-[1.02]"
                >
                  <div className="h-48 bg-gray-100">
                    {room.room_main_image ? (
                      <img
                        src={room.room_main_image}
                        alt={room.Room_Name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-800/50">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-playfair text-2xl font-bold text-gray-800">{room.Room_Name}</h3>
                    <p className="text-gray-800/70 mt-2 line-clamp-4">{room.Room_Description}</p>

                    <div className="mt-4 text-sm text-gray-800/70">
                      Max occupancy: {room.max_adult_occupancy} adults, {room.max_child_occupancy} children
                    </div>

                    <div className="mt-2 text-sm text-gray-800/70">Available rooms: {room.available_rooms}</div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-xs text-gray-800/60">Avg price / night</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {toCurrency(room.avg_price_per_night, room.currency_sign || "₹")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-800/60">Total</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {toCurrency(room.total_price, room.currency_sign || "₹")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {amenityTags(room.RoomAmenities)
                        .slice(0, 10)
                        .map((a) => (
                          <span
                            key={`${room.roomtypeunkid}:${a}`}
                            className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gray-800 border border-gold/20"
                          >
                            {a}
                          </span>
                        ))}
                    </div>

                    <div className="mt-6">
                      <button
                        className="w-full bg-gray-800 text-ivory px-6 py-3 rounded-full font-semibold hover:bg-gray-800/85 transition-colors duration-200"
                        onClick={() => {
                          openEzeeBookingEngine({ checkIn, checkOut, adults, children });
                        }}
                      >
                        Book Now
                      </button>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoomPage;
