import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import { roomLivePriceService, RoomPrice } from "../lib/roomLivePrice.service";
import { useEffect, useState } from "react";

const getAvailabilityStatus = (availability: number, requestedRooms: number) => {
  if (availability < requestedRooms) {
    return { status: 'sold-out', label: 'Sold Out', color: 'bg-red-600' };
  } else if (availability <= 2) {
    return { status: 'limited', label: `Only ${availability} Left`, color: 'bg-orange-600' };
  } else {
    return { status: 'available', label: `${availability} Available`, color: 'bg-green-600' };
  }
};

const RoomMinimal = () => {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const [prices, setPrices] = useState<RoomPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await roomLivePriceService.getRoomPrices({
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
      });
      if (response.success) {
        setPrices(response.rooms);
      } else {
        setError(response.message || "Failed to fetch prices");
        setPrices([]);
      }
    } catch (e: any) {
      console.error("RoomMinimal fetchPrices error:", e);
      setError("Price unavailable. Please try again.");
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [checkIn, checkOut, adults, children, rooms]);

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
                onClick={fetchPrices}
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
          ) : prices.length === 0 ? (
            <div className="text-gray-800/70">No rooms available for selected dates.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {prices.map((room) => {
                const availabilityStatus = getAvailabilityStatus(room.availability, rooms);
                const isSoldOut = availabilityStatus.status === 'sold-out';
                
                return (
                  <div
                    key={room.roomType}
                    className="bg-white rounded-3xl overflow-hidden luxury-shadow transform transition-transform duration-200 hover:scale-[1.02]"
                  >
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center text-gray-800/50">
                      No image
                      {/* Availability Badge */}
                      <div className="absolute top-4 right-4">
                        <div className={`${availabilityStatus.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                          {availabilityStatus.label}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-playfair text-2xl font-bold text-gray-800">{room.roomType}</h3>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-800/70">
                          <span className={`font-semibold ${
                            isSoldOut ? 'text-red-600' : 
                            availabilityStatus.status === 'limited' ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {room.availability} rooms
                          </span>
                          {" "}available
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-800/60">Avg price / night</div>
                          <div className="text-lg font-semibold text-gray-800">
                            {room.currency}
                            {room.price}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          className={`w-full px-6 py-3 rounded-full font-semibold transition-colors duration-200 ${
                            isSoldOut
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-gray-800 text-ivory hover:bg-gray-800/85"
                          }`}
                          disabled={isSoldOut}
                          onClick={() => {
                            if (!isSoldOut) {
                              const msg = encodeURIComponent(
                                `Hello! I want to book ${room.roomType}.\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nAdults: ${adults}\nChildren: ${children}\nRooms: ${rooms}`
                              );
                              window.open(`https://wa.me/919371179888?text=${msg}`, "_blank");
                            }
                          }}
                        >
                          {isSoldOut ? "Sold Out" : "Book Now"}
                        </button>

                        {isSoldOut && (
                          <p className="text-center text-sm text-gray-500 mt-2">
                            Not enough rooms available for selected dates
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoomMinimal;
