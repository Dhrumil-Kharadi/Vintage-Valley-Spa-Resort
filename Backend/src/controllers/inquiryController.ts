import { z } from "zod";
import { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { inquiryService } from "../services/inquiryService";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  message: z.string().min(1),
});

export const inquiryController: Record<"create" | "list" | "unreadCount" | "markRead", RequestHandler> = {
  create: asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const inquiry = await inquiryService.createInquiry(body);
    res.json({ ok: true, data: { inquiry } });
  }),

  list: asyncHandler(async (_req, res) => {
    const inquiries = await inquiryService.listInquiries();
    res.json({ ok: true, data: { inquiries } });
  }),

  unreadCount: asyncHandler(async (_req, res) => {
    const count = await inquiryService.unreadCount();
    res.json({ ok: true, data: { count } });
  }),

  markRead: asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "").trim();
    const inquiry = await inquiryService.markRead({ id });
    res.json({ ok: true, data: { inquiry } });
  }),
};
