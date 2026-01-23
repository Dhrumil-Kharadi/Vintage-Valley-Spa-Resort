import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Waves, TreePine, Crown, Star, MapPin, Phone, Mail, Calendar, Users, Award, Gamepad2, ChevronLeft, ChevronRight, X, Maximize2, Heart } from 'lucide-react';
import { rooms, Room } from '../roomsData';
import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

// Enhanced Gallery Component with Lightbox
function EnhancedGallery() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentCategory, setCurrentCategory] = useState('featured');

  const categories = [
    { id: 'featured', name: 'Featured', count: 12 },
    { id: 'rooms', name: 'Rooms & Suites', count: 18 },
    { id: 'facilities', name: 'Facilities', count: 15 },
    { id: 'nature', name: 'Nature & Views', count: 25 },
    { id: 'dining', name: 'Dining', count: 12 }
  ];

  const galleryImages = [
    // Featured Images
    { id: 1, category: 'featured', src: '/images/deluxe-studio-suite-1.jpg', alt: 'Deluxe Studio Suite', featured: true },
    { id: 2, category: 'featured', src: '/images/infinity-pool-1.jpg', alt: 'Infinity Pool', featured: true },
    { id: 3, category: 'featured', src: '/images/1.jpeg', alt: 'Lotus Family Suite', featured: true },
    { id: 4, category: 'featured', src: '/images/presidential-sky-villa-1.jpg', alt: 'Presidential Sky Villa', featured: true },
    { id: 5, category: 'featured', src: '/images/at/1.jpg', alt: 'Scenic Valley View', featured: true },
    { id: 6, category: 'featured', src: '/images/deluxe-edge-view-1.jpg', alt: 'Deluxe Edge View', featured: true },
    { id: 7, category: 'featured', src: '/images/at/2.jpg', alt: 'Mountain Landscape', featured: true },
    { id: 8, category: 'featured', src: '/images/infinity-pool-2.jpg', alt: 'Pool at Sunset', featured: true },
    { id: 9, category: 'featured', src: '/images/2.jpeg', alt: 'Lotus Suite Interior', featured: true },
    { id: 10, category: 'featured', src: '/images/at/3.jpg', alt: 'Valley Vista', featured: true },
    { id: 11, category: 'featured', src: '/images/skyline-deluxe-1.jpg', alt: 'Skyline Deluxe', featured: true },
    { id: 12, category: 'featured', src: '/images/at/4.jpg', alt: 'Nature Trail', featured: true },

    // Room Images
    { id: 13, category: 'rooms', src: '/images/deluxe-studio-suite-2.jpg', alt: 'Deluxe Studio Suite 2' },
    { id: 14, category: 'rooms', src: '/images/deluxe-studio-suite-3.jpg', alt: 'Deluxe Studio Suite 3' },
    { id: 15, category: 'rooms', src: '/images/skyline-deluxe-2.jpg', alt: 'Skyline Deluxe 2' },
    { id: 16, category: 'rooms', src: '/images/skyline-deluxe-3.jpg', alt: 'Skyline Deluxe 3' },
    { id: 17, category: 'rooms', src: '/images/deluxe-edge-view-2.jpg', alt: 'Deluxe Edge View 2' },
    { id: 18, category: 'rooms', src: '/images/deluxe-edge-view-3.jpg', alt: 'Deluxe Edge View 3' },
    { id: 19, category: 'rooms', src: '/images/3.jpeg', alt: 'Lotus Family Suite 3' },
    { id: 20, category: 'rooms', src: '/images/presidential-sky-villa-2.jpg', alt: 'Presidential Sky Villa 2' },
    { id: 21, category: 'rooms', src: '/images/presidential-sky-villa-3.jpg', alt: 'Presidential Sky Villa 3' },
    { id: 22, category: 'rooms', src: '/images/room/AB004964.JPG', alt: 'Luxury Room Suite' },
    { id: 23, category: 'rooms', src: '/images/room/AB004978.JPG', alt: 'Premium Room Interior' },
    { id: 24, category: 'rooms', src: '/images/room/AB005018.JPG', alt: 'Deluxe Room View' },
    { id: 25, category: 'rooms', src: '/images/room/AB005030.JPG', alt: 'Suite Bathroom' },
    { id: 26, category: 'rooms', src: '/images/room/AB005053.JPG', alt: 'Room Amenities' },
    { id: 27, category: 'rooms', src: '/images/room/AB005063.JPG', alt: 'Room Details' },
    { id: 28, category: 'rooms', src: '/images/room/AB004906.JPG', alt: 'Room Interior' },
    { id: 29, category: 'rooms', src: '/images/room/AB004915.JPG', alt: 'Suite Living Area' },
    { id: 30, category: 'rooms', src: '/images/room/AB004929.JPG', alt: 'Room Design' },

    // Facility Images
    { id: 31, category: 'facilities', src: '/images/infinity-pool-3.jpg', alt: 'Infinity Pool 3' },
    { id: 32, category: 'facilities', src: '/images/nature-trails-1.jpg', alt: 'Nature Trails' },
    { id: 33, category: 'facilities', src: '/images/conference-hall-1.jpg', alt: 'Conference Hall' },
    { id: 34, category: 'facilities', src: '/images/banquet-lawn-1.jpg', alt: 'Banquet Lawn' },
    { id: 35, category: 'facilities', src: '/images/banquet-lawn-2.jpg', alt: 'Banquet Lawn 2' },
    { id: 36, category: 'facilities', src: '/images/cafe-lounge-1.jpg', alt: 'Cafe Lounge' },
    { id: 37, category: 'facilities', src: '/images/cafe-lounge-2.jpg', alt: 'Cafe Lounge 2' },
    { id: 38, category: 'facilities', src: '/images/cafe-lounge-3.jpg', alt: 'Cafe Lounge 3' },
    { id: 39, category: 'facilities', src: '/images/pool/AB004771.JPG', alt: 'Pool Area' },
    { id: 40, category: 'facilities', src: '/images/pool/AB004776.JPG', alt: 'Pool View' },
    { id: 41, category: 'facilities', src: '/images/pool/AB004802.JPG', alt: 'Pool Facilities' },
    { id: 42, category: 'facilities', src: '/images/pool/AB004825.JPG', alt: 'Pool Deck' },
    { id: 43, category: 'facilities', src: '/images/pool/AB004827.JPG', alt: 'Pool Landscape' },
    { id: 44, category: 'facilities', src: '/images/pool/AB004834.JPG', alt: 'Pool Amenities' },
    { id: 45, category: 'facilities', src: '/images/pool/AB005094.JPG', alt: 'Pool Complex' },

    // Nature Images
    { id: 46, category: 'nature', src: '/images/at/5.jpg', alt: 'Valley View 1' },
    { id: 47, category: 'nature', src: '/images/at/6.jpg', alt: 'Valley View 2' },
    { id: 48, category: 'nature', src: '/images/at/7.jpg', alt: 'Valley View 3' },
    { id: 49, category: 'nature', src: '/images/at/8.jpeg', alt: 'Valley View 4' },
    { id: 50, category: 'nature', src: '/images/at/9.jpg', alt: 'Valley View 5' },
    { id: 51, category: 'nature', src: '/images/at/10.jpg', alt: 'Valley View 6' },
    { id: 52, category: 'nature', src: '/images/at/11.jpg', alt: 'Valley View 7' },
    { id: 53, category: 'nature', src: '/images/at/12.jpg', alt: 'Valley View 8' },
    { id: 54, category: 'nature', src: '/images/at/13.jpg', alt: 'Valley View 9' },
    { id: 55, category: 'nature', src: '/images/at/14.jpeg', alt: 'Valley View 10' },
    { id: 56, category: 'nature', src: '/images/at/15.jpg', alt: 'Valley View 11' },
    { id: 57, category: 'nature', src: '/images/at/16.jpeg', alt: 'Valley View 12' },
    { id: 58, category: 'nature', src: '/images/at/17.jpg', alt: 'Valley View 13' },
    { id: 59, category: 'nature', src: '/images/at/18.png', alt: 'Valley View 14' },
    { id: 60, category: 'nature', src: '/images/at/19.jpg', alt: 'Valley View 15' },
    { id: 61, category: 'nature', src: '/images/at/20.jpeg', alt: 'Valley View 16' },
    { id: 62, category: 'nature', src: '/images/at/21.jpg', alt: 'Valley View 17' },
    { id: 63, category: 'nature', src: '/images/at/30.jpg', alt: 'Valley View 18' },
    { id: 64, category: 'nature', src: '/images/at/31.jpeg', alt: 'Valley View 19' },
    { id: 65, category: 'nature', src: '/images/at/32.jpeg', alt: 'Valley View 20' },
    { id: 66, category: 'nature', src: '/images/at/33.jpeg', alt: 'Valley View 21' },
    { id: 67, category: 'nature', src: '/images/at/34.jpg', alt: 'Valley View 22' },
    { id: 68, category: 'nature', src: '/images/at/35.jpg', alt: 'Valley View 23' },
    { id: 69, category: 'nature', src: '/images/at/kasara.jpeg', alt: 'Kasara View' },
    { id: 70, category: 'nature', src: '/images/at/151.jpeg', alt: 'Nature Trail 1' },

    // Dining Images
    { id: 71, category: 'dining', src: '/images/room/AB004776.JPG', alt: 'Dining Area 1' },
    { id: 72, category: 'dining', src: '/images/room/AB004771.JPG', alt: 'Dining Area 2' },
    { id: 73, category: 'dining', src: '/images/room/AB004778.JPG', alt: 'Dining Area 3' },
    { id: 74, category: 'dining', src: '/images/room/AB004798.JPG', alt: 'Dining Area 4' },
    { id: 75, category: 'dining', src: '/images/room/AB004804.JPG', alt: 'Dining Area 5' },
    { id: 76, category: 'dining', src: '/images/room/AB004812.JPG', alt: 'Dining Area 6' },
    { id: 77, category: 'dining', src: '/images/room/AB004854.JPG', alt: 'Dining Area 7' },
    { id: 78, category: 'dining', src: '/images/room/AB004857.JPG', alt: 'Dining Area 8' },
    { id: 79, category: 'dining', src: '/images/room/AB004859.JPG', alt: 'Dining Area 9' },
    { id: 80, category: 'dining', src: '/images/room/AB004874.JPG', alt: 'Dining Area 10' },
    { id: 81, category: 'dining', src: '/images/room/AB004886 (1).JPG', alt: 'Dining Area 11' },
    { id: 82, category: 'dining', src: '/images/room/AB004887.JPG', alt: 'Dining Area 12' },
  ];

  const filteredImages = currentCategory === 'featured' 
    ? galleryImages.filter(img => img.category === 'featured')
    : galleryImages.filter(img => img.category === currentCategory);

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return;
    
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    } else {
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(filteredImages[newIndex].id);
  };

  const currentLightboxImage = filteredImages.find(img => img.id === selectedImage);

  return (
    <section className="py-20 bg-gradient-to-br from-ivory via-white to-ivory/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-gold/10 rounded-full mb-6">
            <span className="text-gold font-medium tracking-wide">VISUAL JOURNEY</span>
          </div>
          <h2 className="font-playfair text-5xl md:text-6xl font-bold text-charcoal mb-8">
            Gallery of Memories
          </h2>
          <p className="text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
            Explore the beauty and luxury of Vintage Valley through our curated collection of moments
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCurrentCategory(category.id)}
              className={`group px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                currentCategory === category.id
                  ? 'bg-gold text-charcoal shadow-lg'
                  : 'bg-white text-charcoal/70 hover:bg-gold/20 hover:text-charcoal border border-charcoal/10'
              }`}
            >
              <span className="flex items-center gap-2">
                {category.name}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  currentCategory === category.id 
                    ? 'bg-charcoal/20 text-charcoal' 
                    : 'bg-charcoal/10 text-charcoal/60'
                }`}>
                  {category.count}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className={`group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                image.featured ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              onClick={() => openLightbox(image.id)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  className={`w-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                    image.featured ? 'h-80 md:h-96' : 'h-48 md:h-56'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
                    {image.alt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button 
            onClick={() => navigate('/gallery')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-bronze text-charcoal font-semibold px-8 py-4 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            View Full Gallery
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Enhanced Lightbox */}
      {selectedImage && currentLightboxImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-gold transition-colors z-10 bg-black/50 rounded-full p-2"
          >
            <X className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => navigateLightbox('prev')}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gold transition-colors z-10 bg-black/50 rounded-full p-3"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          
          <button
            onClick={() => navigateLightbox('next')}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white hover:text-gold transition-colors z-10 bg-black/50 rounded-full p-3"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <div className="max-w-5xl max-h-full flex flex-col items-center justify-center">
            <img
              src={currentLightboxImage.src}
              alt={currentLightboxImage.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-semibold mb-2">
                {currentLightboxImage.alt}
              </h3>
              <p className="text-white/60 text-sm">
                {filteredImages.findIndex(img => img.id === selectedImage) + 1} of {filteredImages.length}
              </p>
            </div>
      </div>
    </div>
      )}
    </section>
  );
}



const Index = () => {
  const navigate = useNavigate();
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [expandedRoomIndex, setExpandedRoomIndex] = useState<number | null>(null);

  const handleRoomClick = (roomTitle: string) => {
    // Navigate to rooms page and scroll to specific room
    navigate('/rooms');
    // Add a small delay to ensure the page loads before scrolling
    setTimeout(() => {
      const element = document.getElementById(roomTitle.replace(/\s+/g, '-').toLowerCase());
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const amenities = [
    { 
      icon: Waves, 
      title: 'Valley Edge Pool', 
      description: 'Stunning pool with breathtaking mountain views and luxury cabanas',
      color: 'from-blue-400 to-blue-600'
    },
    { 
      icon: Sparkles, 
      title: 'Luxury Spa (Coming Soon)', 
      description: 'Our world-class wellness center is coming soon!',
      color: 'from-purple-400 to-pink-600'
    },
    { 
      icon: Crown, 
      title: 'Premium Dining', 
      description: 'Gourmet cuisine crafted with local ingredients and international flair',
      color: 'from-orange-400 to-red-600'
    },
    {
      icon: Crown,
      title: 'Cafe Vintage Bite (Upcoming)',
      description: 'A cozy cafe experience is coming soon to Vintage Valley at Cafe Vintage Bite.',
      color: 'from-yellow-400 to-orange-400'
    },
    { 
      icon: Gamepad2, 
      title: 'Game Zone', 
      description: 'Comprehensive sports facilities including badminton, football, and indoor games for all ages',
      color: 'from-green-500 to-blue-600'
    },
    { 
      icon: TreePine, 
      title: 'Nature Trails', 
      description: 'Guided eco-walks through pristine landscapes and scenic viewpoints',
      color: 'from-green-400 to-emerald-600'
    },
  ];

  const testimonials = [
    {
      name: 'Mayur Desale',
      location: 'India',
      image: '/images/placeholder.svg',
      rating: 5,
      text: 'All over service is good . Atmosphere is awesome...The nature of here is just lovely ...fog adds the romance in it. I just love the destination, weather, service and the food . Food quality is superb . All the items was very best in taste .',
      date: 'May 2025'
    },
    {
      name: 'Sam Eer',
      location: 'India',
      image: '/images/placeholder.svg',
      rating: 5,
      text: 'Very good resort , especially front office staffs was very co operative than other near by resorts, We got room number 504’s view was awesome, Good food, Good B&F, Neat and clean Pool working hour 08 AM to 06 PM, If you plan to come The fog city Igatpuri please Book here, this is just my opinion ❤️',
      date: 'April 2025'
    },
    {
      name: 'Prakash V',
      location: 'India',
      image: '/images/placeholder.svg',
      rating: 5,
      text: 'Hi.. We had very good time during our IAF veterans get together. Good accommodation, room service and other facilities. Staff is also very cooperative. Champions trophy finals was screened on wide screen. Reception staff is cooperative in arranging conveyance while checking out.',
      date: 'March 2024'
    },
    {
      name: 'CA Vimal Solanki',
      location: 'India',
      image: '/images/placeholder.svg',
      rating: 5,
      text: 'It was a an excellent location for our Holi Celebration, perfect food , nice room size with partitions , ample space for cricket and other outside games just near swimming pool. Staff very cooperative. ',
      date: 'February 2025'
    }, {
      name: 'Prajakta Patil',
      location: 'India',
      image: '/images/placeholder.svg',
      rating: 5,
      text: 'Awesome food quality..Lovely stay location..Satisfying experience ..Must visit place',
      date: 'August 2025'
    }, {
      name: 'Nisarg Bhavsar',
      location: 'India',
      image: '/images/placeholder.svg',
      rating: 4,
      text: 'Fantastic experience overall! Great hospitality, clean amenities, and a perfect spot for a weekend getaway. Will definitely return.',
      date: 'December 2024'
    }
    
  ];



  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <Hero />

      {/* Enhanced Amenities Section */}
      <section className="section-padding bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-ivory/30 to-white"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 bg-gold/10 rounded-full mb-6">
              <span className="text-gold font-medium tracking-wide">WORLD-CLASS AMENITIES</span>
            </div>
            <h2 className="font-playfair text-5xl md:text-6xl font-bold text-charcoal mb-8">
              Luxury Redefined
            </h2>
            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
              Immerse yourself in exceptional facilities designed to elevate every moment of your stay
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {amenities.map((amenity, index) => {
              const isComingSoon =
                amenity.title.includes('(Coming Soon)') || amenity.title.includes('(Upcoming)');
              return (
                <div key={index} className="group cursor-pointer">
                  <div className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-ivory/50 ${isComingSoon ? 'opacity-60 grayscale' : ''}`}>
                    {isComingSoon && (
                      <div className="absolute top-4 right-4 bg-gold/90 text-charcoal px-4 py-2 rounded-full font-bold text-xs shadow-lg z-10">
                        Coming Soon
                      </div>
                    )}
                    <div className="flex justify-center mb-6">
                      <div className={`bg-gradient-to-r ${amenity.color} rounded-full w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <amenity.icon className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="font-playfair text-2xl font-semibold text-charcoal mb-4 text-center">
                      {amenity.title}
                    </h3>
                    <p className="text-charcoal/70 leading-relaxed text-center">
                      {amenity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Rooms Section */}
      <section className="section-padding bg-gradient-to-b from-ivory to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 bg-charcoal/10 rounded-full mb-6">
              <span className="text-charcoal font-medium tracking-wide">PREMIUM ACCOMMODATIONS</span>
            </div>
            <h2 className="font-playfair text-5xl md:text-6xl font-bold text-charcoal mb-8">
              Exquisite Suites
            </h2>
            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
              Choose from our thoughtfully designed accommodations, each offering unparalleled comfort and stunning views
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {(() => {
              // Get all rooms, including Lotus Family Suite
              const suiteRooms = rooms.filter(room => [
                'Deluxe Studio Suite',
                'Deluxe Edge View',
                'Lotus Family Suite',
                'Presidential Suite'
              ].includes(room.title));
              return suiteRooms.map((room, index) => {
                const isExpanded = expandedRoomIndex === index;
                const previewLength = 120;
                const shouldTruncate = room.description.length > previewLength;
                const displayDescription = isExpanded || !shouldTruncate
                  ? room.description
                  : room.description.slice(0, previewLength) + '...';
                return (
                  <div key={index} className="group cursor-pointer">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                      <div className="relative overflow-hidden">
                        <img
                          src={room.images[0]}
                          alt={room.title}
                          className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-gold text-charcoal px-3 py-1 rounded-full text-sm font-semibold">
                            {room.title === 'Deluxe Studio Suite' ? 'Popular' :
                             room.title === 'Lotus Family Suite' ? 'Family Choice' :
                             room.title === 'Presidential Suite' ? 'Luxury' :
                             room.title === 'Deluxe Edge View' ? 'Edge View' : ''}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 text-white">
                          <div className="text-2xl font-bold">From {room.pricing.weekday}</div>
                          <div className="text-sm opacity-90">per night</div>
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="font-playfair text-2xl font-bold text-charcoal mb-4">
                          {room.title}
                        </h3>
                        <p className="text-charcoal/70 mb-6 leading-relaxed">
                          {displayDescription}
                          {shouldTruncate && (
                            <button
                              className="ml-2 text-gold underline text-sm focus:outline-none"
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedRoomIndex(isExpanded ? null : index);
                              }}
                            >
                              {isExpanded ? 'Show Less' : 'Read More'}
                            </button>
                          )}
                        </p>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="flex items-center text-sm text-charcoal/70">
                            <div className="w-2 h-2 bg-gold rounded-full mr-2"></div>
                            {room.bedType}
                          </div>
                          <div className="flex items-center text-sm text-charcoal/70">
                            <div className="w-2 h-2 bg-gold rounded-full mr-2"></div>
                            {room.size}
                          </div>
                          {room.amenities.slice(0,2).map((amenity, idx) => (
                            <div key={idx} className="flex items-center text-sm text-charcoal/70">
                              <div className="w-2 h-2 bg-gold rounded-full mr-2"></div>
                              {amenity.name}
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => handleRoomClick(room.title)}
                          className="w-full bg-gradient-to-r from-gold to-bronze text-charcoal font-semibold py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                          View Details & Book
                        </button>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="section-padding bg-gradient-to-br from-white via-ivory/30 to-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-60 h-60 bg-charcoal/5 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2 bg-gold/10 rounded-full mb-6">
              <span className="text-gold font-medium tracking-wide">LIMITED TIME OFFERS</span>
            </div>
            <h2 className="font-playfair text-5xl md:text-6xl font-bold text-charcoal mb-8">
              Special Promotions
            </h2>
            <p className="text-xl text-charcoal/70 max-w-3xl mx-auto leading-relaxed">
              Exclusive deals for your perfect getaway at Vintage Valley
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Offer 1: Stay 3 Nights, Pay for 2 */}
            <div className="group cursor-pointer">
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gold/20">
                <div className="relative overflow-hidden">
                  <img
                    src="/images/offer.jpeg"
                    alt="Stay 3 Nights, Pay for 2"
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-gold text-charcoal px-4 py-2 rounded-full text-sm font-bold animate-bounce">
                      SAVE 33%
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-playfair text-2xl font-bold text-charcoal mb-4">
                    Stay 3 Nights, Pay for 2
                  </h3>
                  <p className="text-charcoal/70 mb-6 leading-relaxed">
                    Ideal for couples or families planning a short vacation. Enjoy an extra night on us!
                  </p>
                  <div className="mb-6 bg-ivory/50 p-4 rounded-xl">
                    <h4 className="font-semibold text-charcoal mb-2">Terms & Conditions:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gold rounded-full mt-2 mr-2"></div>
                        <span className="text-charcoal/70">Valid only on weekdays (Sunday to Thursday)</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gold rounded-full mt-2 mr-2"></div>
                        <span className="text-charcoal/70">Not applicable on weekends or public holidays</span>
                      </li>
                    </ul>
                  </div>
                  <a 
                    href="https://wa.me/919371179888?text=Hello,%20I'm%20interested%20in%20the%20'Stay%203%20Nights,%20Pay%20for%202'%20special%20offer.%20Please%20provide%20more%20details."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <button 
                      className="w-full bg-gradient-to-r from-gold to-bronze text-charcoal font-semibold py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Book This Offer
                    </button>
                  </a>
                </div>
              </div>
            </div>

            {/* Offer 2: Extra 10% off for group bookings */}
            <div className="group cursor-pointer">
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gold/20">
                <div className="relative overflow-hidden">
                  <img
                    src="/images/offer1.jpeg"
                    alt="Group Booking Discount"
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-gold text-charcoal px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                      SAVE 10%
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-playfair text-2xl font-bold text-charcoal mb-4">
                    Extra 10% Off for Group Bookings
                  </h3>
                  <p className="text-charcoal/70 mb-6 leading-relaxed">
                    Ideal for families, friends, or small office teams. Book 6+ guests and enjoy special group rates!
                  </p>
                  <div className="mb-6 bg-ivory/50 p-4 rounded-xl">
                    <h4 className="font-semibold text-charcoal mb-2">Terms & Conditions:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gold rounded-full mt-2 mr-2"></div>
                        <span className="text-charcoal/70">Subject to room availability</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-gold rounded-full mt-2 mr-2"></div>
                        <span className="text-charcoal/70">Advance booking required</span>
                      </li>
                    </ul>
                  </div>
                  <a 
                    href="https://wa.me/919371179888?text=Hello,%20I'm%20interested%20in%20the%20'Extra%2010%%20Off%20for%20Group%20Bookings'%20special%20offer.%20Please%20provide%20more%20details."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <button 
                      className="w-full bg-gradient-to-r from-gold to-bronze text-charcoal font-semibold py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Book This Offer
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Gallery Section */}
      <EnhancedGallery />

      {/* Enhanced Testimonials Section */}
      <section className="section-padding bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-40 h-40 bg-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-16 w-60 h-60 bg-ivory/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-2 bg-gold/20 rounded-full mb-6">
              <span className="text-gold font-medium tracking-wide">GUEST EXPERIENCES</span>
            </div>
            <h2 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-8">
              Stories of Bliss
            </h2>
            <p className="text-xl text-ivory/70 max-w-3xl mx-auto leading-relaxed">
              Discover why guests choose Vintage Valley as their sanctuary of luxury and tranquility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group">
                <div className="bg-ivory/5 backdrop-blur-xl rounded-3xl p-8 border border-ivory/10 hover:bg-ivory/10 transition-all duration-500 transform hover:-translate-y-2">
                  <div className="flex items-center mb-6">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover mr-4 ring-2 ring-gold/50"
                    />
                    <div>
                      <h4 className="font-semibold text-ivory text-lg">{testimonial.name}</h4>
                      <p className="text-ivory/60 text-sm flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {testimonial.location}
                      </p>
                      <div className="flex space-x-1 mt-2">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-gold fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-ivory/80 leading-relaxed italic mb-4 text-lg">
                    "{testimonial.text}"
                  </p>
                  <div className="text-ivory/50 text-sm">
                    {testimonial.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     
      <Footer />
    </div>
  );
};

export default Index;
