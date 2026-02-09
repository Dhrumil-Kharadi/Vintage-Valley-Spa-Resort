"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryService = void 0;
const client_1 = require("../prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.inquiryService = {
    async createInquiry(params) {
        const name = String(params.name ?? "").trim();
        const email = String(params.email ?? "").trim();
        const phone = params.phone ? String(params.phone).trim() : null;
        const message = String(params.message ?? "").trim();
        if (!name)
            throw new errorHandler_1.HttpError(400, "Name is required");
        if (!email)
            throw new errorHandler_1.HttpError(400, "Email is required");
        if (!message)
            throw new errorHandler_1.HttpError(400, "Message is required");
        const inquiry = await client_1.prisma.inquiry.create({
            data: {
                name,
                email,
                phone,
                message,
                status: "UNREAD",
            },
        });
        return inquiry;
    },
    async listInquiries() {
        return client_1.prisma.inquiry.findMany({
            orderBy: { createdAt: "desc" },
        });
    },
    async unreadCount() {
        return client_1.prisma.inquiry.count({ where: { status: "UNREAD" } });
    },
    async markRead(params) {
        const inquiry = await client_1.prisma.inquiry.findUnique({ where: { id: params.id } });
        if (!inquiry)
            throw new errorHandler_1.HttpError(404, "Inquiry not found");
        if (inquiry.status === "READ")
            return inquiry;
        return client_1.prisma.inquiry.update({
            where: { id: params.id },
            data: { status: "READ" },
        });
    },
};
