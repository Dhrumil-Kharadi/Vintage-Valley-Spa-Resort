"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const client_1 = require("../prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const razorpay_1 = require("../utils/razorpay");
const client_2 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const mailer_1 = require("../utils/mailer");
const invoicePdf_1 = require("../utils/invoicePdf");
exports.adminService = {
    async listUsers() {
        return client_1.prisma.user.findMany({
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
        return client_1.prisma.room.findMany({
            include: {
                images: { orderBy: { sortOrder: "asc" } },
                amenities: true,
            },
            orderBy: { id: "asc" },
        });
    },
    async listBookings() {
        const bookings = await client_1.prisma.booking.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, role: true } },
                room: true,
                payments: true,
            },
            orderBy: { createdAt: "desc" },
        });
        const razorpay = (0, razorpay_1.getRazorpayClient)();
        if (!razorpay)
            return bookings;
        let updatedCount = 0;
        for (const b of bookings) {
            if (updatedCount >= 10)
                break;
            for (const p of b.payments ?? []) {
                if (updatedCount >= 10)
                    break;
                if (p?.provider !== "RAZORPAY")
                    continue;
                if (p?.status !== "PAID")
                    continue;
                if (p?.method)
                    continue;
                if (!p?.razorpayPaymentId)
                    continue;
                try {
                    const details = await razorpay.payments.fetch(p.razorpayPaymentId);
                    await client_1.prisma.payment.update({
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
                }
                catch {
                    // best-effort
                }
            }
        }
        return bookings;
    },
    async deleteBooking(bookingId) {
        const id = String(bookingId ?? "").trim();
        if (!id)
            throw new errorHandler_1.HttpError(400, "Invalid booking id");
        const existing = await client_1.prisma.booking.findUnique({ where: { id }, select: { id: true } });
        if (!existing)
            throw new errorHandler_1.HttpError(404, "Booking not found");
        await client_1.prisma.booking.delete({ where: { id } });
        return true;
    },
    async createManualBooking(params) {
        let userId = params.userId?.trim() ? String(params.userId).trim() : "";
        if (!userId) {
            const email = String(params.userEmail ?? "").trim().toLowerCase();
            const name = String(params.userName ?? "").trim();
            const phone = String(params.userPhone ?? "").trim();
            if (!email)
                throw new errorHandler_1.HttpError(400, "User email is required");
            if (!name)
                throw new errorHandler_1.HttpError(400, "User name is required");
            const existing = await client_1.prisma.user.findUnique({ where: { email }, select: { id: true } });
            if (existing?.id) {
                userId = existing.id;
                try {
                    await client_1.prisma.user.update({
                        where: { id: userId },
                        data: {
                            name,
                            phone: phone ? phone : null,
                        },
                    });
                }
                catch {
                    // best-effort
                }
            }
            else {
                const randomPassword = crypto_1.default.randomBytes(32).toString("hex");
                const passwordHash = await bcryptjs_1.default.hash(randomPassword, 10);
                const created = await client_1.prisma.user.create({
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
        }
        else {
            const user = await client_1.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
            if (!user)
                throw new errorHandler_1.HttpError(404, "User not found");
        }
        const room = await client_1.prisma.room.findUnique({ where: { id: params.roomId } });
        if (!room)
            throw new errorHandler_1.HttpError(404, "Room not found");
        const checkInDate = new Date(params.checkIn);
        const checkOutDate = new Date(params.checkOut);
        if (!Number.isFinite(checkInDate.getTime()) || !Number.isFinite(checkOutDate.getTime())) {
            throw new errorHandler_1.HttpError(400, "Invalid dates");
        }
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const inDay = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
        if (inDay.getTime() < today.getTime())
            throw new errorHandler_1.HttpError(400, "Check-in date must be today or a future date");
        const ms = checkOutDate.getTime() - checkInDate.getTime();
        if (ms <= 0)
            throw new errorHandler_1.HttpError(400, "Check-out must be after check-in");
        const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
        if (!Number.isFinite(params.guests) || params.guests <= 0)
            throw new errorHandler_1.HttpError(400, "Invalid guests");
        if (!Number.isFinite(params.adults) || params.adults < 0)
            throw new errorHandler_1.HttpError(400, "Invalid adults");
        if (!Number.isFinite(params.children) || params.children < 0)
            throw new errorHandler_1.HttpError(400, "Invalid children");
        if (!Number.isFinite(params.extraAdults) || params.extraAdults < 0)
            throw new errorHandler_1.HttpError(400, "Invalid extra adults");
        const rooms = Number(params.rooms ?? 1);
        if (!Number.isFinite(rooms) || !Number.isInteger(rooms) || rooms < 1 || rooms > 10) {
            throw new errorHandler_1.HttpError(400, "Invalid rooms");
        }
        const round2 = (n) => Math.round(n * 100) / 100;
        const normalizeDateKey = (d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        };
        const dayPlansRaw = Array.isArray(params.mealPlanByDate) ? params.mealPlanByDate : [];
        const planMap = new Map();
        for (const item of dayPlansRaw) {
            if (!item)
                continue;
            const key = String(item.date ?? "").trim();
            const plan = String(item.plan ?? "").trim().toUpperCase();
            if (!key)
                continue;
            if (plan !== "EP" && plan !== "CP" && plan !== "MAP")
                continue;
            planMap.set(key, plan);
        }
        let cpNights = 0;
        let mapNights = 0;
        const mealPlanByDate = [];
        {
            const cursor = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
            for (let i = 0; i < nights; i++) {
                const key = normalizeDateKey(cursor);
                const plan = planMap.get(key) ?? "EP";
                if (plan === "CP")
                    cpNights += 1;
                if (plan === "MAP")
                    mapNights += 1;
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
        if (!Number.isFinite(amountNum) || amountNum < 1)
            throw new errorHandler_1.HttpError(400, "Invalid amount");
        const baseAmount = new client_2.Prisma.Decimal(baseAmountNum.toFixed(2));
        const convenienceFeeAmount = new client_2.Prisma.Decimal("0.00");
        const gstAmount = new client_2.Prisma.Decimal(gstAmountNum.toFixed(2));
        const amount = new client_2.Prisma.Decimal(amountNum.toFixed(2));
        try {
            const method = (params.paymentMethod ?? "RECEPTION");
            const bookingData = {
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
                mealPlanCpAmount: new client_2.Prisma.Decimal(cpAmountNum.toFixed(2)),
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
            const booking = await client_1.prisma.booking.create({
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
            try {
                const emailTo = String(params.userEmail ?? booking.user?.email ?? "").trim();
                if (emailTo) {
                    const rooms = Number(booking.rooms ?? 1);
                    const roomTotal = (booking.room?.pricePerNight ?? 0) * (Number(booking.nights ?? nights) ?? 0) * (Number.isFinite(rooms) && rooms > 0 ? rooms : 1);
                    const childCharge = 1200 * (Number(booking.children ?? params.children) ?? 0) * (Number(booking.nights ?? nights) ?? 0);
                    const extraAdultCharge = 1500 * (Number(booking.extraAdults ?? params.extraAdults) ?? 0) * (Number(booking.nights ?? nights) ?? 0);
                    const baseAmount = Number(booking.baseAmount ?? roomTotal + childCharge + extraAdultCharge);
                    const gstAmount = Number(booking.gstAmount ?? Math.round(baseAmount * 0.05));
                    const fmt = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
                    const subject = `Booking Confirmed - ${booking.id}`;
                    const invoiceHtml = `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid #e5e7eb;border-radius:16px;padding:18px 18px 14px;">
                <div>
                  <div style="font-size:18px;font-weight:800;">Vintage Valley</div>
                  <div style="font-size:12px;color:#6b7280;">Invoice / Booking Confirmation</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:12px;color:#6b7280;">Booking ID</div>
                  <div style="font-size:14px;font-weight:800;">${booking.id}</div>
                </div>
              </div>

              <div style="margin-top:14px;border:1px solid #e5e7eb;border-radius:16px;padding:18px;">
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
                  <div style="background:#fef3c7;border-radius:999px;padding:8px 12px;font-weight:700;">Status: CONFIRMED</div>
                  <div style="background:#ecfdf5;border-radius:999px;padding:8px 12px;font-weight:700;">Paid: ${fmt(booking.amount ?? amount)}</div>
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
                    <div style="font-weight:700;">${new Date(booking.checkIn).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:#6b7280;">Check-out</div>
                    <div style="font-weight:700;">${new Date(booking.checkOut).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:#6b7280;">Nights</div>
                    <div style="font-weight:700;">${Number(booking.nights ?? nights)}</div>
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
                        <td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-size:16px;font-weight:900;">${fmt(Number(booking.amount ?? amount))}</td>
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
                        <td style="padding:6px 0;font-weight:700;">${new Date(booking.checkIn).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Check-out</td>
                        <td style="padding:6px 0;font-weight:700;">${new Date(booking.checkOut).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Nights</td>
                        <td style="padding:6px 0;font-weight:700;">${Number(booking.nights ?? 0)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Guests</td>
                        <td style="padding:6px 0;font-weight:700;">${Number(booking.guests ?? 0)} (Adults: ${Number(booking.adults ?? 0)}, Children: ${Number(booking.children ?? 0)}, Extra Adults: ${Number(booking.extraAdults ?? 0)})</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;">Rooms</td>
                        <td style="padding:6px 0;font-weight:700;">${Number(booking.rooms ?? 1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style="border-top:1px dashed #e5e7eb;padding-top:16px;margin-top:16px;">
                  <div style="font-size:14px;font-weight:800;margin-bottom:10px;">Payment</div>
                  <div style="display:flex;justify-content:space-between;gap:12px;">
                    <div style="color:#6b7280;">Paid Amount</div>
                    <div style="font-weight:900;">${fmt(Number(booking.amount ?? 0))}</div>
                  </div>
                  <div style="display:flex;justify-content:space-between;gap:12px;margin-top:8px;">
                    <div style="color:#6b7280;">Method</div>
                    <div style="font-weight:700;">${String(booking?.payments?.[0]?.method ?? "OFFLINE")}</div>
                  </div>
                </div>

                <div style="margin-top:18px;color:#6b7280;font-size:12px;">This is an automated message. For any queries, please reply to this email.</div>
              </div>
            </div>
          `;
                    const pdfBuffer = await (0, invoicePdf_1.generateBookingInvoicePdfBuffer)(booking);
                    await (0, mailer_1.sendMailSafe)({
                        to: emailTo,
                        subject,
                        html,
                        from: env_1.env.EMAIL_FROM,
                        replyTo: env_1.env.EMAIL_REPLY_TO ?? booking.user?.email,
                        smtpHost: env_1.env.SMTP_HOST,
                        smtpPort: env_1.env.SMTP_PORT,
                        smtpSecure: env_1.env.SMTP_SECURE,
                        smtpUser: env_1.env.SMTP_USER,
                        smtpPass: env_1.env.SMTP_PASS,
                        attachments: [
                            {
                                filename: `Invoice-${booking.id}.pdf`,
                                content: pdfBuffer,
                                contentType: "application/pdf",
                            },
                        ],
                    });
                }
            }
            catch (err) {
                // eslint-disable-next-line no-console
                console.error("ADMIN INVOICE MAIL ERROR >>>", err);
            }
            return booking;
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("BOOKING ERROR >>>", error);
            const msg = error instanceof Error && error.message ? error.message : "Booking failed";
            throw new errorHandler_1.HttpError(500, msg);
        }
    },
    async listPayments() {
        const payments = await client_1.prisma.payment.findMany({
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
        const razorpay = (0, razorpay_1.getRazorpayClient)();
        if (!razorpay)
            return payments;
        let updatedCount = 0;
        for (const p of payments) {
            if (updatedCount >= 10)
                break;
            if (p?.provider !== "RAZORPAY")
                continue;
            if (p?.status !== "PAID")
                continue;
            if (p?.method)
                continue;
            if (!p?.razorpayPaymentId)
                continue;
            try {
                const details = await razorpay.payments.fetch(p.razorpayPaymentId);
                await client_1.prisma.payment.update({
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
            }
            catch {
                // best-effort
            }
        }
        return payments;
    },
};
