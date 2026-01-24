import { prisma } from "../../../Backend/src/prisma/client";

export const adminDataService = {
  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listBookings() {
    return prisma.booking.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        room: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listPayments() {
    return prisma.payment.findMany({
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            room: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listRooms() {
    const rooms = await prisma.room.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
      orderBy: { id: "asc" },
    });

    return rooms.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      pricePerNight: r.pricePerNight,
      images: r.images.map((i) => i.url),
      amenities: r.amenities.map((a) => a.name),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },
};
