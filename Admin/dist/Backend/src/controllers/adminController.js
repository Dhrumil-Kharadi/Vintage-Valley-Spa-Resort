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
    deleteBooking: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const schema = zod_1.z.object({ id: zod_1.z.string().min(1) });
        const { id } = schema.parse(req.params);
        await adminService_1.adminService.deleteBooking(id);
        res.json({ ok: true });
    }),
    createManualBooking: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const schema = zod_1.z.object({
            paymentMethod: zod_1.z.enum(["CASH", "UPI", "RECEPTION"]).optional(),
            userId: zod_1.z.string().min(1).optional(),
            userName: zod_1.z.string().min(1).optional(),
            userEmail: zod_1.z.string().email().optional(),
            userPhone: zod_1.z.string().optional().nullable(),
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
            adults: zod_1.z.number().int().min(0),
            children: zod_1.z.number().int().min(0),
            extraAdults: zod_1.z.number().int().min(0),
            additionalInformation: zod_1.z.string().nullable().optional(),
            mealPlanByDate: zod_1.z
                .array(zod_1.z.object({ date: zod_1.z.string().min(1), plan: zod_1.z.enum(["EP", "CP", "MAP"]) }))
                .optional(),
        });
        const body = schema.parse(req.body);
        if (!body.userId && (!body.userEmail || !body.userName)) {
            return res.status(400).json({ ok: false, error: { message: "User name and email are required" } });
        }
        const booking = await adminService_1.adminService.createManualBooking({
            paymentMethod: body.paymentMethod,
            userId: body.userId,
            userName: body.userName,
            userEmail: body.userEmail,
            userPhone: body.userPhone ?? null,
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
            mealPlanByDate: body.mealPlanByDate,
        });
        res.json({ ok: true, data: { booking } });
    }),
    payments: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const payments = await adminService_1.adminService.listPayments();
        res.json({ ok: true, data: { payments } });
    }),
};
