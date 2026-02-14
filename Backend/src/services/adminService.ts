import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";
import { getRazorpayClient } from "../utils/razorpay";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";
import { sendMailSafe } from "../utils/mailer";
import { generateBookingInvoicePdfBuffer } from "../utils/invoicePdf";

export const adminService = {
  async allocateNextBookingNo(tx: any): Promise<number> {
    const existing = await tx.bookingCounter.findUnique({ where: { id: 1 } });
    if (!existing) {
      await tx.bookingCounter.create({ data: { id: 1, nextNumber: 2 } });
      return 1;
    }

    const current = Number(existing.nextNumber ?? 1);
    await tx.bookingCounter.update({ where: { id: 1 }, data: { nextNumber: { increment: 1 } } });
    return current;
  },

  async countBookingsCreatedAfter(params: { since: Date }) {
    const count = await prisma.booking.count({
      where: {
        createdAt: {
          gt: params.since,
        },
      },
    });

    return { newBookings: count };
  },

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
    userPhone?: string;
    staffName: string;
    paymentMethod?: "CASH" | "UPI" | "CARD";
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
    const staffName = String((params as any).staffName ?? "").trim();
    if (!staffName) throw new HttpError(400, "Staff name is required");

    const phone = String(params.userPhone ?? "").trim();
    if (!phone) throw new HttpError(400, "User phone is required");
    if (!userId) {
      const email = String(params.userEmail ?? "").trim().toLowerCase();
      const name = String(params.userName ?? "").trim();
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
              phone,
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
            phone,
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

      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            phone,
          },
        });
      } catch {
        // best-effort
      }
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
      const method = (params.paymentMethod ?? "CASH") as "CASH" | "UPI" | "CARD";
      const bookingData: any = {
        userId,
        roomId: params.roomId,
        staffName,
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

      const booking = await prisma.$transaction(async (tx) => {
        const bookingNo = await adminService.allocateNextBookingNo(tx);
        
        // First, create the booking
        const newBooking = await tx.booking.create({
          data: {
            bookingNo,
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
        });

        // Then fetch the booking with all required relations
        const fullBooking = await tx.booking.findUnique({
          where: { id: newBooking.id },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            room: true,
            payments: true,
          },
        });

        if (!fullBooking) {
          throw new HttpError(500, "Failed to fetch created booking");
        }

        return fullBooking;
      });

      try {
        const emailTo = String(params.userEmail ?? booking.user?.email ?? "").trim();
        if (emailTo) {
          const rooms = Number((booking as any).rooms ?? 1);
          const roomTotal = (booking.room?.pricePerNight ?? 0) * (Number((booking as any).nights ?? nights) ?? 0) * (Number.isFinite(rooms) && rooms > 0 ? rooms : 1);
          const childCharge = 1200 * (Number((booking as any).children ?? params.children) ?? 0) * (Number((booking as any).nights ?? nights) ?? 0);
          const extraAdultCharge = 1500 * (Number((booking as any).extraAdults ?? params.extraAdults) ?? 0) * (Number((booking as any).nights ?? nights) ?? 0);
          const baseAmount = Number((booking as any).baseAmount ?? roomTotal + childCharge + extraAdultCharge);
          const gstAmount = Number((booking as any).gstAmount ?? Math.round(baseAmount * 0.05));
          const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
          const bookingNoForDisplay = Number((booking as any).bookingNo);
          const bookingDisplayId = Number.isFinite(bookingNoForDisplay) && bookingNoForDisplay > 0 ? `VVR-${bookingNoForDisplay}` : booking.id;
          const subject = `Booking Confirmed - ${bookingDisplayId}`;

          const invoiceHtml = `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid #e5e7eb;border-radius:16px;padding:18px 18px 14px;">
                <div>
                  <div style="font-size:18px;font-weight:800;">Vintage Valley</div>
                  <div style="font-size:12px;color:#6b7280;">Invoice / Booking Confirmation</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px;color:#6b7280;">Booking ID</div>
                  <div style="font-size:14px;font-weight:800;">${bookingDisplayId}</div>
                </div>
              </div>

              <div style="margin-top:14px;border:1px solid #e5e7eb;border-radius:16px;padding:18px;">
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
                  <div style="background:#fef3c7;border-radius:999px;padding:8px 12px;font-weight:700;">Status: CONFIRMED</div>
                  <div style="background:#ecfdf5;border-radius:999px;padding:8px 12px;font-weight:700;">Paid: ${fmt((booking as any).amount ?? amount)}</div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div>
                    <div style="font-size:12px;color:#6b7280;">Guest</div>
                    <div style="font-weight:700;">${String(booking.user?.name ?? "Guest")}</div>
                    <div style="font-size:12px;color:#6b7280;">${String(booking.user?.email ?? "")}</div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:#6b7280;">Room</div>
                    <div style="font-weight:700;">${String(booking.room?.title ?? "Room")}</div>
                    <div style="font-size:12px;color:#6b7280;">${fmt(booking.room?.pricePerNight ?? 0)} / night</div>
                  </div>
                </div>

                <div style="border-top:1px dashed #e5e7eb;margin-top:14px;padding-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div>
                    <div style="font-size:12px;color:#6b7280;">Check-in</div>
                    <div style="font-weight:700;">${new Date((booking as any).checkIn).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:#6b7280;">Check-out</div>
                    <div style="font-weight:700;">${new Date((booking as any).checkOut).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:#6b7280;">Nights</div>
                    <div style="font-weight:700;">${Number((booking as any).nights ?? nights)}</div>
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
                        <td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-size:16px;font-weight:900;">${fmt(Number((booking as any).amount ?? amount))}</td>
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
                <h2 style="margin:0 0 8px 0;">Booking Confirmed</h2>
                <div style="color:#6b7280;margin-bottom:16px;">Your booking is confirmed. Your invoice PDF is attached.</div>

                <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
                  <div style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;border-radius:999px;padding:8px 12px;font-weight:800;">Status: CONFIRMED</div>
                </div>

                <div style="border-top:1px dashed #e5e7eb;padding-top:16px;">
                  <div style="font-size:14px;font-weight:800;margin-bottom:10px;">Guest Details</div>
                  <table style="width:100%;border-collapse:collapse;">
                    <tbody>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;width:160px;">Name</td>
                        <td style="padding:6px 0;font-weight:700;">${String(booking.user?.name ?? "Guest")}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Email</td>
                        <td style="padding:6px 0;font-weight:700;">${String(booking.user?.email ?? emailTo)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Phone</td>
                        <td style="padding:6px 0;font-weight:700;">${String(booking.user?.phone ?? "—")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                  <div style="font-size:14px;font-weight:800;margin-bottom:10px;">Booking Summary</div>
                  <table style="width:100%;border-collapse:collapse;">
                    <tbody>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;width:160px;">Room</td>
                        <td style="padding:6px 0;font-weight:700;">${String(booking.room?.title ?? "Room")}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Check-in</td>
                        <td style="padding:6px 0;font-weight:700;">${new Date((booking as any).checkIn).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Check-out</td>
                        <td style="padding:6px 0;font-weight:700;">${new Date((booking as any).checkOut).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Nights</td>
                        <td style="padding:6px 0;font-weight:700;">${Number((booking as any).nights ?? 0)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Guests</td>
                        <td style="padding:6px 0;font-weight:700;">${Number((booking as any).guests ?? 0)} (Adults: ${Number((booking as any).adults ?? 0)}, Children: ${Number((booking as any).children ?? 0)}, Extra Adults: ${Number((booking as any).extraAdults ?? 0)})</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Rooms</td>
                        <td style="padding:6px 0;font-weight:700;">${Number((booking as any).rooms ?? 1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                  <div style="font-size:14px;font-weight:800;margin-bottom:10px;">Payment</div>
                  <div style="display:flex;justify-content:space-between;gap:12px;">
                    <div style="color:#6b7280;">Paid Amount</div>
                    <div style="font-weight:900;">${fmt(Number((booking as any).amount ?? 0))}</div>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:12px;margin-top:8px;">
                    <div style="color:#6b7280;">Method</div>
                    <div style="font-weight:700;">${String((booking as any)?.payments?.[0]?.method ?? "OFFLINE")}</div>
                  </div>
                </div>

                <div style="margin-top:18px;color:#6b7280;font-size:12px;">This is an automated message. For any queries, please reply to this email.</div>
              </div>
            </div>
          `;

          const pdfBuffer = await generateBookingInvoicePdfBuffer(booking);

          const ownerEmail = "vintagevalleyresort@gmail.com";
          const recipients = Array.from(
            new Set(
              [emailTo.trim().toLowerCase(), ownerEmail]
                .map((s) => String(s ?? "").trim())
                .filter(Boolean)
            )
          ).join(",");

          await sendMailSafe({
            to: recipients,
            subject,
            html,
            from: env.EMAIL_FROM,
            replyTo: env.EMAIL_REPLY_TO ?? booking.user?.email,
            smtpHost: env.SMTP_HOST,
            smtpPort: env.SMTP_PORT,
            smtpSecure: env.SMTP_SECURE,
            smtpUser: env.SMTP_USER,
            smtpPass: env.SMTP_PASS,
            attachments: [
              {
                filename: `Invoice-${booking.id}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("ADMIN INVOICE MAIL ERROR >>>", err);
      }

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
