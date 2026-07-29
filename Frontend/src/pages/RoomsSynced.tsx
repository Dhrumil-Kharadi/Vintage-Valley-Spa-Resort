import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import { Wifi, Car, Tv, Bath, Users, Bed, Mountain, Coffee } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roomDatabaseService, DatabaseRoom } from "../lib/roomDatabase.service";
import { openEzeeBookingEngine } from "../services/ezeeBookingService";

const RoomsSynced = () => {
  const navigate = useNavigate();
  const [selectedPricing, setSelectedPricing] = useState<'base' | 'ep' | 'cp' | 'map'>('base');
  const [dbRooms, setDbRooms] = useState<DatabaseRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Date and guest state for availability
  const [checkIn, setCheckIn] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await roomDatabaseService.getDatabaseRooms();
      if (response.success) {
        setDbRooms(response.rooms);
      } else {
        setError(response.error || "Failed to fetch rooms");
      }
    } catch (e: any) {
      setError("Unable to load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const syncPrices = async () => {
    setSyncing(true);
    try {
      const response = await roomDatabaseService.syncPrices();
      if (response.success) {
        setLastSync(new Date());
        // Refresh rooms after sync
        await fetchRooms();
      } else {
        setError(response.error || "Failed to sync prices");
      }
    } catch (e: any) {
      setError("Unable to sync prices. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const getAmenityIcon = (amenityName: string) => {
    const name = amenityName.toLowerCase();
    if (name.includes("wifi")) return Wifi;
    if (name.includes("parking")) return Car;
    if (name.includes("tv")) return Tv;
    if (name.includes("bath") || name.includes("washroom")) return Bath;
    if (name.includes("balcony") || name.includes("view")) return Mountain;
    if (name.includes("coffee") || name.includes("tea")) return Coffee;
    return Users; // default
  };

  const getPriceForPlan = (room: DatabaseRoom) => {
    switch (selectedPricing) {
      case 'ep':
        return room.epPricePerNight || room.pricePerNight;
      case 'cp':
        return room.cpPricePerNight || room.pricePerNight;
      case 'map':
        return room.mapPricePerNight || room.pricePerNight;
      default:
        return room.pricePerNight;
    }
  };

  const getPlanLabel = () => {
    switch (selectedPricing) {
      case 'ep': return 'European Plan';
      case 'cp': return 'Continental Plan';
      case 'map': return 'Modified American Plan';
      default: return 'Base Price';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-800">Loading rooms...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      <section className="pt-24 pb-10 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-3">Rooms</h1>
              <p className="text-lg text-ivory/80 max-w-2xl">
                Experience luxury accommodation with prices synced directly from our booking system.
              </p>
              {lastSync && (
                <p className="text-sm text-ivory/60 mt-2">
                  Last synced: {lastSync.toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={syncPrices}
              disabled={syncing}
              className="bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 disabled:opacity-60 flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <span>↻</span>
                  Sync Prices
                </>
              )}
            </button>
          </div>

          {/* Pricing Plan Selector */}
          <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-4">
            <label className="block text-ivory/90 text-sm mb-2">Select Pricing Plan:</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'base' as const, label: 'Base Price' },
                { key: 'ep' as const, label: 'European Plan (EP)' },
                { key: 'cp' as const, label: 'Continental Plan (CP)' },
                { key: 'map' as const, label: 'Modified American Plan (MAP)' },
              ].map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPricing(plan.key)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedPricing === plan.key
                      ? "bg-gold text-gray-800"
                      : "bg-white/20 text-ivory hover:bg-white/30"
                  }`}
                >
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date and Guest Pickers */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
            <h3 className="text-ivory font-semibold mb-4">Check Availability</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-ivory/80 text-sm mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-ivory placeholder-ivory/60 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-ivory/80 text-sm mb-2">Check-out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-ivory placeholder-ivory/60 focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-ivory/80 text-sm mb-2">Adults</label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-ivory focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n} className="bg-gray-800">{n} {n === 1 ? 'Adult' : 'Adults'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-ivory/80 text-sm mb-2">Rooms</label>
                <select
                  value={rooms}
                  onChange={(e) => setRooms(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-ivory focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {[1, 2, 3].map(n => (
                    <option key={n} value={n} className="bg-gray-800">{n} {n === 1 ? 'Room' : 'Rooms'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {dbRooms.map((room) => {
              const price = getPriceForPlan(room);
              const firstImage = room.images[0];
              const isSoldOut = room.availableRooms < rooms;
              
              return (
                <div
                  key={room.id}
                  className="group bg-white rounded-3xl overflow-hidden luxury-shadow hover:shadow-2xl transition-all duration-300"
                >
                  {/* Image Section */}
                  <div className="relative h-80 overflow-hidden">
                    {firstImage ? (
                      <img
                        src={firstImage.url}
                        alt={room.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="font-playfair text-3xl font-bold mb-2">{room.title}</h3>
                      <p className="text-white/90">Max {room.person} Guests</p>
                    </div>
                    {/* Availability Badge */}
                    <div className="absolute top-6 right-6">
                      {isSoldOut ? (
                        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Sold Out
                        </div>
                      ) : room.availableRooms <= 2 ? (
                        <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Only {room.availableRooms} Left
                        </div>
                      ) : (
                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {room.availableRooms} Available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-8">
                    <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                      {room.description}
                    </p>

                    {/* Amenities */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Amenities</h4>
                      <div className="flex flex-wrap gap-3">
                        {room.amenities.slice(0, 6).map((amenity) => {
                          const Icon = getAmenityIcon(amenity.name);
                          return (
                            <div
                              key={amenity.id}
                              className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full"
                            >
                              <Icon className="w-4 h-4" />
                              <span>{amenity.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500">{getPlanLabel()}</p>
                          <p className="text-3xl font-bold text-gray-800">
                            ₹{price.toLocaleString()}
                            <span className="text-lg font-normal text-gray-500">/night</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Availability</p>
                          <p className={`text-lg font-semibold ${
                            isSoldOut ? 'text-red-600' : 
                            room.availableRooms <= 2 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {room.availableRooms} Rooms
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => openEzeeBookingEngine({ checkIn, checkOut, adults })}
                        disabled={isSoldOut}

                        className={`w-full px-8 py-4 rounded-full font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
                          isSoldOut 
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gray-800 text-ivory hover:bg-gray-800/85"
                        }`}
                      >
                        {isSoldOut ? "Sold Out" : "Book Now"}
                      </button>

                      {isSoldOut && (
                        <p className="text-center text-sm text-gray-500 mt-2">
                          This room is sold out for the selected dates
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoomsSynced;
