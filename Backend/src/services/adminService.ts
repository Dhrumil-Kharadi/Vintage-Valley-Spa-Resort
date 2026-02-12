import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";
import { getRazorpayClient } from "../utils/razorpay";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

  async deleteBooking(bookingId: string) {
    const id = String(bookingId ?? "").trim();
    if (!id) throw new HttpError(400, "Invalid booking id");

    const existing = await prisma.booking.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new HttpError(404, "Booking not found");

    await prisma.booking.delete({ where: { id } });
    return true;
  },

  async createManualBooking(params: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string | null;
    paymentMethod?: "CASH" | "UPI" | "RECEPTION";
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
    mealPlanByDate?: Array<{ date: string; plan: "EP" | "CP" | "MAP" }>;
  }) {
    let userId = params.userId?.trim() ? String(params.userId).trim() : "";
    if (!userId) {
      const email = String(params.userEmail ?? "").trim().toLowerCase();
      const name = String(params.userName ?? "").trim();
      const phone = String(params.userPhone ?? "").trim();
      if (!email) throw new HttpError(400, "User email is required");
      if (!name) throw new HttpError(400, "User name is required");

      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing?.id) {
        userId = existing.id;
        try {
          await prisma.user.update({
            where: { id: userId },
            data: {
              name,
              phone: phone ? phone : null,
            },
          });
        } catch {
          // best-effort
        }
      } else {
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await bcrypt.hash(randomPassword, 10);
        const created = await prisma.user.create({
          data: {
            name,
            email,
            phone: phone ? phone : null,
            passwordHash,
            role: "USER",
          },
          select: { id: true },
        });
        userId = created.id;
      }
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new HttpError(404, "User not found");
    }

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
    if (!Number.isFinite(params.adults) || params.adults < 0) throw new HttpError(400, "Invalid adults");
    if (!Number.isFinite(params.children) || params.children < 0) throw new HttpError(400, "Invalid children");
    if (!Number.isFinite(params.extraAdults) || params.extraAdults < 0) throw new HttpError(400, "Invalid extra adults");

    const rooms = Number(params.rooms ?? 1);
    if (!Number.isFinite(rooms) || !Number.isInteger(rooms) || rooms < 1 || rooms > 10) {
      throw new HttpError(400, "Invalid rooms");
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;

    const normalizeDateKey = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const dayPlansRaw = Array.isArray(params.mealPlanByDate) ? params.mealPlanByDate : [];
    const planMap = new Map<string, "EP" | "CP" | "MAP">();
    for (const item of dayPlansRaw) {
      if (!item) continue;
      const key = String((item as any).date ?? "").trim();
      const plan = String((item as any).plan ?? "").trim().toUpperCase() as any;
      if (!key) continue;
      if (plan !== "EP" && plan !== "CP" && plan !== "MAP") continue;
      planMap.set(key, plan);
    }

    let cpNights = 0;
    let mapNights = 0;
    const mealPlanByDate: Array<{ date: string; plan: "EP" | "CP" | "MAP" }> = [];
    {
      const cursor = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
      for (let i = 0; i < nights; i++) {
        const key = normalizeDateKey(cursor);
        const plan = planMap.get(key) ?? "EP";
        if (plan === "CP") cpNights += 1;
        if (plan === "MAP") mapNights += 1;
        mealPlanByDate.push({ date: key, plan });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const title = String(room?.title ?? "").toLowerCase();
    const mapRatePerGuestPerNight = title.includes("lotus") || title.includes("presidential")
      ? 2000
      : title.includes("deluxe") || title.includes("edge")
      ? 1000
      : 0;
    const base = room.pricePerNight * nights * rooms;
    const childCharge = 1200 * params.children * nights;
    const extraAdultCharge = 1500 * params.extraAdults * nights;
    const cpAmountNum = round2(500 * Number(params.guests) * cpNights);
    const mapAmountNum = round2(mapRatePerGuestPerNight * Number(params.guests) * mapNights);
    const baseAmountNum = round2(base + childCharge + extraAdultCharge + cpAmountNum + mapAmountNum);
    const convenienceFeeAmountNum = 0;
    const gstAmountNum = round2(baseAmountNum * 0.05);
    const amountNum = round2(baseAmountNum + gstAmountNum);
    if (!Number.isFinite(amountNum) || amountNum < 1) throw new HttpError(400, "Invalid amount");

    const baseAmount = new Prisma.Decimal(baseAmountNum.toFixed(2));
    const convenienceFeeAmount = new Prisma.Decimal("0.00");
    const gstAmount = new Prisma.Decimal(gstAmountNum.toFixed(2));
    const amount = new Prisma.Decimal(amountNum.toFixed(2));

    try {
      const method = (params.paymentMethod ?? "RECEPTION") as "CASH" | "UPI" | "RECEPTION";
      const bookingData: any = {
        userId,
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
        mealPlanCpAmount: new Prisma.Decimal(cpAmountNum.toFixed(2)),
        baseAmount,
        convenienceFeeAmount,
        gstAmount,
        amount,
        status: "CONFIRMED",
      };

      // Only include mealPlanByDate if it has values
      if (mealPlanByDate && mealPlanByDate.length > 0) {
        bookingData.mealPlanByDate = mealPlanByDate;
      }

      const booking = await prisma.booking.create({
        data: {
          ...bookingData,
          payments: {
            create: {
              provider: "OFFLINE",
              status: "PAID",
              currency: "INR",
              amount,
              method,
            },
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, role: true } },
          room: true,
          payments: true,
        },
      });
      return booking;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("BOOKING ERROR >>>", error);
      const msg = error instanceof Error && error.message ? error.message : "Booking failed";
      throw new HttpError(500, msg);
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
