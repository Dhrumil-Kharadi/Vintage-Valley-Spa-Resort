import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { Wifi, Car, Tv, Bath, Users, Bed, Mountain, Coffee } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ApiRoom = {
  id: number;
  title: string;
  description: string;
  pricePerNight: number;
  images: string[];
  amenities: string[];
};

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
  amenities: { icon: any; name: string }[];
};

const Rooms = () => {
  const navigate = useNavigate();
  const [selectedPricing, setSelectedPricing] = useState<'weekday' | 'weekend'>('weekday');
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [apiRooms, setApiRooms] = useState<ApiRoom[]>([]);

  const goToBooking = (roomId: number) => {
    navigate(`/booking/${roomId}`);
  };

  useEffect(() => {
    const run = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const res = await fetch('/api/rooms', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load rooms');
        setApiRooms(data?.data?.rooms ?? []);
      } catch (e: any) {
        setRoomsError(e?.message ?? 'Failed to load rooms');
      } finally {
        setRoomsLoading(false);
      }
    };

    run();
  }, []);

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
    const fmt = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(amount);
      } catch {
        return `₹${amount}`;
      }
    };

    return (apiRooms ?? []).map((r) => {
      const price = Number(r.pricePerNight ?? 0);
      const images = Array.isArray(r.images) ? r.images : [];
      const amenities = Array.isArray(r.amenities) ? r.amenities : [];

      return {
        id: r.id,
        title: r.title,
        subtitle: 'Elegant Comfort in Nature',
        images: images.length ? images : ['/images/room/1.jpeg', '/images/room/4.jpeg', '/images/room/5.jpeg'],
        description: r.description,
        capacity: '2 Adults',
        bedType: 'Standard Size Bed',
        size: '—',
        pricing: {
          weekday: fmt(price),
          weekend: fmt(price),
        },
        amenities: amenities.map((name) => {
          const key = String(name).toLowerCase();
          const Icon =
            amenityIconByName[
              Object.keys(amenityIconByName).find((k) => key.includes(k)) ?? ''
            ] ?? Coffee;
          return { icon: Icon, name };
        }),
      };
    });
  }, [apiRooms]);

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-6">
            Luxury Accommodations
          </h1>
          <p className="text-xl text-ivory/80 max-w-2xl mx-auto mb-8">
            Discover our collection of thoughtfully designed suites, each offering a unique blend of comfort and elegance
          </p>
          
          {/* Pricing Toggle */}
          <div className="inline-flex bg-ivory/10 rounded-full p-1 backdrop-blur-sm">
            <button
              onClick={() => setSelectedPricing('weekday')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedPricing === 'weekday'
                  ? 'bg-gold text-gray-800'
                  : 'text-ivory hover:text-gold'
              }`}
            >
              Weekday Rates
            </button>
            <button
              onClick={() => setSelectedPricing('weekend')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedPricing === 'weekend'
                  ? 'bg-gold text-gray-800'
                  : 'text-ivory hover:text-gold'
              }`}
            >
              Weekend Rates
            </button>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto space-y-16">
          {roomsError && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{roomsError}</div>
          )}

          {roomsLoading ? (
            <div className="text-gray-800/70">Loading rooms…</div>
          ) : toUiRooms.length === 0 ? (
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
                  <div className="absolute top-4 right-4 bg-gold text-charcoal px-4 py-2 rounded-full font-bold">
                    {room.pricing[selectedPricing]}/night
                  </div>
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
                  <button
                    className="bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 flex-1 sm:flex-none"
                    onClick={() => {
                      goToBooking(room.id);
                    }}
                  >
                    Book This Suite
                  </button>
                  <button
                    className="border-2 border-gray-800 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-ivory transition-colors duration-200 flex-1 sm:flex-none"
                    onClick={() => {
                      const msg = encodeURIComponent("Hey there! 👋 I’m interested in planning my stay and would love to know more about availability, rates, and any current offers. Could you please assist me? ");
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
