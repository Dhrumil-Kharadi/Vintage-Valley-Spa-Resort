import { prisma } from "../prisma/client";
import { getRazorpayClient } from "../utils/razorpay";

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
