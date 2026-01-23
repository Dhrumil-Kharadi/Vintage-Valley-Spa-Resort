import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";
import { getRazorpayClient } from "../utils/razorpay";

export const bookingService = {
  async createBookingWithOrder(params: {
    userId: string;
    roomId: number;
    checkIn: string;
    checkOut: string;
    guests: number;
    roomType?: string;
  }) {
    const room = await prisma.room.findUnique({ where: { id: params.roomId } });
    if (!room) throw new HttpError(404, "Room not found");

    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);

    if (!Number.isFinite(checkInDate.getTime()) || !Number.isFinite(checkOutDate.getTime())) {
      throw new HttpError(400, "Invalid dates");
    }

    const ms = checkOutDate.getTime() - checkInDate.getTime();
    if (ms <= 0) throw new HttpError(400, "Check-out must be after check-in");

    const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
    const amount = room.pricePerNight * nights;

    const razorpay = getRazorpayClient();
    if (!razorpay) throw new HttpError(500, "Razorpay is not configured");

    const booking = await prisma.booking.create({
      data: {
        userId: params.userId,
        roomId: params.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: params.guests,
        roomType: params.roomType,
        nights,
        amount,
        status: "PENDING",
      },
    });

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: booking.id,
      notes: {
        bookingId: booking.id,
        roomId: room.id,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: "RAZORPAY",
        status: "CREATED",
        currency: "INR",
        amount,
        razorpayOrderId: order.id,
      },
    });

    return {
      booking,
      payment,
      order,
      room,
    };
  },

  async markPaymentVerified(params: {
    userId: string;
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: { payments: true },
    });

    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.userId !== params.userId) throw new HttpError(403, "Forbidden");

    const payment = booking.payments.find((p) => p.razorpayOrderId === params.razorpayOrderId);
    if (!payment) throw new HttpError(400, "Payment record not found for order");

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          razorpayPaymentId: params.razorpayPaymentId,
          razorpaySignature: params.razorpaySignature,
        },
      });

      const b = await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED" },
      });

      return { booking: b, payment: p };
    });

    return updated;
  },
};
