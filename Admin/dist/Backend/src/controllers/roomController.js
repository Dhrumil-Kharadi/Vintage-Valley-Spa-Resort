"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const errorHandler_1 = require("../middlewares/errorHandler");
const roomService_1 = require("../services/roomService");
exports.roomController = {
    list: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const rooms = await roomService_1.roomService.list();
        const data = rooms.map((room) => {
            const r = room;
            return {
                id: r.id,
                title: r.title,
                description: r.description,
                pricePerNight: r.pricePerNight,
                person: r.person,
                amenities: (r.amenities ?? []).map((a) => a.name),
                images: (r.images ?? []).map((i) => i.url),
            };
        });
        res.json({ ok: true, data: { rooms: data } });
    }),
    getById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isFinite(id))
            throw new errorHandler_1.HttpError(400, "Invalid room id");
        const room = await roomService_1.roomService.getById(id);
        if (!room)
            throw new errorHandler_1.HttpError(404, "Room not found");
        const r = room;
        res.json({
            ok: true,
            id: r.id,
            title: r.title,
            description: r.description,
            pricePerNight: r.pricePerNight,
            person: r.person,
            amenities: (r.amenities ?? []).map((a) => a.name),
            images: (r.images ?? []).map((i) => i.url),
        });
    }),
};
