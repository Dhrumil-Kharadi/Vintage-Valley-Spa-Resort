const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const parsePrice = (value) => {
  const digits = String(value).replace(/[^0-9]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
};

const rooms = [
  {
    id: 1,
    title: "Deluxe Studio Suite",
    description:
      "Our Deluxe Studio Suite offers the perfect blend of modern luxury and natural serenity. Featuring contemporary amenities, panoramic views, and thoughtful design elements that create an atmosphere of sophisticated relaxation.",
    pricePerNight: parsePrice("₹4,500"),
    images: [
      "/images/deluxe-studio-suite-1.jpg",
      "/images/deluxe-studio-suite-2.jpg",
      "/images/deluxe-studio-suite-3.jpg",
    ],
    amenities: [
      "WiFi",
      "Complimentary Parking",
      "Smart TV",
      "Upscale Washroom",
      "Tea/Coffee Maker",
      "Private Balcony",
    ],
  },
  {
    id: 3,
    title: "Deluxe Edge View",
    description:
      "Rooms with stunning front-facing views, offering elevated comfort and a refined aesthetic. Positioned at the corner edge of each floor for enhanced privacy and scenic visibility.",
    pricePerNight: parsePrice("₹5,000"),
    images: [
      "/images/deluxe-edge-view-1.jpg",
      "/images/room/4.jpeg",
      "/images/room/5.jpeg",
    ],
    amenities: [
      "WiFi",
      "Complimentary Parking",
      "Smart TV",
      "Upscale Washroom",
      "Edge Views",
      "Private Balcony",
    ],
  },
  {
    id: 4,
    title: "Lotus Family Suite",
    description:
      "The Lotus Family Suite provides generous space and premium comfort for larger groups. With separate living areas, premium furnishings, and spectacular views, it offers the perfect setting for memorable family gatherings.",
    pricePerNight: parsePrice("₹8,000"),
    images: [
      "/images/1.jpeg",
      "/images/room/AB004957.JPG",
      "/images/room/AB004912.JPG",
    ],
    amenities: [
      "WiFi",
      "Complimentary Parking",
      "Smart TV",
      "Master Room with Bath Tub Comfort | Shared Second Washroom",
      "Panoramic Views",
      "Private Balcony",
    ],
  },
  {
    id: 5,
    title: "Presidential Suite",
    description:
      "The Presidential Suite represents the pinnacle of luxury accommodation. Featuring exclusive amenities, private spaces, and unparalleled views, this suite offers an extraordinary retreat for discerning guests.",
    pricePerNight: parsePrice("₹9,000"),
    images: [
      "/images/room/1.jpeg",
      "/images/room/1000021300 (1).jpg",
      "/images/room/1000021301 (1).jpg",
    ],
    amenities: [
      "WiFi",
      "Complimentary Parking",
      "Both Bathrooms Attached | Master Bath with Bathtub",
      "Private Balcony",
      "Tea/Coffee Maker",
    ],
  },
];

async function main() {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      create: {
        id: room.id,
        title: room.title,
        description: room.description,
        pricePerNight: room.pricePerNight,
        images: {
          create: room.images.map((url, idx) => ({
            url,
            sortOrder: idx,
          })),
        },
        amenities: {
          create: room.amenities.map((name) => ({ name })),
        },
      },
      update: {
        title: room.title,
        description: room.description,
        pricePerNight: room.pricePerNight,
        images: {
          deleteMany: {},
          create: room.images.map((url, idx) => ({
            url,
            sortOrder: idx,
          })),
        },
        amenities: {
          deleteMany: {},
          create: room.amenities.map((name) => ({ name })),
        },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });
