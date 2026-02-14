"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoomService = void 0;
const client_1 = require("../../../Backend/src/prisma/client");
const errorHandler_1 = require("../../../Backend/src/middlewares/errorHandler");
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
        let room;
        try {
            room = await client_1.prisma.room.create({
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
        }
        catch (e) {
            if (e?.code === "P2000" && String(e?.meta?.column_name ?? "").toLowerCase().includes("url")) {
                throw new errorHandler_1.HttpError(400, "Image URL is too long. Please use a shorter URL.");
            }
            throw e;
        }
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
    async updateRoomPrice(id, params) {
        const room = await client_1.prisma.room.update({
            where: { id },
            data: {
                pricePerNight: params.pricePerNight,
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
        let room;
        try {
            room = await client_1.prisma.room.update({
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
        }
        catch (e) {
            if (e?.code === "P2000" && String(e?.meta?.column_name ?? "").toLowerCase().includes("url")) {
                throw new errorHandler_1.HttpError(400, "Image URL is too long. Please use a shorter URL.");
            }
            throw e;
        }
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
