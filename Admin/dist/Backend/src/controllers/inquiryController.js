"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const inquiryService_1 = require("../services/inquiryService");
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional().nullable(),
    message: zod_1.z.string().min(1),
});
exports.inquiryController = {
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = createSchema.parse(req.body);
        const inquiry = await inquiryService_1.inquiryService.createInquiry(body);
        res.json({ ok: true, data: { inquiry } });
    }),
    list: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const inquiries = await inquiryService_1.inquiryService.listInquiries();
        res.json({ ok: true, data: { inquiries } });
    }),
    unreadCount: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const count = await inquiryService_1.inquiryService.unreadCount();
        res.json({ ok: true, data: { count } });
    }),
    markRead: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = String(req.params.id ?? "").trim();
        const inquiry = await inquiryService_1.inquiryService.markRead({ id });
        res.json({ ok: true, data: { inquiry } });
    }),
};
