import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";
import { getRazorpayClient } from "../utils/razorpay";
import { Prisma } from "@prisma/client";

export const adminService = {
  async listUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async listRooms() {
    return prisma.room.findMany({
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
      orderBy: { id: "asc" },
    });
  },

  async listBookings() {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        room: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const razorpay = getRazorpayClient();
    if (!razorpay) return bookings;

    let updatedCount = 0;
    for (const b of bookings) {
      if (updatedCount >= 10) break;
      for (const p of b.payments ?? []) {
        if (updatedCount >= 10) break;
        if (p?.provider !== "RAZORPAY") continue;
        if (p?.status !== "PAID") continue;
        if (p?.method) continue;
        if (!p?.razorpayPaymentId) continue;

        try {
          const details: any = await (razorpay as any).payments.fetch(p.razorpayPaymentId);
          await (prisma.payment as any).update({
            where: { id: p.id },
            data: {
              method: details?.method ?? null,
              bank: details?.bank ?? null,
              wallet: details?.wallet ?? null,
              vpa: details?.vpa ?? null,
              cardLast4: details?.card?.last4 ?? null,
              cardNetwork: details?.card?.network ?? null,
              cardType: details?.card?.type ?? null,
            },
          });

          p.method = details?.method ?? null;
          p.bank = details?.bank ?? null;
          p.wallet = details?.wallet ?? null;
          p.vpa = details?.vpa ?? null;
          p.cardLast4 = details?.card?.last4 ?? null;
          p.cardNetwork = details?.card?.network ?? null;
          p.cardType = details?.card?.type ?? null;
          updatedCount += 1;
        } catch {
          // best-effort
        }
      }
    }

    return bookings;
  },

  async createManualBooking(params: {
    userId: string;
    roomId: number;
    checkIn: string;
    checkOut: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    rooms?: number;
    guests: number;
    adults: number;
    children: number;
    extraAdults: number;
    additionalInformation?: string | null;
  }) {
    const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } });
    if (!user) throw new HttpError(404, "User not found");

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

    const rooms = Number(params.rooms ?? 1);
    if (!Number.isFinite(rooms) || !Number.isInteger(rooms) || rooms < 1 || rooms > 10) {
      throw new HttpError(400, "Invalid rooms");
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const base = room.pricePerNight * nights * rooms;
    const childCharge = 1200 * params.children * nights;
    const extraAdultCharge = 1500 * params.extraAdults * nights;
    const baseAmountNum = round2(base + childCharge + extraAdultCharge);
    const convenienceFeeAmountNum = round2(baseAmountNum * 0.02);
    const gstAmountNum = round2(baseAmountNum * 0.05);
    const amountNum = round2(baseAmountNum + convenienceFeeAmountNum + gstAmountNum);
    if (!Number.isFinite(amountNum) || amountNum < 1) throw new HttpError(400, "Invalid amount");

    const baseAmount = new Prisma.Decimal(baseAmountNum.toFixed(2));
    const convenienceFeeAmount = new Prisma.Decimal(convenienceFeeAmountNum.toFixed(2));
    const gstAmount = new Prisma.Decimal(gstAmountNum.toFixed(2));
    const amount = new Prisma.Decimal(amountNum.toFixed(2));

    try {
      const booking = await (prisma.booking as any).create({
        data: {
          userId: params.userId,
          roomId: params.roomId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          checkInTime: params.checkInTime ?? null,
          checkOutTime: params.checkOutTime ?? null,
          rooms,
          guests: params.guests,
          adults: params.adults,
          children: params.children,
          extraAdults: params.extraAdults,
          additionalInformation: params.additionalInformation ?? null,
          nights,
          baseAmount,
          convenienceFeeAmount,
          gstAmount,
          amount,
          status: "CONFIRMED",
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, role: true } },
          room: true,
          payments: true,
        },
      });
      return booking;
    } catch {
      throw new HttpError(500, "Failed to create booking. Please run database migration.");
    }
  },

  async listPayments() {
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            room: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const razorpay = getRazorpayClient();
    if (!razorpay) return payments;

    let updatedCount = 0;
    for (const p of payments) {
      if (updatedCount >= 10) break;
      if (p?.provider !== "RAZORPAY") continue;
      if (p?.status !== "PAID") continue;
      if (p?.method) continue;
      if (!p?.razorpayPaymentId) continue;

      try {
        const details: any = await (razorpay as any).payments.fetch(p.razorpayPaymentId);
        await (prisma.payment as any).update({
          where: { id: p.id },
          data: {
            method: details?.method ?? null,
            bank: details?.bank ?? null,
            wallet: details?.wallet ?? null,
            vpa: details?.vpa ?? null,
            cardLast4: details?.card?.last4 ?? null,
            cardNetwork: details?.card?.network ?? null,
            cardType: details?.card?.type ?? null,
          },
        });

        p.method = details?.method ?? null;
        p.bank = details?.bank ?? null;
        p.wallet = details?.wallet ?? null;
        p.vpa = details?.vpa ?? null;
        p.cardLast4 = details?.card?.last4 ?? null;
        p.cardNetwork = details?.card?.network ?? null;
        p.cardType = details?.card?.type ?? null;
        updatedCount += 1;
      } catch {
        // best-effort
      }
    }

    return payments;
  },
};
