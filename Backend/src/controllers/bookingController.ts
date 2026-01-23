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
  guests: z.number().int().min(1),
  roomType: z.string().optional(),
});

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const bookingController = {
  create: asyncHandler(async (req: AuthedRequest, res) => {
    const body = createSchema.parse(req.body);

    const result = await bookingService.createBookingWithOrder({
      userId: req.user!.userId,
      roomId: body.roomId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guests: body.guests,
      roomType: body.roomType,
    });

    res.json({
      ok: true,
      data: {
        bookingId: result.booking.id,
        amount: result.booking.amount,
        currency: "INR",
        razorpay: {
          keyId: env.RAZORPAY_KEY_ID ?? null,
          orderId: result.order.id,
          amount: result.order.amount,
          currency: result.order.currency,
        },
        room: {
          id: result.room.id,
          title: result.room.title,
          pricePerNight: result.room.pricePerNight,
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
};
