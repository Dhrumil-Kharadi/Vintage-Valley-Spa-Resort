"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const client_1 = require("../prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const razorpay_1 = require("../utils/razorpay");
const client_2 = require("@prisma/client");
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
    async createManualBooking(params) {
        const user = await client_1.prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } });
        if (!user)
            throw new errorHandler_1.HttpError(404, "User not found");
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
        if (!Number.isFinite(params.adults) || params.adults <= 0)
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
        const base = room.pricePerNight * nights * rooms;
        const childCharge = 1200 * params.children * nights;
        const extraAdultCharge = 1500 * params.extraAdults * nights;
        const baseAmountNum = round2(base + childCharge + extraAdultCharge);
        const gstAmountNum = round2(baseAmountNum * 0.05);
        const amountNum = round2(baseAmountNum + gstAmountNum);
        if (!Number.isFinite(amountNum) || amountNum < 1)
            throw new errorHandler_1.HttpError(400, "Invalid amount");
        const baseAmount = new client_2.Prisma.Decimal(baseAmountNum.toFixed(2));
        const gstAmount = new client_2.Prisma.Decimal(gstAmountNum.toFixed(2));
        const amount = new client_2.Prisma.Decimal(amountNum.toFixed(2));
        try {
            const booking = await client_1.prisma.booking.create({
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
        }
        catch {
            throw new errorHandler_1.HttpError(500, "Failed to create booking. Please run database migration.");
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
