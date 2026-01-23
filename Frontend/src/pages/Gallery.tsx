import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Heart, Download, Share2 } from 'lucide-react';

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const categories = [
    { id: 'all', name: 'All Photos', count: 120 },
    { id: 'rooms', name: 'Rooms & Suites', count: 30 },
    { id: 'facilities', name: 'Facilities', count: 25 },
    { id: 'dining', name: 'Dining', count: 20 },
    { id: 'nature', name: 'Nature & Views', count: 35 },
    { id: 'events', name: 'Events', count: 12 }
  ];

  const galleryImages = [
      // Room Images
  { id: 1, category: 'rooms', src: '/images/deluxe-studio-suite-1.jpg', alt: '', type: 'image' },
  { id: 2, category: 'rooms', src: '/images/deluxe-studio-suite-2.jpg', alt: '', type: 'image' },
  { id: 3, category: 'rooms', src: '/images/deluxe-studio-suite-3.jpg', alt: '', type: 'image' },
  { id: 4, category: 'rooms', src: '/images/skyline-deluxe-1.jpg', alt: '', type: 'image' },
  { id: 5, category: 'rooms', src: '/images/skyline-deluxe-2.jpg', alt: '', type: 'image' },
  { id: 6, category: 'rooms', src: '/images/skyline-deluxe-3.jpg', alt: '', type: 'image' },
  { id: 7, category: 'rooms', src: '/images/deluxe-edge-view-1.jpg', alt: '', type: 'image' },
  { id: 8, category: 'rooms', src: '/images/deluxe-edge-view-2.jpg', alt: '', type: 'image' },
  { id: 9, category: 'rooms', src: '/images/deluxe-edge-view-3.jpg', alt: '', type: 'image' },
  { id: 10, category: 'rooms', src: '/images/1.jpeg', alt: '', type: 'image' },
  { id: 11, category: 'rooms', src: '/images/2.jpeg', alt: '', type: 'image' },
  { id: 12, category: 'rooms', src: '/images/3.jpeg', alt: '', type: 'image' },
  { id: 13, category: 'rooms', src: '/images/presidential-sky-villa-1.jpg', alt: '', type: 'image' },
  { id: 14, category: 'rooms', src: '/images/presidential-sky-villa-2.jpg', alt: '', type: 'image' },
  { id: 15, category: 'rooms', src: '/images/presidential-sky-villa-3.jpg', alt: '', type: 'image' },
  { id: 16, category: 'rooms', src: '/images/lotus-family-suite-1.jpg', alt: '', type: 'image' },
  { id: 17, category: 'rooms', src: '/images/lotus-family-suite-2.jpg', alt: '', type: 'image' },
  { id: 18, category: 'rooms', src: '/images/lotus-family-suite-3.jpg', alt: '', type: 'image' },
  { id: 19, category: 'rooms', src: '/images/room/AB004964.JPG', alt: '', type: 'image' },
  { id: 20, category: 'rooms', src: '/images/room/AB004978.JPG', alt: '', type: 'image' },
  { id: 21, category: 'rooms', src: '/images/room/AB005018.JPG', alt: '', type: 'image' },
  { id: 22, category: 'rooms', src: '/images/room/AB005030.JPG', alt: '', type: 'image' },
  { id: 23, category: 'rooms', src: '/images/room/AB005053.JPG', alt: '', type: 'image' },
  { id: 24, category: 'rooms', src: '/images/room/AB005063.JPG', alt: '', type: 'image' },
  { id: 25, category: 'rooms', src: '/images/room/AB004906.JPG', alt: '', type: 'image' },
  { id: 26, category: 'rooms', src: '/images/room/AB004915.JPG', alt: '', type: 'image' },
  { id: 27, category: 'rooms', src: '/images/room/AB004929.JPG', alt: '', type: 'image' },
  { id: 28, category: 'rooms', src: '/images/room/AB005122.JPG', alt: '', type: 'image' },
  { id: 29, category: 'rooms', src: '/images/room/AB005123.JPG', alt: '', type: 'image' },
  { id: 30, category: 'rooms', src: '/images/room/AB005124.JPG', alt: '', type: 'image' },

      // Facility Images
  { id: 31, category: 'facilities', src: '/images/infinity-pool-1.jpg', alt: '', type: 'image' },
  { id: 32, category: 'facilities', src: '/images/infinity-pool-2.jpg', alt: '', type: 'image' },
  { id: 33, category: 'facilities', src: '/images/infinity-pool-3.jpg', alt: '', type: 'image' },
  { id: 34, category: 'facilities', src: '/images/nature-trails-1.jpg', alt: '', type: 'image' },
  { id: 35, category: 'facilities', src: '/images/conference-hall-1.jpg', alt: '', type: 'image' },
  { id: 36, category: 'facilities', src: '/images/banquet-lawn-1.jpg', alt: '', type: 'image' },
  { id: 37, category: 'facilities', src: '/images/banquet-lawn-2.jpg', alt: '', type: 'image' },
  { id: 38, category: 'facilities', src: '/images/cafe-lounge-1.jpg', alt: '', type: 'image' },
  { id: 39, category: 'facilities', src: '/images/cafe-lounge-2.jpg', alt: '', type: 'image' },
  { id: 40, category: 'facilities', src: '/images/cafe-lounge-3.jpg', alt: '', type: 'image' },
  { id: 41, category: 'facilities', src: '/images/pool/AB004771.JPG', alt: '', type: 'image' },
  { id: 42, category: 'facilities', src: '/images/pool/AB004776.JPG', alt: '', type: 'image' },
  { id: 43, category: 'facilities', src: '/images/pool/AB004802.JPG', alt: '', type: 'image' },
  { id: 44, category: 'facilities', src: '/images/pool/AB004825.JPG', alt: '', type: 'image' },
  { id: 45, category: 'facilities', src: '/images/pool/AB004827.JPG', alt: '', type: 'image' }, 
  { id: 46, category: 'facilities', src: '/images/pool/AB004834.JPG', alt: '', type: 'image' },
  { id: 47, category: 'facilities', src: '/images/pool/AB005094.JPG', alt: '', type: 'image' },
  { id: 48, category: 'facilities', src: '/images/pool/AB005097.JPG', alt: '', type: 'image' },
  { id: 49, category: 'facilities', src: '/images/pool/AB005100.JPG', alt: '', type: 'image' },
  { id: 50, category: 'facilities', src: '/images/room/1000020999.png', alt: '', type: 'image' },
  { id: 51, category: 'facilities', src: '/images/room/1000021000.png', alt: '', type: 'image' },
  { id: 52, category: 'facilities', src: '/images/room/1000021001.jpg', alt: '', type: 'image' },
  { id: 53, category: 'facilities', src: '/images/room/1000021003.jpg', alt: '', type: 'image' },
  { id: 54, category: 'facilities', src: '/images/room/1000021004.jpg', alt: '', type: 'image' },
  { id: 55, category: 'facilities', src: '/images/room/1000021006.jpg', alt: '', type: 'image' },

      // Dining Images
  { id: 56, category: 'dining', src: '/images/room/AB004776.JPG', alt: '', type: 'image' },
  { id: 57, category: 'dining', src: '/images/room/AB004771.JPG', alt: '', type: 'image' },
  { id: 58, category: 'dining', src: '/images/room/AB004778.JPG', alt: '', type: 'image' },
  { id: 59, category: 'dining', src: '/images/room/AB004798.JPG', alt: '', type: 'image' },
  { id: 60, category: 'dining', src: '/images/room/AB004804.JPG', alt: '', type: 'image' },
  { id: 61, category: 'dining', src: '/images/room/AB004812.JPG', alt: '', type: 'image' },
  { id: 62, category: 'dining', src: '/images/room/AB004854.JPG', alt: '', type: 'image' },
  { id: 63, category: 'dining', src: '/images/room/AB004857.JPG', alt: '', type: 'image' },
  { id: 64, category: 'dining', src: '/images/room/AB004859.JPG', alt: '', type: 'image' },
  { id: 65, category: 'dining', src: '/images/room/AB004874.JPG', alt: '', type: 'image' },
  { id: 66, category: 'dining', src: '/images/room/AB004886 (1).JPG', alt: '', type: 'image' },
  { id: 67, category: 'dining', src: '/images/room/AB004887.JPG', alt: '', type: 'image' },
  { id: 68, category: 'dining', src: '/images/room/AB004858.JPG', alt: '', type: 'image' },
  { id: 69, category: 'dining', src: '/images/room/AB004889.JPG', alt: '', type: 'image' },
  { id: 70, category: 'dining', src: '/images/room/AB004875.JPG', alt: '', type: 'image' },
  { id: 71, category: 'dining', src: '/images/room/AB004862.JPG', alt: '', type: 'image' },
  { id: 72, category: 'dining', src: '/images/room/AB004888.JPG', alt: '', type: 'image' },
  { id: 73, category: 'dining', src: '/images/room/AB004882.JPG', alt: '', type: 'image' },
  { id: 74, category: 'dining', src: '/images/room/AB004878.JPG', alt: '', type: 'image' },
  { id: 75, category: 'dining', src: '/images/room/AB004886 (1).JPG', alt: '', type: 'image' },

    // Nature Images
    { id: 76, category: 'nature', src: '/images/at/1.jpg', alt: '', type: 'image' },
    { id: 77, category: 'nature', src: '/images/at/2.jpg', alt: '', type: 'image' },
    { id: 78, category: 'nature', src: '/images/at/3.jpg', alt: '', type: 'image' },
    { id: 79, category: 'nature', src: '/images/at/4.jpg', alt: '', type: 'image' },
    { id: 80, category: 'nature', src: '/images/at/5.jpg', alt: '', type: 'image' },
    { id: 81, category: 'nature', src: '/images/at/6.jpg', alt: '', type: 'image' },
    { id: 82, category: 'nature', src: '/images/at/7.jpg', alt: '', type: 'image' },
    { id: 83, category: 'nature', src: '/images/at/8.jpeg', alt: '', type: 'image' },
    { id: 84, category: 'nature', src: '/images/at/9.jpg', alt: '', type: 'image' },
    { id: 85, category: 'nature', src: '/images/at/10.jpg', alt: '', type: 'image' },
    { id: 86, category: 'nature', src: '/images/at/11.jpg', alt: '', type: 'image' },
    { id: 87, category: 'nature', src: '/images/at/12.jpg', alt: '', type: 'image' },
    { id: 88, category: 'nature', src: '/images/at/13.jpg', alt: '', type: 'image' },
    { id: 89, category: 'nature', src: '/images/at/14.jpeg', alt: '', type: 'image' },
    { id: 90, category: 'nature', src: '/images/at/15.jpg', alt: '', type: 'image' },
    { id: 91, category: 'nature', src: '/images/at/16.jpeg', alt: '', type: 'image' },
    { id: 92, category: 'nature', src: '/images/at/17.jpg', alt: '', type: 'image' },
    { id: 93, category: 'nature', src: '/images/at/18.png', alt: '', type: 'image' },
    { id: 94, category: 'nature', src: '/images/at/19.jpg', alt: '', type: 'image' },
    { id: 95, category: 'nature', src: '/images/at/20.jpeg', alt: '', type: 'image' },  
    { id: 96, category: 'nature', src: '/images/at/21.jpg', alt: '', type: 'image' },
    { id: 97, category: 'nature', src: '/images/at/30.jpg', alt: '', type: 'image' },
    { id: 98, category: 'nature', src: '/images/at/31.jpeg', alt: '', type: 'image' },
    { id: 99, category: 'nature', src: '/images/at/32.jpeg', alt: '', type: 'image' },
    { id: 100, category: 'nature', src: '/images/at/33.jpeg', alt: '', type: 'image' },
    { id: 101, category: 'nature', src: '/images/at/34.jpg', alt: '', type: 'image' },
    { id: 102, category: 'nature', src: '/images/at/35.jpg', alt: '', type: 'image' },
    { id: 103, category: 'nature', src: '/images/at/kasara.jpeg', alt: '', type: 'image' },
    { id: 104, category: 'nature', src: '/images/at/151.jpeg', alt: '', type: 'image' },
    { id: 105, category: 'nature', src: '/images/at/152.jpeg', alt: '', type: 'image' },
    { id: 106, category: 'nature', src: '/images/at/153.jpeg', alt: '', type: 'image' },

      // Event Images (using some facility images as events)
  { id: 107, category: 'events', src: '/images/banquet-lawn-1.jpg', alt: '', type: 'image' },
  { id: 108, category: 'events', src: '/images/banquet-lawn-2.jpg', alt: '', type: 'image' },
  { id: 109, category: 'events', src: '/images/conference-hall-1.jpg', alt: '', type: 'image' },
  { id: 110, category: 'events', src: '/images/room/AB005122.JPG', alt: '', type: 'image' },
  { id: 111, category: 'events', src: '/images/room/AB005123.JPG', alt: '', type: 'image' },
  { id: 112, category: 'events', src: '/images/room/AB005124.JPG', alt: '', type: 'image' },
  { id: 113, category: 'events', src: '/images/room/AB005125 (1).JPG', alt: '', type: 'image' },
  { id: 114, category: 'events', src: '/images/room/AB005126.JPG', alt: '', type: 'image' },
  { id: 115, category: 'events', src: '/images/room/AB005127.JPG', alt: '', type: 'image' },
  { id: 116, category: 'events', src: '/images/room/AB005128.JPG', alt: '', type: 'image' },
  // New Event Images
  { id: 117, category: 'events', src: '/images/video/event1.jpeg', alt: '', type: 'image' },
  { id: 118, category: 'events', src: '/images/video/event2.jpeg', alt: '', type: 'image' },
  ];

  const filteredImages = selectedCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  const openLightbox = (imageId: number) => {
    setLightboxImage(imageId);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxImage === null) return;
    
    const currentIndex = filteredImages.findIndex(img => img.id === lightboxImage);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    } else {
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setLightboxImage(filteredImages[newIndex].id);
  };

  const toggleFavorite = (imageId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(imageId)) {
      newFavorites.delete(imageId);
    } else {
      newFavorites.add(imageId);
    }
    setFavorites(newFavorites);
  };

  const currentLightboxImage = filteredImages.find(img => img.id === lightboxImage);

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      {/* Enhanced Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-charcoal via-charcoal/95 to-charcoal/90 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-16 w-60 h-60 bg-ivory/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-6 py-2 bg-gold/20 rounded-full mb-6">
            <span className="text-gold font-medium tracking-wide">VISUAL STORY</span>
          </div>
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-ivory mb-8">
            Gallery
          </h1>
          <p className="text-xl md:text-2xl text-ivory/80 max-w-3xl mx-auto leading-relaxed">
            Immerse yourself in the visual story of Vintage Valley Resort through our curated collection of moments
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-ivory/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold rounded-full"></span>
              <span>{galleryImages.length} Photos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold rounded-full"></span>
              <span>{categories.length} Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold rounded-full"></span>
              <span>High Resolution</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Category Filter */}
      <section className="py-8 bg-white border-b border-gold/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gold text-charcoal shadow-lg'
                    : 'bg-ivory text-charcoal hover:bg-gold/20 hover:text-charcoal border border-charcoal/10'
                }`}
              >
                <span className="flex items-center gap-2">
                {category.name}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedCategory === category.id 
                      ? 'bg-charcoal/20 text-charcoal' 
                      : 'bg-charcoal/10 text-charcoal/60'
                  }`}>
                    {category.count}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Gallery Grid */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Horizontal Scroll Gallery */}
          <div className="md:hidden flex overflow-x-auto space-x-4 pb-2">
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                className="flex-shrink-0 w-64 cursor-pointer rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group"
                onClick={() => openLightbox(image.id)}
              >
                <div className="relative overflow-hidden">
                  {image.type === 'video' ? (
                    <video
                      src={image.src}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                      muted
                      loop
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(image.id);
                      }}
                      className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                    >
                      <Heart className={`h-5 w-5 ${favorites.has(image.id) ? 'text-red-500 fill-current' : 'text-white'}`} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
                      {image.alt}
                    </p>
                    {image.type === 'video' && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          <path d="M8 11l3-3 3 3-3 3-3-3z" />
                        </svg>
                        <span className="text-xs opacity-90">Video</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Grid Gallery */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                className={`group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  index % 8 === 0 || index % 8 === 3 ? 'sm:col-span-2 sm:row-span-2' : ''
                }`}
                onClick={() => openLightbox(image.id)}
              >
                <div className="relative overflow-hidden">
                  {image.type === 'video' ? (
                    <video
                      src={image.src}
                      className={`w-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                        index % 8 === 0 || index % 8 === 3 ? 'h-96' : 'h-48'
                      }`}
                      muted
                      loop
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <img
                      src={image.src}
                      alt={image.alt}
                      className={`w-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                        index % 8 === 0 || index % 8 === 3 ? 'h-96' : 'h-48'
                      }`}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(image.id);
                      }}
                      className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                    >
                      <Heart className={`h-5 w-5 ${favorites.has(image.id) ? 'text-red-500 fill-current' : 'text-white'}`} />
                    </button>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
                      {image.alt}
                    </p>
                    {image.type === 'video' && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          <path d="M8 11l3-3 3 3-3 3-3-3z" />
                        </svg>
                        <span className="text-xs opacity-90">Video</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Lightbox */}
      {lightboxImage && currentLightboxImage && (
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

          <div className="max-w-6xl max-h-full flex flex-col items-center justify-center">
            {currentLightboxImage.type === 'video' ? (
              <video
                src={currentLightboxImage.src}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                controls
                autoPlay
                muted
              />
            ) : (
              <img
                src={currentLightboxImage.src}
                alt={currentLightboxImage.alt}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            <div className="mt-6 text-center">
              <h3 className="text-white text-2xl font-semibold mb-2">
                {currentLightboxImage.alt}
              </h3>
              <p className="text-white/60 text-lg mb-4">
              {filteredImages.findIndex(img => img.id === lightboxImage) + 1} of {filteredImages.length}
            </p>
              <div className="flex justify-center gap-4">
                <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white hover:bg-white/30 transition-colors">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white hover:bg-white/30 transition-colors">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={() => toggleFavorite(currentLightboxImage.id)}
                  className={`flex items-center gap-2 backdrop-blur-sm rounded-full px-4 py-2 transition-colors ${
                    favorites.has(currentLightboxImage.id) 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${favorites.has(currentLightboxImage.id) ? 'fill-current' : ''}`} />
                  {favorites.has(currentLightboxImage.id) ? 'Favorited' : 'Favorite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced CTA Section */}
      <section className="section-padding bg-gradient-to-r from-charcoal to-charcoal/90">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ivory mb-6">
            Create Your Own Memories
          </h2>
          <p className="text-xl text-ivory/80 mb-8 max-w-2xl mx-auto">
            Book your stay and become part of the Vintage Valley Resort story. Experience the luxury and beauty captured in our gallery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gold text-charcoal px-8 py-4 rounded-full font-semibold text-lg hover:bg-bronze transition-all duration-300 transform hover:scale-105">
              Book Your Stay
            </button>
            <button className="border-2 border-ivory text-ivory px-8 py-4 rounded-full font-semibold text-lg hover:bg-ivory hover:text-charcoal transition-all duration-300">
              Virtual Tour
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;
