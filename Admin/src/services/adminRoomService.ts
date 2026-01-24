import { prisma } from "../../../Backend/src/prisma/client";

export const adminRoomService = {
  async listRooms() {
    const rooms = await prisma.room.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
      orderBy: { id: "asc" },
    });

    return rooms.map((room) => ({
      id: room.id,
      title: room.title,
      description: room.description,
      pricePerNight: room.pricePerNight,
      images: room.images.map((i) => i.url),
      amenities: room.amenities.map((a) => a.name),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));
  },

  async createRoom(params: {
    title: string;
    description: string;
    pricePerNight: number;
    images: string[];
    amenities: string[];
  }) {
    const room = await prisma.room.create({
      data: {
        title: params.title,
        description: params.description,
        pricePerNight: params.pricePerNight,
        images: {
          create: params.images.map((url, idx) => ({ url, sortOrder: idx })),
        },
        amenities: {
          create: params.amenities.map((name) => ({ name })),
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
    });

    return {
      id: room.id,
      title: room.title,
      description: room.description,
      pricePerNight: room.pricePerNight,
      images: room.images.map((i) => i.url),
      amenities: room.amenities.map((a) => a.name),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  },

  async updateRoom(
    id: number,
    params: {
      title: string;
      description: string;
      pricePerNight: number;
      images: string[];
      amenities: string[];
    }
  ) {
    const room = await prisma.room.update({
      where: { id },
      data: {
        title: params.title,
        description: params.description,
        pricePerNight: params.pricePerNight,
        images: {
          deleteMany: {},
          create: params.images.map((url, idx) => ({ url, sortOrder: idx })),
        },
        amenities: {
          deleteMany: {},
          create: params.amenities.map((name) => ({ name })),
        },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
    });

    return {
      id: room.id,
      title: room.title,
      description: room.description,
      pricePerNight: room.pricePerNight,
      images: room.images.map((i) => i.url),
      amenities: room.amenities.map((a) => a.name),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  },

  async deleteRoom(id: number) {
    await prisma.room.delete({ where: { id } });
  },
};
