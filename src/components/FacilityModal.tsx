
import { X, MapPin, Clock, Users, Star } from 'lucide-react';
import { useState } from 'react';

interface FacilityModalProps {
  facility: {
    id: number;
    title: string;
    description: string;
    image: string;
    features: string[];
    icon: any;
  };
  isOpen: boolean;
  onClose: () => void;
}

const FacilityModal = ({ facility, isOpen, onClose }: FacilityModalProps) => {
  if (!isOpen) return null;

  const additionalDetails = {
    1: { // Infinity Pool
      operatingHours: '8:00 AM - 6:00 PM',
      capacity: '25 guests',
      temperature: '28°C maintained',
      specialFeatures: ['Underwater lighting', 'Infinity edge design'],
      gallery: [
        '/images/pool/AB005094.JPG',
        '/images/pool/AB005097.JPG',
        '/images/pool/AB005100.JPG'
      ]
    },
    2: { // Palatio Banquet
      operatingHours: '8:00 AM - 11:00 PM',
      capacity: '250 guests',
      area: '5000 sq ft',
      specialFeatures: ['Professional sound system', 'Stage space available', 'Catering kitchen in house', 'Weather-proof canopy option'],
      gallery: [
        '/images/pool/AB004825.JPG',
        '/images/pool/AB004834.JPG',
        '/images/pool/AB004827.JPG'
      ]
    },
    3: { // Tarkari Restaurant
      operatingHours: '8:00 AM - 10:00 PM',
      capacity: '80 guests',
      cuisine: 'Multi-cuisine',
      specialFeatures: ['cooking counter', 'dining area', 'Specialized lighting', 'Outdoor open roof seating'],
      gallery: [
        '/images/pool/AB004771.JPG',
        '/images/pool/AB004776.JPG',
        '/images/pool/AB004802.JPG'
      ]
    },
    4: { // Spa & Wellness
      operatingHours: '9:00 AM - 9:00 PM',
      capacity: '4 treatment rooms',
      treatments: '15+ treatments',
      specialFeatures: ['Couple treatment rooms', 'Steam and sauna', 'Meditation room', 'Aromatherapy garden'],
      gallery: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ]
    },
    5: { // Euphoria gym
      operatingHours: '7:00 AM - 11:00 AM, 6:00 PM - 10:00 PM',
      specialFeatures: [
        'Modern Equipment for cardio',
        'Air-Conditioned & Spacious Workout Area',
        'Full-Length Mirrors & Rubber Flooring',
        'Soothing Music & LED Lighting',
        'Open Early Morning till Late Evening',
        'Outdoor workout area'
      ],
      gallery: [
        '/images/room/1000021000.png',
        '/images/room/1000021001.jpg',
        '/images/room/1000020999.png'
      ]
    },
    6: { // Game Zone
      operatingHours: '8:00 AM - 10:00 PM',
      specialFeatures: [
        'Indoor gaming area',
        'Equipment provided (cricket kit, badminton, carrom, chess)',
        'kids play area'
      ],
      gallery: [
        '/images/room/1000021004.jpg',
        '/images/room/1000021006.jpg',
        '/images/room/1000021003.jpg'
      ]
    }
  };

  const details = additionalDetails[facility.id as keyof typeof additionalDetails];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 xs:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-full sm:max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
          >
            <X className="h-5 w-5 text-charcoal" />
          </button>
          
          <img
            src={facility.image}
            alt={facility.title}
            className="w-full h-40 xs:h-56 sm:h-64 object-cover rounded-t-2xl sm:rounded-t-3xl"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent rounded-t-2xl sm:rounded-t-3xl" />
          
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
            <div className="bg-gold/90 backdrop-blur-sm rounded-full p-2 sm:p-3 mb-2 sm:mb-4">
              <facility.icon className="h-5 w-5 sm:h-6 sm:w-6 text-charcoal" />
            </div>
            <h2 className="font-playfair text-xl sm:text-3xl font-bold text-white">
              {facility.title}
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          <p className="text-charcoal/80 text-base sm:text-lg leading-relaxed mb-4 sm:mb-8">
            {facility.description}
          </p>

          {details && (
            <>
              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-semibold text-charcoal text-sm sm:text-base">Operating Hours</p>
                    <p className="text-charcoal/70 text-xs sm:text-sm">{details.operatingHours}</p>
                  </div>
                </div>
                {'capacity' in details && details.capacity && (
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gold" />
                    <div>
                      <p className="font-semibold text-charcoal text-sm sm:text-base">Capacity</p>
                      <p className="text-charcoal/70 text-xs sm:text-sm">{details.capacity}</p>
                    </div>
                  </div>
                )}
                {'area' in details && details.area && (
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-gold" />
                    <div>
                      <p className="font-semibold text-charcoal text-sm sm:text-base">Area</p>
                      <p className="text-charcoal/70 text-xs sm:text-sm">{details.area}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-semibold text-charcoal text-sm sm:text-base">Rating</p>
                    <p className="text-charcoal/70 text-xs sm:text-sm">4.8/5 (Premium)</p>
                  </div>
                </div>
              </div>

              {/* Special Features */}
              <div className="mb-4 sm:mb-8">
                <h3 className="font-playfair text-lg sm:text-2xl font-semibold text-charcoal mb-2 sm:mb-4">
                  Special Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {details.specialFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gold rounded-full" />
                      <span className="text-charcoal/80 text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery */}
              <div className="mb-4 sm:mb-8">
                <h3 className="font-playfair text-lg sm:text-2xl font-semibold text-charcoal mb-2 sm:mb-4">
                  Gallery
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {details.gallery.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${facility.title} ${index + 1}`}
                      className="w-full h-16 sm:h-24 object-cover rounded-lg sm:rounded-xl hover:scale-105 transition-transform duration-300"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Original Features */}
          <div className="mb-4 sm:mb-8">
            <h3 className="font-playfair text-lg sm:text-2xl font-semibold text-charcoal mb-2 sm:mb-4">
              Amenities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              {facility.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-bronze rounded-full" />
                  <span className="text-charcoal/80 text-sm sm:text-base">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button className="bg-gold text-charcoal px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base hover:bg-bronze transition-colors duration-200 flex-1">
              Book Now
            </button>
            <button className="border-2 border-charcoal text-charcoal px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base hover:bg-charcoal hover:text-white transition-colors duration-200 flex-1">
              Contact for Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityModal;
