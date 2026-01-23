import { Wifi, Car, Tv, Bath, Users, Bed, Mountain, Coffee } from 'lucide-react';

export type Room = {
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

export const rooms: Room[] = [
  {
    id: 1,
    title: 'Deluxe Studio Suite',
    subtitle: 'Elegant Comfort in Nature',
    images: [
      '/images/deluxe-studio-suite-1.jpg',
      '/images/deluxe-studio-suite-2.jpg',
      '/images/deluxe-studio-suite-3.jpg'
    ],
    description: 'Our Deluxe Studio Suite offers the perfect blend of modern luxury and natural serenity. Featuring contemporary amenities, panoramic views, and thoughtful design elements that create an atmosphere of sophisticated relaxation.',
    capacity: '2 Adults',
    bedType: 'Standard Size Bed',
    size: '450 sq.ft',
    pricing: {
      weekday: '₹4,500',
      weekend: '₹5,500'
    },
    amenities: [
      { icon: Wifi, name: 'WiFi' },
      { icon: Car, name: 'Complimentary Parking' },
      { icon: Tv, name: 'Smart TV' },
      { icon: Bath, name: 'Upscale Washroom' },
      { icon: Coffee, name: 'Tea/Coffee Maker' },
      { icon: Mountain, name: 'Private Balcony' }
    ]
  },
  {
    id: 3,
    title: 'Deluxe Edge View',
    subtitle: 'Corner Privacy with Scenic Visibility',
    images: [
      '/images/deluxe-edge-view-1.jpg',
      '/images/room/4.jpeg',
      '/images/room/5.jpeg'
    ],
    description: 'Rooms with stunning front-facing views, offering elevated comfort and a refined aesthetic. Positioned at the corner edge of each floor for enhanced privacy and scenic visibility.',
    capacity: '2 Adults',
    bedType: 'Standard Size Bed',
    size: '480 sq.ft',
    pricing: {
      weekday: '₹5,000',
      weekend: '₹6,000'
    },
    amenities: [
      { icon: Wifi, name: 'WiFi' },
      { icon: Car, name: 'Complimentary Parking' },
      { icon: Tv, name: 'Smart TV' },
      { icon: Bath, name: 'Upscale Washroom' },
      { icon: Mountain, name: 'Edge Views' },
      { icon: Mountain, name: 'Private Balcony' }
    ]
  },
  {
    id: 4,
    title: 'Lotus Family Suite',
    subtitle: 'Spacious Luxury for Families',
    images: [
      '/images/1.jpeg',
      '/images/room/AB004957.JPG',
      '/images/room/AB004912.JPG'
    ],
    description: 'The Lotus Family Suite provides generous space and premium comfort for larger groups. With separate living areas, premium furnishings, and spectacular views, it offers the perfect setting for memorable family gatherings.',
    capacity: '4 Adults',
    bedType: 'Master Bedroom → King Size Bed, Second Bedroom → Queen Size Bed',
    size: '600 sq.ft',
    pricing: {
      weekday: '₹8,000',
      weekend: '₹9,000'
    },
    amenities: [
      { icon: Wifi, name: 'WiFi' },
      { icon: Car, name: 'Complimentary Parking' },
      { icon: Tv, name: 'Smart TV' },
      { icon: Bath, name: 'Master Room with Bath Tub Comfort | Shared Second Washroom' },
      { icon: Mountain, name: 'Panoramic Views' },
      { icon: Mountain, name: 'Private Balcony' }
    ]
  },
  {
    id: 5,
    title: 'Presidential Suite',
    subtitle: 'Ultimate Luxury Experience',
    images: [
      '/images/room/1.jpeg',
      '/images/room/1000021300 (1).jpg',
      '/images/room/1000021301 (1).jpg'
    ],
    description: 'The Presidential Suite represents the pinnacle of luxury accommodation. Featuring exclusive amenities, private spaces, and unparalleled views, this suite offers an extraordinary retreat for discerning guests.',
    capacity: '4 Adults',
    bedType: 'Master Bedroom → King Size Bed, Second Bedroom → Queen Size Bed, Living area',
    size: '650 sq.ft',
    pricing: {
      weekday: '₹9,000',
      weekend: '₹10,000'
    },
    amenities: [
      { icon: Wifi, name: 'WiFi' },
      { icon: Car, name: 'Complimentary Parking' },
      { icon: Bath, name: 'Both Bathrooms Attached | Master Bath with Bathtub' },
      { icon: Mountain, name: 'Private Balcony' },
      { icon: Coffee, name: 'Tea/Coffee Maker' }
    ]
  }
]; 