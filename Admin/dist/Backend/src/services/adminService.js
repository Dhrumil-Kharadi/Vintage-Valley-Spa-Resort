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
