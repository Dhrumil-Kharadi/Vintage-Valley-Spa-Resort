import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";
import { env } from "../config/env";

export const authService = {
  async signup(params: { name: string; email: string; password: string; phone?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: params.email } });
    if (existing) throw new HttpError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(params.password, 10);

    const user = await prisma.user.create({
      data: {
        name: params.name,
        email: params.email,
        phone: params.phone,
        passwordHash,
        role: "USER",
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return user;
  },

  async login(params: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: params.email } });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
  },

  async findOrCreateFromGoogle(params: { email: string; name: string }) {
    const email = params.email.trim().toLowerCase();
    if (!email) throw new HttpError(400, "Invalid email");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone, role: existing.role };
    }

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: params.name?.trim() ? params.name.trim() : "Guest",
        email,
        passwordHash,
        role: "USER",
      },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return user;
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (!user) throw new HttpError(401, "Unauthorized");
    return user;
  },

  async createResetToken(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const expiresAt = new Date(Date.now() + env.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return rawToken;
  },

  async resetPassword(params: { token: string; newPassword: string }) {
    const tokenHash = crypto.createHash("sha256").update(params.token).digest("hex");

    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record) throw new HttpError(400, "Invalid or expired token");
    if (record.usedAt) throw new HttpError(400, "Invalid or expired token");
    if (record.expiresAt.getTime() < Date.now()) throw new HttpError(400, "Invalid or expired token");

    const passwordHash = await bcrypt.hash(params.newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
    ]);
  },

  async updateProfile(userId: string, params: { name?: string; phone?: string; password?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "User not found");

    const updateData: any = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.phone !== undefined) updateData.phone = params.phone;
    if (params.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(params.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return updated;
  },
};
