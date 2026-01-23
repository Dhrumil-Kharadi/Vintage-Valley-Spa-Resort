import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { MapPin, Clock, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';



const Attractions = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxImgs, setLightboxImgs] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [expanded, setExpanded] = useState<{[key: string]: boolean}>({});

  const igatpuriPlaces = [
    {
      name: 'Kalsubai Peak',
      distance: '40 km',
      time: '1 hour',
      description: 'The highest peak in Maharashtra, popular for trekking and breathtaking panoramic views.',
      image: '/images/222.jpeg',
      highlights: ['Highest peak', 'Trekking', 'Panoramic views', 'Adventure']
    },
    {
      name: 'Dhamma Giri / Vipassana Meditation Center',
      distance: '10 km',
      time: '18 mins',
      description: 'World\'s largest Vipassana meditation center offering 10-day silent meditation courses in serene natural surroundings.',
      image: '/images/at/36.jpg',
      highlights: ['Silent meditation', 'Spiritual healing', '10-day courses', 'Peaceful environment']
    },
    {
      name: 'Bhavali Dam',
      distance: '8 km',
      time: '15 mins',
      description: 'Picturesque dam surrounded by lush greenery, perfect for picnics and enjoying nature\'s tranquility.',
      image: '/images/111.jpg',
      highlights: ['Scenic beauty', 'Picnic spots', 'Photography', 'Nature walks']
    },
    {
      name: 'Bhandardara dam',
      distance: '45 km',
      time: '1 hour',
      description: 'Hill station known for its pristine lake, waterfalls, and the famous Arthur Lake with camping opportunities.',
      image: '/images/at/2.jpg',
      highlights: ['Arthur Lake', 'Camping', 'Waterfalls', 'Hill station']
    },
    {
      name: 'Tringalwadi Fort & Cave',
      distance: '20 km',
      time: '30 mins',
      description: 'Historic fort with ancient caves offering panoramic views and a glimpse into Maharashtra\'s rich heritage.',
      image: '/images/at/3.jpg',
      highlights: ['Historical fort', 'Ancient caves', 'Trekking', 'Heritage site']
    },
    {
      name: 'Ashoka Waterfall',
      distance: '12 km',
      time: '20 mins',
      description: 'Spectacular waterfall cascading from great heights, perfect for nature photography and monsoon visits.',
      image: '/images/at/4.jpg',
      highlights: ['Waterfall', 'Photography', 'Monsoon beauty', 'Natural pools']
    },
    {
      name: 'Railway Waterfall',
      distance: '15 km',
      time: '25 mins',
      description: 'Unique waterfall visible from railway tracks, offering a spectacular view during monsoon season.',
      image: '/images/room/Igatpuri waterfall 2.jpg',
      highlights: ['Railway view', 'Monsoon special', 'Unique location', 'Train spotting']
    },
    {
      name: 'Karoli Ghat Top',
      distance: '18 km',
      time: '30 mins',
      description: 'Scenic viewpoint offering breathtaking views of the Western Ghats and surrounding valleys.',
      image: '/images/at/5.jpg',
      highlights: ['Scenic viewpoint', 'Western Ghats', 'Valley views', 'Sunset point']
    },
    {
      name: 'Vallonne Vineyard',
      distance: '22 km',
      time: '35 mins',
      description: 'Boutique vineyard offering wine tasting experiences and tours amidst beautiful grape plantations.',
      image: '/images/at/6.jpg',
      highlights: ['Wine tasting', 'Vineyard tours', 'Boutique wines', 'Grape plantations']
    },
    {
      name: 'Camel Valley Point',
      distance: '16 km',
      time: '28 mins',
      description: 'Scenic valley point with unique rock formations resembling camels, popular for photography and nature walks.',
      image: '/images/room/camelvalley.jpg',
      highlights: ['Rock formations', 'Photography', 'Nature walks', 'Unique landscape']
    },
    {
      name: 'Vaitarna Dam',
      distance: '15 km',
      time: '25 mins',
      description: 'Large dam with beautiful surroundings, offering boating facilities and scenic sunset views.',
      image: '/images/at/7.jpg',
      highlights: ['Boating', 'Sunset views', 'Large reservoir', 'Water activities']
    },
    {
      name: 'Kasara Ghat',
      distance: '25 km',
      time: '40 mins',
      description: 'Mountain pass with stunning ghat views, popular for its scenic railway route and natural beauty.',
      image: '/images/room/kasara.jpeg',
      highlights: ['Mountain pass', 'Railway route', 'Ghat views', 'Natural beauty']
    },
    {
      name: 'Jatayu Mandir',
      distance: '12 km',
      time: '20 mins',
      description: 'Temple dedicated to Jatayu from the Ramayana, offering spiritual ambiance and scenic views.',
      image: '/images/at/152.jpeg',
      highlights: ['Jatayu temple', 'Spiritual site', 'Scenic views', 'Ramayana connection']
    }
  ];

  // Remove igatpuriImages array and its usage for the listed places
  // Only use the local image path for each listed attraction
  const igatpuriPlacesWithImages = igatpuriPlaces.map((place) => ({
    ...place,
    images: [place.image],
  }));

  const nashikImages = [
    'https://s7ap1.scene7.com/is/image/incredibleindia/pandavleni-caves-nashik-maharashtra-3-attr-hero?qlt=82&ts=1726669905429',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQURifk4M9KcBDh6hrjHeYGWSzTimYXt9Hm006L5ofatFhwxLnvvug1kIehEJho8OpeTY&usqp=CAU',
    'https://upload.wikimedia.org/wikipedia/commons/1/12/Trimbakeshwar_Temple-Nashik-Maharashtra-1.jpg',
    'https://www.trawell.in/admin/images/upload/131652759Nashik_Ram_Kund_Main.jpg',
    'https://static2.tripoto.com/media/filter/tst/img/269307/TripDocument/1535626254_38412026_10211522756335247_6376961557548498944_o.jpg',
    'https://www.mistay.in/travel-blog/content/images/2022/12/sula6.jpg',
    'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0c/89/c0/d5/full-view-of-the-temple.jpg?w=1200&h=-1&s=1',
    'https://s7ap1.scene7.com/is/image/incredibleindia/1-panchvati-nashik-maharashtra-attr-hero?qlt=82&ts=1726669901222',
    'https://www.connectingtraveller.com/images/localtip/1635238546images%20(48).jpeg',
    'https://s7ap1.scene7.com/is/image/incredibleindia/1-mangi-tungi-hills-nashik-maharashtra-attr-nearby?qlt=82&ts=1726675287757',
    'https://res.cloudinary.com/kmadmin/image/upload/v1723636434/kiomoi/Brahmagiri_Hill_3581.jpg',
    'https://images.news18.com/ibnlive/uploads/2022/09/untitled-design-2022-09-26t230858.841.jpg',
    'https://storage.googleapis.com/goa-app-12a91.appspot.com/2024-08-01T17%3A02%3A15.090ZDugarwadi-Waterfalls3.webp?GoogleAccessId=firebase-adminsdk-zeqcj%40goa-app-12a91.iam.gserviceaccount.com&Expires=16447017600&Signature=brGFdl4p4T6WWMXSBn7iFKzGn1pMYNE%2FTeHywIzQHC%2BgxQ0FoqNt1DG8nfNg2JuXHA3exoRssFxJ2Sntdpteh2hVJRyUN9yHKMn4DC7bI%2FQuKcQ5DMizZJO%2FKVCPxXBOtY4%2F5%2FiwJRNYBS19xJ70OteBDblCm8MLBP9PFIN5eZDBHvjS%2B3OMoJWbF%2B%2Fq4wWCN%2FwVOI6yRkQcZ6u1S1JOmg91b94gV9CX1txZjholswY188rXZf7vK3w%2FHSgA9N%2FrVHYSU9t1aAV7phNAldEndYB57i7YiVKeV%2BESXlXhSFPtRRJ0ff9gq27RBWtF%2F94QMs54zMRs8oFj6LMtXQRFcw%3D%3D',
    'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/13/d3/9f/b1/someshwar-falls.jpg?w=1200&h=-1&s=1',
    'https://s7ap1.scene7.com/is/image/incredibleindia/gangapur-dam-nashik-maharashtra-1-attr-hero?qlt=82&ts=1726669944174',
    'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/07/98/58/03/muktidham-temple.jpg?w=1200&h=1200&s=1',
  ];

  const nashikPlaces = [
    {
      name: 'Pandav Leni',
      distance: '45 km',
      time: '1 hour',
      description: 'Ancient Buddhist caves dating back to 1st century BC, showcasing remarkable rock-cut architecture.',
      images: ['/images/at/8.jpeg'],
      highlights: ['Buddhist caves', 'Ancient architecture', 'Historical site', 'Rock-cut caves']
    },
    {
      name: 'Trimbakeshwar Jyotirling Mandir',
      distance: '35 km',
      time: '50 mins',
      description: 'One of the 12 Jyotirlingas of Lord Shiva, ancient temple with significant religious importance.',
      images: ['/images/at/10.jpg'],
      highlights: ['Jyotirling', 'Ancient temple', 'Religious pilgrimage', 'Shiva temple']
    },
    {
      name: 'Harihar Fort',
      distance: '60 km',
      time: '1.5 hours',
      description: 'Triangular fort famous for its steep rock-cut steps and panoramic views from the summit.',
      images: ['/images/at/11.jpg'],
      highlights: ['Triangular fort', 'Rock-cut steps', 'Adventure trekking', 'Panoramic views']
    },
    {
      name: 'Sula Vineyards',
      distance: '55 km',
      time: '1.3 hours',
      description: 'India\'s leading winery offering premium wine tasting experiences and vineyard tours.',
      images: ['/images/at/12.jpg'],
      highlights: ['Premium wines', 'Wine tasting', 'Vineyard tours', 'Fine dining']
    },
    {
      name: 'Sundar Narayan Mandir',
      distance: '47 km',
      time: '1 hour',
      description: 'Beautiful temple dedicated to Lord Vishnu, known for its architectural beauty and peaceful atmosphere.',
      images: ['/images/at/31.jpeg'],
      highlights: ['Vishnu temple', 'Beautiful architecture', 'Peaceful atmosphere', 'Religious site']
    },
    {
      name: 'Panchvati',
      distance: '50 km',
      time: '1.2 hours',
      description: 'Panchvati is a sacred area in Nashik, deeply associated with the Ramayana. It includes Sita Gufa (the cave where Sita stayed during exile), Ram Kund (a holy tank where Lord Rama is believed to have bathed), and other important sites. Sita Gufa is a small cave revered for its spiritual significance, while Ram Kund is a major pilgrimage spot for ritual baths and religious ceremonies.',
      images: ['/images/at/14.jpeg', '/images/at/32.jpeg', '/images/at/9.jpeg'],
      highlights: ['Ramayana site', 'Sita Gufa', 'Ram Kund', 'Sacred place', 'Historical significance', 'Religious importance']
    },
    {
      name: 'Anjaneri',
      distance: '58 km',
      time: '1.4 hours',
      description: 'Birthplace of Lord Hanuman, offering trekking opportunities and religious significance.',
      images: ['/images/at/16.jpeg'],
      highlights: ['Hanuman birthplace', 'Trekking', 'Religious site', 'Mountain views']
    },
    {
      name: 'Bramhagiri',
      distance: '40 km',
      time: '55 mins',
      description: 'Source of river Godavari, sacred hill with temples and natural beauty.',
      image: '/images/at/17.jpg',
      highlights: ['Godavari source', 'Sacred hill', 'Temples', 'Natural beauty']
    },
    {
      name: 'Swami Narayan Temple',
      distance: '49 km',
      time: '1.1 hours',
      description: 'Beautiful modern temple with intricate carvings and peaceful spiritual atmosphere.',
      image: '/images/at/18.png',
      highlights: ['Modern temple', 'Intricate carvings', 'Spiritual atmosphere', 'Beautiful architecture']
    },
    {
      name: 'Durgawadi Waterfall',
      distance: '42 km',
      time: '1 hour',
      description: 'Scenic waterfall surrounded by dense forest, perfect for nature lovers and photography.',
      image: '/images/at/19.jpg',
      highlights: ['Scenic waterfall', 'Dense forest', 'Nature photography', 'Trekking']
    },
    {
      name: 'Someshwar Temple',
      distance: '46 km',
      time: '1 hour',
      description: 'Ancient Shiva temple with beautiful architecture located on the banks of Godavari river.',
      image: '/images/at/20.jpeg',
      highlights: ['Ancient Shiva temple', 'Godavari banks', 'Beautiful architecture', 'Religious site']
    },
    {
      name: 'Gangapur Dam',
      distance: '65 km',
      time: '1.5 hours',
      description: 'Large reservoir with beautiful surroundings, popular for picnics and water sports.',
      image: '/images/at/21.jpg',
      highlights: ['Large reservoir', 'Water sports', 'Picnic spot', 'Scenic surroundings']
    },
    {
      name: 'Muktidham Mandir',
      distance: '51 km',
      time: '1.2 hours',
      description: 'White marble temple complex with replicas of all major pilgrimage sites of India.',
      image: '/images/at/30.jpg',
      highlights: ['Marble temple', 'Pilgrimage replicas', 'Beautiful complex', 'Religious significance']
    },
    {
      name: 'Saptashrungi Devi Temple',
      distance: '70 km',
      time: '2 hours',
      description: 'A revered Hindu temple dedicated to Goddess Saptashrungi, located on a hilltop and known for its scenic views and spiritual significance.',
      images: ['\\images\\at\\333.jpeg'],
      highlights: ['Hindu temple', 'Hilltop views', 'Spiritual significance', 'Scenic location']
    }
  ];

  // Remove nashikImages array and its usage for the listed places
  // Only use the local image path for each listed attraction
  const nashikPlacesWithImages = nashikPlaces.map((place) => ({
    ...place,
    images: place.images ? place.images : (place.image ? [place.image] : []),
  }));

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      {/* Hero Section */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(30, 30, 30, 0.7), rgba(30, 30, 30, 0.5)), url('https://images.unsplash.com/photo-1464822759844-d150ad6d1c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Removed: Explore Around Igatpuri, Discover..., All distances... */}
        </div>
      </section>

      {/* Igatpuri Places Section */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl font-bold text-gray-800 mb-4">
              Tourist Places [Igatpuri]
            </h2>
            <p className="text-xl text-gray-800/80">Discover nearby attractions around Igatpuri</p>
          </div>

          <Carousel className="w-full">
            <CarouselContent>
              {igatpuriPlacesWithImages.map((place, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="bg-white rounded-3xl overflow-hidden luxury-shadow hover:shadow-2xl transition-all duration-500 group h-full">
                    <div className="relative overflow-hidden">
                      {Array.isArray(place.images) && place.images.length > 0 ? (
                        <Carousel className="w-full">
                          <CarouselContent>
                            {place.images.map((img, imgIdx) => (
                              <CarouselItem key={imgIdx}>
                                <img
                                  src={img}
                                  alt={place.name + ' image ' + (imgIdx + 1)}
                                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                                  onClick={() => {
                                    setLightboxImgs(place.images);
                                    setLightboxIndex(imgIdx);
                                    setLightboxImg(img);
                                    setLightboxOpen(true);
                                  }}
                                />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious />
                          <CarouselNext />
                        </Carousel>
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                          No image available
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-800/60 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <div className="bg-ivory/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-gray-800" />
                          <span className="text-gray-800 font-medium text-xs">{place.distance}</span>
                        </div>
                        <div className="bg-ivory/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-800" />
                          <span className="text-gray-800 font-medium text-xs">{place.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-playfair text-xl font-bold text-gray-800 mb-3">
                        {place.name}
                      </h3>
                      <p className="text-gray-800/80 text-sm leading-relaxed mb-4">
                        {expanded[place.name]
                          ? place.description
                          : place.description.length > 100
                            ? <>
                                {place.description.slice(0, 100)}...{' '}
                                <button className="text-gold underline text-xs" onClick={() => setExpanded(e => ({...e, [place.name]: true}))}>Read more</button>
                              </>
                            : place.description}
                      </p>

                      <div className="grid grid-cols-2 gap-1 mb-4">
                        {place.highlights.map((highlight, highlightIndex) => (
                          <div key={highlightIndex} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                            <span className="text-gray-800/70 text-xs">{highlight}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-start">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gold text-gray-800 px-4 py-2 rounded-full font-semibold text-sm hover:bg-bronze transition-colors duration-200 flex items-center space-x-2 min-w-[140px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Get Directions</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Nashik Places Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl font-bold text-gray-800 mb-4">
              Tourist Places [Nashik]
            </h2>
            <p className="text-xl text-gray-800/80">Explore famous destinations in Nashik</p>
          </div>

          <Carousel className="w-full">
            <CarouselContent>
              {nashikPlacesWithImages.map((place, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="bg-ivory rounded-3xl overflow-hidden luxury-shadow hover:shadow-2xl transition-all duration-500 group h-full">
                    <div className="relative overflow-hidden">
                      {Array.isArray(place.images) && place.images.length > 0 ? (
                        <Carousel className="w-full">
                          <CarouselContent>
                            {place.images.map((img, imgIdx) => (
                              <CarouselItem key={imgIdx}>
                                <img
                                  src={img}
                                  alt={place.name + ' image ' + (imgIdx + 1)}
                                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                                  onClick={() => {
                                    setLightboxImgs(place.images);
                                    setLightboxIndex(imgIdx);
                                    setLightboxImg(img);
                                    setLightboxOpen(true);
                                  }}
                                />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious />
                          <CarouselNext />
                        </Carousel>
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                          No image available
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-800/60 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <div className="bg-ivory/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-gray-800" />
                          <span className="text-gray-800 font-medium text-xs">{place.distance}</span>
                        </div>
                        <div className="bg-ivory/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-800" />
                          <span className="text-gray-800 font-medium text-xs">{place.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-playfair text-xl font-bold text-gray-800 mb-3">
                        {place.name}
                      </h3>
                      <p className="text-gray-800/80 text-sm leading-relaxed mb-4">
                        {expanded[place.name]
                          ? place.description
                          : place.description.length > 100
                            ? <>
                                {place.description.slice(0, 100)}...{' '}
                                <button className="text-gold underline text-xs" onClick={() => setExpanded(e => ({...e, [place.name]: true}))}>Read more</button>
                              </>
                            : place.description}
                      </p>

                      <div className="grid grid-cols-2 gap-1 mb-4">
                        {place.highlights.map((highlight, highlightIndex) => (
                          <div key={highlightIndex} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                            <span className="text-gray-800/70 text-xs">{highlight}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-start">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-800 text-ivory px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-800/80 transition-colors duration-200 flex items-center space-x-2 min-w-[140px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Get Directions</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Travel Tips */}
      <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-playfair text-4xl font-bold text-ivory mb-8">
            Travel Tips & Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-ivory/10 backdrop-blur-sm rounded-3xl p-8 border border-ivory/20">
              <h3 className="font-playfair text-xl font-semibold text-ivory mb-4">
                Best Time to Visit
              </h3>
              <p className="text-ivory/80 leading-relaxed">
                October to March offers pleasant weather for sightseeing. Monsoon season (June-September) brings lush greenery and spectacular waterfalls.
              </p>
            </div>
            <div className="bg-ivory/10 backdrop-blur-sm rounded-3xl p-8 border border-ivory/20">
              <h3 className="font-playfair text-xl font-semibold text-ivory mb-4">
                Transportation
              </h3>
              <p className="text-ivory/80 leading-relaxed">
                Our concierge can arrange guided tours, private transportation, or rental vehicles to explore these attractions comfortably and safely.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <button 
            onClick={() => window.open('/Attractions')}
            className="bg-gold text-gray-800 px-8 py-4 rounded-full font-semibold text-lg hover:bg-bronze transition-all duration-300 transform hover:scale-105">
              Plan Your Adventure
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox Modal (simple: only image and close button) */}
      {lightboxOpen && lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxOpen(false)}>
          <div className="relative max-w-3xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 bg-white/80 rounded-full p-2 text-gray-800 hover:bg-gold" onClick={() => setLightboxOpen(false)}>
              <span style={{fontSize: '1.5rem', fontWeight: 'bold'}}>&times;</span>
            </button>
            <img src={lightboxImg} alt="Large view" className="max-h-[80vh] w-auto rounded-xl shadow-2xl" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Attractions;
