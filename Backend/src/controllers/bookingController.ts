import { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { bookingService } from "../services/bookingService";
import { AuthedRequest } from "../middlewares/auth";
import { HttpError } from "../middlewares/errorHandler";
import { verifyRazorpaySignature } from "../utils/razorpaySignature";
import { env } from "../config/env";

const createSchema = z.object({
  roomId: z.number().int(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  checkInTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .nullable(),
  checkOutTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .nullable(),
  rooms: z.number().int().min(1).max(10).optional(),
  guests: z.number().int().min(1),
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  extraAdults: z.number().int().min(0),
  additionalInformation: z.string().nullable().optional(),
  promoCode: z.string().min(1).optional().nullable(),
  mealPlanByDate: z
    .array(
      z.object({
        date: z.string().min(1),
        plan: z.enum(["EP", "CP", "MAP"]),
      })
    )
    .optional()
    .nullable(),
});

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const bookingController: Record<"me" | "totalCount" | "create" | "verify" | "deletePending" | "invoice", RequestHandler> = {
  me: asyncHandler(async (req: AuthedRequest, res) => {
    const bookings = await bookingService.listUserBookings({ userId: req.user!.userId });
    res.json({ ok: true, data: { bookings } });
  }),

  totalCount: asyncHandler(async (_req: AuthedRequest, res) => {
    const result = await bookingService.getTotalBookingsCount();
    res.json({ ok: true, data: result });
  }),

  create: asyncHandler(async (req: AuthedRequest, res) => {
    const body = createSchema.parse(req.body);

    const result = await bookingService.createBooking({
      userId: req.user!.userId,
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
          keyId: env.RAZORPAY_KEY_ID,
          orderId: result.razorpayOrder.id,
          amount: result.razorpayOrder.amount,
          currency: result.razorpayOrder.currency,
        },
      },
    });
  }),

  verify: asyncHandler(async (req: AuthedRequest, res) => {
    const bookingId = req.params.id;
    const body = verifySchema.parse(req.body);

    const ok = verifyRazorpaySignature({
      orderId: body.razorpayOrderId,
      paymentId: body.razorpayPaymentId,
      signature: body.razorpaySignature,
    });

    if (!ok) throw new HttpError(400, "Invalid payment signature");

    const updated = await bookingService.markPaymentVerified({
      userId: req.user!.userId,
      bookingId,
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      razorpaySignature: body.razorpaySignature,
    });

    res.json({ ok: true, data: updated });
  }),

  deletePending: asyncHandler(async (req: AuthedRequest, res) => {
    const bookingId = req.params.id;
    const result = await bookingService.deleteUserPendingBooking({ userId: req.user!.userId, bookingId });
    res.json({ ok: true, data: result });
  }),

  invoice: asyncHandler(async (req: AuthedRequest, res) => {
    const bookingId = req.params.id;
    const invoice = await bookingService.getUserInvoiceData({ userId: req.user!.userId, bookingId });
    res.json({ ok: true, data: { booking: invoice } });
  }),
};
