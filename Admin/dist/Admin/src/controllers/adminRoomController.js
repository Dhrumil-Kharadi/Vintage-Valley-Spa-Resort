"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoomController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../../../Backend/src/utils/asyncHandler");
const adminRoomService_1 = require("../services/adminRoomService");
const createRoomSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    pricePerNight: zod_1.z.coerce.number().int().nonnegative(),
    epPricePerNight: zod_1.z.coerce.number().int().nonnegative().optional(),
    cpPricePerNight: zod_1.z.coerce.number().int().nonnegative().optional(),
    mapPricePerNight: zod_1.z.coerce.number().int().nonnegative().optional(),
    person: zod_1.z.coerce.number().int().positive().default(2),
    images: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    amenities: zod_1.z.array(zod_1.z.string().min(1)).default([]),
});
const updateRoomSchema = createRoomSchema;
const updateRoomPriceSchema = zod_1.z.object({
    pricePerNight: zod_1.z.coerce.number().int().nonnegative(),
    epPricePerNight: zod_1.z.coerce.number().int().nonnegative().optional(),
    cpPricePerNight: zod_1.z.coerce.number().int().nonnegative().optional(),
    mapPricePerNight: zod_1.z.coerce.number().int().nonnegative().optional(),
});
exports.adminRoomController = {
    list: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const rooms = await adminRoomService_1.adminRoomService.listRooms();
        res.json({ ok: true, data: { rooms } });
    }),
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const role = String(req.user?.role ?? "");
        if (role === "STAFF") {
            return res.status(403).json({ ok: false, error: { message: "Forbidden" } });
        }
        const body = createRoomSchema.parse(req.body);
        const room = await adminRoomService_1.adminRoomService.createRoom(body);
        res.status(201).json({ ok: true, data: { room } });
    }),
    update: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: { message: "Invalid room id" } });
        }
        const role = String(req.user?.role ?? "");
        if (role === "STAFF") {
            console.log("[adminRoomController.update][STAFF]", {
                id,
                body: req.body,
            });
            const body = updateRoomPriceSchema.parse(req.body);
            const room = await adminRoomService_1.adminRoomService.updateRoomPrice(id, body);
            console.log("[adminRoomController.update][STAFF][updated]", {
                id: room?.id,
                pricePerNight: room?.pricePerNight,
                epPricePerNight: room?.epPricePerNight,
                cpPricePerNight: room?.cpPricePerNight,
                mapPricePerNight: room?.mapPricePerNight,
            });
            res.json({ ok: true, data: { room } });
            return;
        }
        console.log("[adminRoomController.update][ADMIN]", {
            id,
            body: req.body,
        });
        const body = updateRoomSchema.parse(req.body);
        const room = await adminRoomService_1.adminRoomService.updateRoom(id, body);
        console.log("[adminRoomController.update][ADMIN][updated]", {
            id: room?.id,
            pricePerNight: room?.pricePerNight,
            epPricePerNight: room?.epPricePerNight,
            cpPricePerNight: room?.cpPricePerNight,
            mapPricePerNight: room?.mapPricePerNight,
        });
        res.json({ ok: true, data: { room } });
    }),
    remove: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const role = String(req.user?.role ?? "");
        if (role === "STAFF") {
            return res.status(403).json({ ok: false, error: { message: "Forbidden" } });
        }
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ ok: false, error: { message: "Invalid room id" } });
        }
        await adminRoomService_1.adminRoomService.deleteRoom(id);
        res.json({ ok: true });
    }),
};
