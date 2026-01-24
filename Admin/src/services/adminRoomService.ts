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

    return rooms.map((room) => {
      const r: any = room as any;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        pricePerNight: r.pricePerNight,
        person: r.person,
        images: (r.images ?? []).map((i: any) => i.url),
        amenities: (r.amenities ?? []).map((a: any) => a.name),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  },

  async createRoom(params: {
    title: string;
    description: string;
    pricePerNight: number;
    person: number;
    images: string[];
    amenities: string[];
  }) {
    const room = await (prisma.room as any).create({
      data: {
        title: params.title,
        description: params.description,
        pricePerNight: params.pricePerNight,
        person: params.person,
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

    const r: any = room as any;

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      pricePerNight: r.pricePerNight,
      person: r.person,
      images: (r.images ?? []).map((i: any) => i.url),
      amenities: (r.amenities ?? []).map((a: any) => a.name),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  },

  async updateRoom(
    id: number,
    params: {
      title: string;
      description: string;
      pricePerNight: number;
      person: number;
      images: string[];
      amenities: string[];
    }
  ) {
    const room = await (prisma.room as any).update({
      where: { id },
      data: {
        title: params.title,
        description: params.description,
        pricePerNight: params.pricePerNight,
        person: params.person,
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

    const r: any = room as any;

    return {
      id: r.id,
      title: r.title,
      description: r.description,
      pricePerNight: r.pricePerNight,
      person: r.person,
      images: (r.images ?? []).map((i: any) => i.url),
      amenities: (r.amenities ?? []).map((a: any) => a.name),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  },

  async deleteRoom(id: number) {
    await prisma.room.delete({ where: { id } });
  },
};
