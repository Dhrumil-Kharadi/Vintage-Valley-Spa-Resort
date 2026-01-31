import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";
import { env } from "../config/env";
import { sendMailSafe } from "../utils/mailer";
import { getRazorpayClient } from "../utils/razorpay";

export const bookingService = {
  async createBooking(params: {
    userId: string;
    roomId: number;
    checkIn: string;
    checkOut: string;
    guests: number;
    adults: number;
    children: number;
    extraAdults: number;
    additionalInformation?: string | null;
  }): Promise<{
    booking: any;
    room: any;
    razorpayOrder: { id: string; amount: number; currency: string };
  }> {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new HttpError(401, "Unauthorized");

    const razorpay = getRazorpayClient();
    if (!razorpay) throw new HttpError(500, "Payment provider not configured");

    const room = await prisma.room.findUnique({ where: { id: params.roomId } });
    if (!room) throw new HttpError(404, "Room not found");

    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);

    if (!Number.isFinite(checkInDate.getTime()) || !Number.isFinite(checkOutDate.getTime())) {
      throw new HttpError(400, "Invalid dates");
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inDay = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
    if (inDay.getTime() < today.getTime()) throw new HttpError(400, "Check-in date must be today or a future date");

    const ms = checkOutDate.getTime() - checkInDate.getTime();
    if (ms <= 0) throw new HttpError(400, "Check-out must be after check-in");

    const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));

    if (!Number.isFinite(params.guests) || params.guests <= 0) throw new HttpError(400, "Invalid guests");
    if (!Number.isFinite(params.adults) || params.adults <= 0) throw new HttpError(400, "Invalid adults");
    if (!Number.isFinite(params.children) || params.children < 0) throw new HttpError(400, "Invalid children");
    if (!Number.isFinite(params.extraAdults) || params.extraAdults < 0) throw new HttpError(400, "Invalid extra adults");

    const base = room.pricePerNight * nights;
    const childCharge = 1200 * params.children * nights;
    const extraAdultCharge = 1500 * params.extraAdults * nights;
    const amount = base + childCharge + extraAdultCharge;

    const amountPaise = Math.round(amount * 100);
    if (!Number.isFinite(amount) || amount < 1 || amountPaise < 100) {
      throw new HttpError(400, "Invalid amount");
    }

    const existing: any = await (prisma.booking as any).findFirst({
      where: {
        userId: params.userId,
        roomId: params.roomId,
        status: "PENDING",
        checkIn: checkInDate,
        checkOut: checkOutDate,
      },
      include: {
        room: { select: { id: true, title: true, pricePerNight: true } },
        payments: true,
      },
    });

    if (existing) {
      const existingPayment = existing.payments?.find((p: any) => p.status === "CREATED" && p.provider === "RAZORPAY");
      if (existingPayment?.razorpayOrderId) {
        return {
          booking: existing,
          room,
          razorpayOrder: { id: existingPayment.razorpayOrderId, amount: amountPaise, currency: "INR" },
        };
      }
    }

    let razorpayOrder: any;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `bk_${Date.now()}_${params.userId.slice(0, 6)}`,
      });
    } catch (e: any) {
      throw new HttpError(500, e?.error?.description ?? e?.message ?? "Failed to initialize payment");
    }

    let booking: any;
    try {
      if (existing) {
        booking = await (prisma.booking as any).update({
          where: { id: existing.id },
          data: {
            guests: params.guests,
            adults: params.adults,
            children: params.children,
            extraAdults: params.extraAdults,
            additionalInformation: params.additionalInformation ?? null,
            nights,
            amount,
            payments: {
              create: {
                provider: "RAZORPAY",
                status: "CREATED",
                currency: "INR",
                amount,
                razorpayOrderId: razorpayOrder.id,
              },
            },
          },
          include: {
            room: { select: { id: true, title: true, pricePerNight: true } },
          },
        });
      } else {
        booking = await (prisma.booking as any).create({
          data: {
            userId: params.userId,
            roomId: params.roomId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: params.guests,
            adults: params.adults,
            children: params.children,
            extraAdults: params.extraAdults,
            additionalInformation: params.additionalInformation ?? null,
            nights,
            amount,
            status: "PENDING",
            payments: {
              create: {
                provider: "RAZORPAY",
                status: "CREATED",
                currency: "INR",
                amount,
                razorpayOrderId: razorpayOrder.id,
              },
            },
          },
          include: {
            room: { select: { id: true, title: true, pricePerNight: true } },
          },
        });
      }
    } catch {
      throw new HttpError(500, "Failed to create booking. Please run database migration.");
    }

    return {
      booking,
      room,
      razorpayOrder: { id: razorpayOrder.id, amount: Number(razorpayOrder.amount), currency: String(razorpayOrder.currency) },
    };
  },

  async deleteUserPendingBooking(params: { userId: string; bookingId: string }) {
    const booking: any = await (prisma.booking as any).findUnique({
      where: { id: params.bookingId },
      include: { payments: true },
    });

    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.userId !== params.userId) throw new HttpError(403, "Forbidden");
    if (booking.status !== "PENDING") throw new HttpError(400, "Only pending bookings can be deleted");

    await prisma.$transaction(async (tx) => {
      await (tx.booking as any).delete({ where: { id: booking.id } });
    });

    return { id: booking.id };
  },

  async listUserBookings(params: { userId: string }) {
    const bookings = await prisma.booking.findMany({
      where: { userId: params.userId },
      orderBy: { createdAt: "desc" },
      include: {
        room: { select: { id: true, title: true } },
      },
    });

    return bookings;
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

    let paymentDetails: any = null;
    try {
      const razorpay = getRazorpayClient();
      if (razorpay) {
        paymentDetails = await (razorpay as any).payments.fetch(params.razorpayPaymentId);
      }
    } catch {
      paymentDetails = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await (tx.payment as any).update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          razorpayPaymentId: params.razorpayPaymentId,
          razorpaySignature: params.razorpaySignature,
          method: paymentDetails?.method ?? null,
          bank: paymentDetails?.bank ?? null,
          wallet: paymentDetails?.wallet ?? null,
          vpa: paymentDetails?.vpa ?? null,
          cardLast4: paymentDetails?.card?.last4 ?? null,
          cardNetwork: paymentDetails?.card?.network ?? null,
          cardType: paymentDetails?.card?.type ?? null,
        },
      });

      const b = await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CONFIRMED" },
      });

      return { booking: b, payment: p };
    });

    try {
      const fullBooking: any = await (prisma.booking as any).findUnique({
        where: { id: booking.id },
        include: {
          room: { select: { id: true, title: true, pricePerNight: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (fullBooking?.user?.email) {
        const base = (fullBooking.room?.pricePerNight ?? 0) * (fullBooking.nights ?? 0);
        const childCharge = 1200 * (fullBooking.children ?? 0) * (fullBooking.nights ?? 0);
        const extraAdultCharge = 1500 * (fullBooking.extraAdults ?? 0) * (fullBooking.nights ?? 0);
        const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
        const subject = `Booking Confirmed - ${fullBooking.id}`;
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:0 auto;padding:24px;background:#ffffff;color:#1f2937;">
            <div style="border:1px solid #e5e7eb;border-radius:16px;padding:20px;">
              <h2 style="margin:0 0 8px 0;">Booking Confirmation</h2>
              <div style="color:#6b7280;margin-bottom:16px;">Thank you, ${fullBooking.user.name}. Your booking is confirmed.</div>

              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
                <div style="background:#fef3c7;border-radius:999px;padding:8px 12px;font-weight:700;">Booking ID: ${fullBooking.id}</div>
                <div style="background:#f3f4f6;border-radius:999px;padding:8px 12px;font-weight:700;">Status: ${fullBooking.status}</div>
              </div>

              <div style="border-top:1px dashed #e5e7eb;padding-top:16px;">
                <h3 style="margin:0 0 8px 0;">Room</h3>
                <div><strong>${fullBooking.room?.title ?? "Room"}</strong></div>
                <div style="color:#6b7280;">Price per night: ${fmt(fullBooking.room?.pricePerNight ?? 0)}</div>
              </div>

              <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                <h3 style="margin:0 0 8px 0;">Stay</h3>
                <div>Check-in: <strong>${new Date(fullBooking.checkIn).toLocaleDateString()}</strong></div>
                <div>Check-out: <strong>${new Date(fullBooking.checkOut).toLocaleDateString()}</strong></div>
                <div>Nights: <strong>${fullBooking.nights}</strong></div>
              </div>

              <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                <h3 style="margin:0 0 8px 0;">Guests</h3>
                <div>Total guests: <strong>${fullBooking.guests}</strong></div>
                <div>Adults: <strong>${fullBooking.adults}</strong></div>
                <div>Children (5–10): <strong>${fullBooking.children}</strong></div>
                <div>Extra adults (10+): <strong>${fullBooking.extraAdults}</strong></div>
              </div>

              <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                <h3 style="margin:0 0 8px 0;">Price Breakdown</h3>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>Room total</span><strong>${fmt(base)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>Children charge</span><strong>${fmt(childCharge)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>Extra adults charge</span><strong>${fmt(extraAdultCharge)}</strong></div>
                <div style="border-top:1px solid #e5e7eb;margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;gap:12px;font-size:18px;">
                  <span><strong>Total</strong></span>
                  <span><strong>${fmt(fullBooking.amount)}</strong></span>
                </div>
              </div>

              ${fullBooking.additionalInformation ? `
                <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                  <h3 style="margin:0 0 8px 0;">Additional Information</h3>
                  <div style="white-space:pre-wrap;color:#374151;">${String(fullBooking.additionalInformation)}</div>
                </div>
              ` : ""}

              <div style="margin-top:18px;color:#6b7280;font-size:12px;">This is an automated email. Please keep it for your records.</div>
            </div>
          </div>
        `;

        await sendMailSafe({
          to: fullBooking.user.email,
          subject,
          html,
          from: env.EMAIL_FROM,
          gmailUser: env.GMAIL_USER,
          gmailAppPassword: env.GMAIL_APP_PASSWORD,
        });
      }
    } catch {
      // ignore email failures
    }

    return updated;
  },
};
