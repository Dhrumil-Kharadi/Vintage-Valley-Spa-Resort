"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomService = void 0;
const client_1 = require("../prisma/client");
exports.roomService = {
    async list() {
        const rooms = await client_1.prisma.room.findMany({
            include: {
                images: { orderBy: { sortOrder: "asc" } },
                amenities: true,
            },
            orderBy: { createdAt: "asc" },
        });
        return rooms;
    },
    async getById(id) {
        const room = await client_1.prisma.room.findUnique({
            where: { id },
            include: {
                images: { orderBy: { sortOrder: "asc" } },
                amenities: true,
            },
        });
        return room;
    },
};
