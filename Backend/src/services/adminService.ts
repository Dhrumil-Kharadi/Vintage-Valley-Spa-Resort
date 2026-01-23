import { prisma } from "../prisma/client";

export const adminService = {
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

  async listRooms() {
    return prisma.room.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
      orderBy: { id: "asc" },
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
};
