import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { HttpError } from "../middlewares/errorHandler";
import { getRazorpayClient } from "../utils/razorpay";
import { promoService } from "./promoService";
import { sendMailSafe } from "../utils/mailer";

export const bookingService = {
  async createBooking(params: {
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
    promoCode?: string | null;
    mealPlanByDate?: Array<{ date: string; plan: "EP" | "CP" | "MAP" }> | null;
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
    const originalBaseAmountNum = round2(base + childCharge + extraAdultCharge + cpAmountNum + mapAmountNum);

    let promoToAttach: { id: string; code: string } | null = null;
    let discountAmountNum = 0;
    if (params.promoCode && String(params.promoCode).trim()) {
      const validated = await promoService.validateForBaseAmount({
        code: String(params.promoCode),
        baseAmount: originalBaseAmountNum,
      });
      promoToAttach = { id: validated.promo.id, code: validated.promo.code };
      discountAmountNum = round2(validated.discountAmount);
    }

    const discountedBaseAmountNum = round2(Math.max(0, originalBaseAmountNum - discountAmountNum));
    const convenienceFeeAmountNum = round2(discountedBaseAmountNum * 0.02);
    const gstAmountNum = round2(discountedBaseAmountNum * 0.05);
    const amountNum = round2(discountedBaseAmountNum + convenienceFeeAmountNum + gstAmountNum);

    const amountPaise = Math.round(amountNum * 100);
    if (!Number.isFinite(amountNum) || amountNum < 1 || amountPaise < 100) {
      throw new HttpError(400, "Invalid amount");
    }

    const baseAmount = new Prisma.Decimal(discountedBaseAmountNum.toFixed(2));
    const mealPlanCpAmount = new Prisma.Decimal(cpAmountNum.toFixed(2));
    const convenienceFeeAmount = new Prisma.Decimal(convenienceFeeAmountNum.toFixed(2));
    const gstAmount = new Prisma.Decimal(gstAmountNum.toFixed(2));
    const amount = new Prisma.Decimal(amountNum.toFixed(2));
    const discountAmount = new Prisma.Decimal(round2(discountAmountNum).toFixed(2));

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
        try {
          await (prisma.booking as any).update({
            where: { id: existing.id },
            data: {
              checkInTime: params.checkInTime ?? null,
              checkOutTime: params.checkOutTime ?? null,
              rooms,
              nights,
              promoCodeId: promoToAttach?.id ?? null,
              promoCode: promoToAttach?.code ?? null,
              discountAmount,
              mealPlanByDate,
              mealPlanCpAmount,
              baseAmount,
              convenienceFeeAmount,
              gstAmount,
              amount,
            },
          });
        } catch {
          // best-effort
        }

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
        booking = await prisma.$transaction(async (tx) => {
          const updated = await (tx.booking as any).update({
            where: { id: existing.id },
            data: {
              guests: params.guests,
              adults: params.adults,
              children: params.children,
              extraAdults: params.extraAdults,
              additionalInformation: params.additionalInformation ?? null,
              nights,
              checkInTime: params.checkInTime ?? null,
              checkOutTime: params.checkOutTime ?? null,
              rooms,
              promoCodeId: promoToAttach?.id ?? null,
              promoCode: promoToAttach?.code ?? null,
              discountAmount,
              mealPlanByDate,
              mealPlanCpAmount,
              baseAmount,
              convenienceFeeAmount,
              gstAmount,
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

          if (promoToAttach?.id) {
            await (tx as any).promoCode.update({
              where: { id: promoToAttach.id },
              data: { usedCount: { increment: 1 } },
            });
          }

          return updated;
        });
      } else {
        booking = await prisma.$transaction(async (tx) => {
          const created = await (tx.booking as any).create({
            data: {
              userId: params.userId,
              roomId: params.roomId,
              promoCodeId: promoToAttach?.id ?? null,
              promoCode: promoToAttach?.code ?? null,
              discountAmount,
              mealPlanByDate,
              mealPlanCpAmount,
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

          if (promoToAttach?.id) {
            await (tx as any).promoCode.update({
              where: { id: promoToAttach.id },
              data: { usedCount: { increment: 1 } },
            });
          }

          return created;
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("BOOKING ERROR >>>", error);
      const msg = error instanceof Error && error.message ? error.message : "Booking failed";
      throw new HttpError(500, msg);
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
          payments: true,
        },
      });

      if (fullBooking?.user?.email) {
        const rooms = Number(fullBooking.rooms ?? 1);
        const roomTotal = (fullBooking.room?.pricePerNight ?? 0) * (fullBooking.nights ?? 0) * (Number.isFinite(rooms) && rooms > 0 ? rooms : 1);
        const childCharge = 1200 * (fullBooking.children ?? 0) * (fullBooking.nights ?? 0);
        const extraAdultCharge = 1500 * (fullBooking.extraAdults ?? 0) * (fullBooking.nights ?? 0);
        const baseAmount = Number(fullBooking.baseAmount ?? roomTotal + childCharge + extraAdultCharge);
        const gstAmount = Number(fullBooking.gstAmount ?? Math.round(baseAmount * 0.05));
        const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
        const subject = `Payment Successful • Booking Confirmed - ${fullBooking.id}`;

        const paidAmount = Array.isArray(fullBooking.payments)
          ? fullBooking.payments
              .filter((p: any) => p?.status === "PAID")
              .reduce((sum: number, p: any) => sum + Number(p?.amount ?? 0), 0)
          : 0;

        const invoiceHtml = `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid #e5e7eb;border-radius:16px;padding:18px 18px 14px;">
              <div>
                <div style="font-size:18px;font-weight:800;">Vintage Valley</div>
                <div style="font-size:12px;color:#6b7280;">Invoice / Booking Confirmation</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px;color:#6b7280;">Booking ID</div>
                <div style="font-size:14px;font-weight:800;">${fullBooking.id}</div>
              </div>
            </div>

            <div style="margin-top:14px;border:1px solid #e5e7eb;border-radius:16px;padding:18px;">
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
                <div style="background:#fef3c7;border-radius:999px;padding:8px 12px;font-weight:700;">Status: CONFIRMED</div>
                <div style="background:#ecfdf5;border-radius:999px;padding:8px 12px;font-weight:700;">Paid: ${fmt(paidAmount || fullBooking.amount)}</div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <div style="font-size:12px;color:#6b7280;">Guest</div>
                  <div style="font-weight:700;">${String(fullBooking.user?.name ?? "Guest")}</div>
                  <div style="font-size:12px;color:#6b7280;">${String(fullBooking.user?.email ?? "")}</div>
                </div>
                <div>
                  <div style="font-size:12px;color:#6b7280;">Room</div>
                  <div style="font-weight:700;">${String(fullBooking.room?.title ?? "Room")}</div>
                  <div style="font-size:12px;color:#6b7280;">${fmt(fullBooking.room?.pricePerNight ?? 0)} / night</div>
                </div>
              </div>

              <div style="border-top:1px dashed #e5e7eb;margin-top:14px;padding-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <div style="font-size:12px;color:#6b7280;">Check-in</div>
                  <div style="font-weight:700;">${new Date(fullBooking.checkIn).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style="font-size:12px;color:#6b7280;">Check-out</div>
                  <div style="font-weight:700;">${new Date(fullBooking.checkOut).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style="font-size:12px;color:#6b7280;">Nights</div>
                  <div style="font-weight:700;">${Number(fullBooking.nights ?? 0)}</div>
                </div>
                <div>
                  <div style="font-size:12px;color:#6b7280;">Rooms</div>
                  <div style="font-weight:700;">${Number.isFinite(rooms) && rooms > 0 ? rooms : 1}</div>
                </div>
              </div>

              <div style="border-top:1px dashed #e5e7eb;margin-top:14px;padding-top:14px;">
                <div style="font-weight:800;margin-bottom:8px;">Price Breakdown</div>
                <table style="width:100%;border-collapse:collapse;">
                  <tbody>
                    <tr>
                      <td style="padding:6px 0;color:#374151;">Room total</td>
                      <td style="padding:6px 0;text-align:right;font-weight:700;">${fmt(roomTotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#374151;">Children charge</td>
                      <td style="padding:6px 0;text-align:right;font-weight:700;">${fmt(childCharge)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#374151;">Extra adults charge</td>
                      <td style="padding:6px 0;text-align:right;font-weight:700;">${fmt(extraAdultCharge)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#374151;">Base amount</td>
                      <td style="padding:6px 0;text-align:right;font-weight:700;">${fmt(baseAmount)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#374151;">GST (5%)</td>
                      <td style="padding:6px 0;text-align:right;font-weight:700;">${fmt(gstAmount)}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;border-top:1px solid #e5e7eb;font-size:16px;font-weight:900;">Total</td>
                      <td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-size:16px;font-weight:900;">${fmt(fullBooking.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="margin-top:12px;color:#6b7280;font-size:12px;">This invoice is generated automatically. Please keep it for your records.</div>
            </div>
          </div>
        `;

        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:0 auto;padding:24px;background:#ffffff;color:#1f2937;">
            <div style="border:1px solid #e5e7eb;border-radius:16px;padding:20px;">
              <h2 style="margin:0 0 8px 0;">Payment Successful</h2>
              <div style="color:#6b7280;margin-bottom:16px;">Thank you, ${fullBooking.user.name}. Your booking is confirmed. Your invoice is attached.</div>

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
                <div>Rooms: <strong>${rooms}</strong></div>
              </div>

              <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                <h3 style="margin:0 0 8px 0;">Price Breakdown</h3>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>Room total</span><strong>${fmt(roomTotal)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>Children charge</span><strong>${fmt(childCharge)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>Extra adults charge</span><strong>${fmt(extraAdultCharge)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>Base amount</span><strong>${fmt(baseAmount)}</strong></div>
                <div style="display:flex;justify-content:space-between;gap:12px;"><span>GST (5%)</span><strong>${fmt(gstAmount)}</strong></div>
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
          replyTo: fullBooking.user.email,
          gmailUser: env.GMAIL_USER,
          gmailAppPassword: env.GMAIL_APP_PASSWORD,
          smtpHost: env.SMTP_HOST,
          smtpPort: env.SMTP_PORT,
          smtpSecure: env.SMTP_SECURE,
          smtpUser: env.SMTP_USER,
          smtpPass: env.SMTP_PASS,
          attachments: [
            {
              filename: `Invoice-${fullBooking.id}.html`,
              content: invoiceHtml,
              contentType: "text/html",
            },
          ],
        });
      }
    } catch {
      // ignore email failures
    }

    return updated;
  },

  async getUserInvoiceData(params: { userId: string; bookingId: string }) {
    const booking: any = await (prisma.booking as any).findUnique({
      where: { id: params.bookingId },
      include: {
        room: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        payments: true,
      },
    });

    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.userId !== params.userId) throw new HttpError(403, "Forbidden");
    if (booking.status !== "CONFIRMED") throw new HttpError(400, "Invoice available only for confirmed bookings");

    return booking;
  },
};
