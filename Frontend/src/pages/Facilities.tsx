import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import FacilityModal from '@/components/FacilityModal';
import { Waves, Utensils, Dumbbell, TreePine, Gamepad2, Sparkles, Users, Camera } from 'lucide-react';
import { useState } from 'react';

const Facilities = () => {
  type Facility = {
    id: number;
    title: string;
    icon: React.ElementType;
    description: string;
    image: string;
    features: string[];
  };
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const facilities = [
    {
      id: 1,
      title: 'Valley Edge Pool',
      icon: Waves,
      description: 'Valley edge pool overlooking the valley with crystal-clear waters and panoramic mountain views. Perfect for relaxation and memorable moments.',
      image: '/images/infinity-pool-1.jpg',
      features: ['Valley views', 'Sunrise sessions']
    },
    {
      id: 2,
      title: 'Palatio Banquet',
      icon: Users,
      description: 'Elegant outdoor venue perfect for weddings, corporate events, and celebrations. Set against the backdrop of lush greenery and mountain vistas.',
      image: '/images/benq.jpeg',
      features: ['Capacity 250 guests', 'Professional lighting', 'Catering services', 'Event planning']
    },
    {
      id: 3,
      title: 'Tarkari Restaurant',
      icon: Utensils,
      description: 'Premium dining experience featuring local and international cuisine. Our chefs create culinary masterpieces using fresh, locally sourced ingredients.',
      image: '/images/cafe-lounge-1.jpg',
      features: ['Multi-cuisine menu', 'Fine dining', 'Outdoor seating', 'Special dietary options']
    },
    {
      id: 4,
      title: 'Spa & Wellness (Coming Soon)',
      icon: Sparkles,
      description: 'Our Spa & Wellness center is coming soon! Stay tuned for rejuvenating treatments and wellness therapies designed for your ultimate relaxation.',
      image: '/images/room/1000021291.jpg',
      features: ['Ayurvedic treatments', 'Couple therapy rooms', 'Aromatherapy', 'Wellness consultations']
    },
    {
      id: 5,
      title: 'Euphoria Gym',
      icon: Dumbbell,
      description: 'Euphoria gym equipped with modern equipment and premium amenities. Maintain your fitness routine while enjoying nature views.',
      image: '/images/room/1000020999.png',
      features: ['Modern equipment', 'Indoor/Outdoor workouts', 'Treadmill', 'Elliptical']
    },
    {
      id: 6,
      title: 'Game Zone',
      icon: Gamepad2,
      description: 'Comprehensive indoor and outdoor recreational activities for all ages. From traditional games to modern sports facilities, ensuring fun and fitness for the entire family.',
      image: '/images/room/1000021267.jpg',
      features: ['Indoor Games', 'Pool Table', 'Board Games', 'Kids play area']
    },
    {
      id: 7,
      title: 'Nature Trails',
      icon: TreePine,
      description: 'Guided nature walks through pristine landscapes and scenic trails. Discover local flora and fauna while connecting with the natural beauty of Igatpuri.',
      image: '/images/nature-trails-1.jpg',
      features: ['Guided tours', 'Bird watching', 'Photography spots', 'Sunrise/sunset walks']
    },
    {
      id: 8,
      title: 'Conference Hall',
      icon: Camera,
      description: 'Professional meeting spaces equipped with modern technology for corporate events and business gatherings in a serene environment.',
      image: '/images/conference-hall-1.jpg',
      features: ['AV equipment', 'High-speed internet', 'Catering services', 'Professional setup']
    },
    {
      id: 9,
      title: 'Cafe Vintage Bite (Coming Soon)',
      icon: Utensils,
      description: 'Our cafe, Cafe Vintage Bite, is coming soon! Enjoy fresh brews, snacks, and a cozy ambiance in the near future.',
      image: '/images/room/AB004878.JPG',
      features: ['Artisan coffee', 'Fresh snacks', 'Cozy seating']
    },
  ];

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFacility(null);
  };

  const handleImageError = (facilityId: number) => {
    setImageErrors(prev => new Set(prev).add(facilityId));
  };

  const getImageSrc = (facility: Facility) => {
    if (imageErrors.has(facility.id)) {
      return '/images/placeholder.svg';
    }
    return facility.image;
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      {/* Hero Section */}
      <section className="pt-24 pb-10 sm:pb-16 bg-gradient-to-br from-charcoal to-charcoal/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-ivory mb-4 sm:mb-6">
            World-Class Facilities
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-ivory/80 max-w-3xl mx-auto leading-relaxed">
            Discover premium amenities and exceptional services designed to enhance every moment of your stay at Vintage Valley Resort
          </p>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {facilities.map((facility, index) => {
              const isComingSoon = facility.id === 4 || facility.id === 9;
              return (
                <div
                  key={facility.id}
                  id={facility.title.toLowerCase().replace(/\s|&/g, '-').replace(/-{2,}/g, '-')}
                  className={`group flex flex-col h-full ${isComingSoon ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70' : 'bg-white cursor-pointer hover:shadow-2xl'}
                   rounded-2xl sm:rounded-3xl overflow-hidden luxury-shadow transition-all duration-500`}
                  onClick={isComingSoon ? undefined : () => handleFacilityClick(facility)}
                >
                  <div className="relative overflow-hidden flex-shrink-0">
                    <img
                      src={getImageSrc(facility)}
                      alt={facility.title}
                      className={`w-full h-48 sm:h-56 lg:h-64 object-cover transition-transform duration-700 ${isComingSoon ? 'grayscale brightness-110' : 'group-hover:scale-110'}`}
                      onError={() => handleImageError(facility.id)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
                    {isComingSoon && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gold/90 text-charcoal px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-bold text-lg sm:text-xl shadow-2xl opacity-95">
                          Coming Soon
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                      <div className="bg-gold/90 backdrop-blur-sm rounded-full p-2 sm:p-3">
                        <facility.icon className="h-5 w-5 sm:h-6 sm:w-6 text-charcoal" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
                    <h2 className="font-playfair text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal mb-3 sm:mb-4">
                      {facility.title}
                    </h2>
                    <p className="text-charcoal/80 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 flex-1">
                      {facility.description}
                    </p>
                    
                    <div className="space-y-2 mb-4 sm:mb-6">
                      {facility.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0" />
                          <span className="text-charcoal/70 text-sm sm:text-base">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {!isComingSoon && (
                      <button className="bg-gradient-to-r from-gold to-bronze text-charcoal px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base self-start">
                        Learn More
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Facility Modal */}
      {selectedFacility && (
        <FacilityModal
          facility={selectedFacility}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

      <Footer />
    </div>
  );
};

export default Facilities;
