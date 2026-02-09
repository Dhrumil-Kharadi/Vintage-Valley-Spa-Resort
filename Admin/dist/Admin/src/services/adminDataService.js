"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDataService = void 0;
const client_1 = require("../../../Backend/src/prisma/client");
exports.adminDataService = {
    async listUsers() {
        return client_1.prisma.user.findMany({
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
        return client_1.prisma.booking.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, role: true } },
                room: true,
                payments: true,
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async listPayments() {
        return client_1.prisma.payment.findMany({
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
};
