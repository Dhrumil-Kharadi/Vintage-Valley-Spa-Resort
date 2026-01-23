import { prisma } from "../prisma/client";

export const roomService = {
  async list() {
    const rooms = await prisma.room.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return rooms;
  },

  async getById(id: number) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
    });

    return room;
  },
};
