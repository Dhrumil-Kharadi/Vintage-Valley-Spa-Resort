import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";

export const inquiryService = {
  async createInquiry(params: {
    name: string;
    email: string;
    phone?: string | null;
    message: string;
  }) {
    const name = String(params.name ?? "").trim();
    const email = String(params.email ?? "").trim();
    const phone = params.phone ? String(params.phone).trim() : null;
    const message = String(params.message ?? "").trim();

    if (!name) throw new HttpError(400, "Name is required");
    if (!email) throw new HttpError(400, "Email is required");
    if (!message) throw new HttpError(400, "Message is required");

    const inquiry = await prisma.inquiry.create({
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
    return prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async unreadCount() {
    return prisma.inquiry.count({ where: { status: "UNREAD" } });
  },

  async markRead(params: { id: string }) {
    const inquiry = await prisma.inquiry.findUnique({ where: { id: params.id } });
    if (!inquiry) throw new HttpError(404, "Inquiry not found");

    if (inquiry.status === "READ") return inquiry;

    return prisma.inquiry.update({
      where: { id: params.id },
      data: { status: "READ" },
    });
  },
};
