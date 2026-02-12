"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const bookingService_1 = require("../services/bookingService");
const errorHandler_1 = require("../middlewares/errorHandler");
const razorpaySignature_1 = require("../utils/razorpaySignature");
const env_1 = require("../config/env");
const createSchema = zod_1.z.object({
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
    promoCode: zod_1.z.string().min(1).optional().nullable(),
    mealPlanByDate: zod_1.z
        .array(zod_1.z.object({
        date: zod_1.z.string().min(1),
        plan: zod_1.z.enum(["EP", "CP", "MAP"]),
    }))
        .optional()
        .nullable(),
});
const verifySchema = zod_1.z.object({
    razorpayOrderId: zod_1.z.string().min(1),
    razorpayPaymentId: zod_1.z.string().min(1),
    razorpaySignature: zod_1.z.string().min(1),
});
exports.bookingController = {
    me: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const bookings = await bookingService_1.bookingService.listUserBookings({ userId: req.user.userId });
        res.json({ ok: true, data: { bookings } });
    }),
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = createSchema.parse(req.body);
        const result = await bookingService_1.bookingService.createBooking({
            userId: req.user.userId,
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
            promoCode: body.promoCode ? String(body.promoCode) : null,
            mealPlanByDate: body.mealPlanByDate ?? null,
        });
        res.json({
            ok: true,
            data: {
                booking: result.booking,
                razorpay: {
                    keyId: env_1.env.RAZORPAY_KEY_ID,
                    orderId: result.razorpayOrder.id,
                    amount: result.razorpayOrder.amount,
                    currency: result.razorpayOrder.currency,
                },
            },
        });
    }),
    verify: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const bookingId = req.params.id;
        const body = verifySchema.parse(req.body);
        const ok = (0, razorpaySignature_1.verifyRazorpaySignature)({
            orderId: body.razorpayOrderId,
            paymentId: body.razorpayPaymentId,
            signature: body.razorpaySignature,
        });
        if (!ok)
            throw new errorHandler_1.HttpError(400, "Invalid payment signature");
        const updated = await bookingService_1.bookingService.markPaymentVerified({
            userId: req.user.userId,
            bookingId,
            razorpayOrderId: body.razorpayOrderId,
            razorpayPaymentId: body.razorpayPaymentId,
            razorpaySignature: body.razorpaySignature,
        });
        res.json({ ok: true, data: updated });
    }),
    deletePending: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const bookingId = req.params.id;
        const result = await bookingService_1.bookingService.deleteUserPendingBooking({ userId: req.user.userId, bookingId });
        res.json({ ok: true, data: result });
    }),
    invoice: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const bookingId = req.params.id;
        const invoice = await bookingService_1.bookingService.getUserInvoiceData({ userId: req.user.userId, bookingId });
        res.json({ ok: true, data: { booking: invoice } });
    }),
};
