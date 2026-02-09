"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoomService = void 0;
const client_1 = require("../../../Backend/src/prisma/client");
exports.adminRoomService = {
    async listRooms() {
        const rooms = await client_1.prisma.room.findMany({
            include: {
                images: { orderBy: { sortOrder: "asc" } },
                amenities: true,
            },
            orderBy: { id: "asc" },
        });
        return rooms.map((room) => {
            const r = room;
            return {
                id: r.id,
                title: r.title,
                description: r.description,
                pricePerNight: r.pricePerNight,
                person: r.person,
                images: (r.images ?? []).map((i) => i.url),
                amenities: (r.amenities ?? []).map((a) => a.name),
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            };
        });
    },
    async createRoom(params) {
        const room = await client_1.prisma.room.create({
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
        const r = room;
        return {
            id: r.id,
            title: r.title,
            description: r.description,
            pricePerNight: r.pricePerNight,
            person: r.person,
            images: (r.images ?? []).map((i) => i.url),
            amenities: (r.amenities ?? []).map((a) => a.name),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        };
    },
    async updateRoom(id, params) {
        const room = await client_1.prisma.room.update({
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
        const r = room;
        return {
            id: r.id,
            title: r.title,
            description: r.description,
            pricePerNight: r.pricePerNight,
            person: r.person,
            images: (r.images ?? []).map((i) => i.url),
            amenities: (r.amenities ?? []).map((a) => a.name),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        };
    },
    async deleteRoom(id) {
        await client_1.prisma.room.delete({ where: { id } });
    },
};
