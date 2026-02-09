"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const adminService_1 = require("../services/adminService");
const zod_1 = require("zod");
exports.adminController = {
    users: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const users = await adminService_1.adminService.listUsers();
        res.json({ ok: true, data: { users } });
    }),
    rooms: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const rooms = await adminService_1.adminService.listRooms();
        const data = rooms.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            pricePerNight: r.pricePerNight,
            amenities: r.amenities.map((a) => a.name),
            images: r.images.map((i) => i.url),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
        res.json({ ok: true, data: { rooms: data } });
    }),
    bookings: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const bookings = await adminService_1.adminService.listBookings();
        res.json({ ok: true, data: { bookings } });
    }),
    createManualBooking: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const schema = zod_1.z.object({
            userId: zod_1.z.string().min(1),
            roomId: zod_1.z.number().int(),
            checkIn: zod_1.z.string().min(1),
            checkOut: zod_1.z.string().min(1),
            checkInTime: zod_1.z
                .string()
                .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
                .optional()
                .nullable(),
            checkOutTime: zod_1.z
                .string()
                .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
                .optional()
                .nullable(),
            rooms: zod_1.z.number().int().min(1).max(10).optional(),
            guests: zod_1.z.number().int().min(1),
            adults: zod_1.z.number().int().min(1),
            children: zod_1.z.number().int().min(0),
            extraAdults: zod_1.z.number().int().min(0),
            additionalInformation: zod_1.z.string().nullable().optional(),
        });
        const body = schema.parse(req.body);
        const booking = await adminService_1.adminService.createManualBooking({
            userId: body.userId,
            roomId: body.roomId,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
            checkInTime: body.checkInTime ?? null,
            checkOutTime: body.checkOutTime ?? null,
            rooms: body.rooms,
            guests: body.guests,
            adults: body.adults,
            children: body.children,
            extraAdults: body.extraAdults,
            additionalInformation: body.additionalInformation ?? null,
        });
        res.json({ ok: true, data: { booking } });
    }),
    payments: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const payments = await adminService_1.adminService.listPayments();
        res.json({ ok: true, data: { payments } });
    }),
};
