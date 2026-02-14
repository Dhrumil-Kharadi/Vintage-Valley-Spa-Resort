"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDataController = void 0;
const asyncHandler_1 = require("../../../Backend/src/utils/asyncHandler");
const adminDataService_1 = require("../services/adminDataService");
const adminService_1 = require("../../../Backend/src/services/adminService");
const zod_1 = require("zod");
exports.adminDataController = {
    users: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const users = await adminDataService_1.adminDataService.listUsers();
        res.json({ ok: true, data: { users } });
    }),
    bookings: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const bookings = await adminDataService_1.adminDataService.listBookings();
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
            paymentMethod: zod_1.z.enum(["CASH", "UPI", "CARD"]).optional(),
            staffName: zod_1.z.string().min(1),
            userId: zod_1.z.string().min(1).optional(),
            userName: zod_1.z.string().min(1).optional(),
            userEmail: zod_1.z.string().email().optional(),
            userPhone: zod_1.z.string().min(1),
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
            staffName: body.staffName,
            userId: body.userId,
            userName: body.userName,
            userEmail: body.userEmail,
            userPhone: body.userPhone,
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
        const payments = await adminDataService_1.adminDataService.listPayments();
        res.json({ ok: true, data: { payments } });
    }),
    rooms: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const rooms = await adminDataService_1.adminDataService.listRooms();
        res.json({ ok: true, data: { rooms } });
    }),
};
