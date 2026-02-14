"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("../../../Backend/src/prisma/client");
const errorHandler_1 = require("../../../Backend/src/middlewares/errorHandler");
const mailer_1 = require("../../../Backend/src/utils/mailer");
exports.adminAuthService = {
    async loginAdmin(params) {
        const envEmail = process.env.ADMIN_EMAIL;
        const envPassword = process.env.ADMIN_PASSWORD;
        const staffEmail = String(process.env.STAFF_EMAIL ?? "").trim().toLowerCase();
        const loginEmail = String(params.email ?? "").trim().toLowerCase();
        const user = await client_1.prisma.user.findUnique({ where: { email: loginEmail } });
        // STAFF login: identified strictly by STAFF_EMAIL (no STAFF_PASSWORD in env)
        if (staffEmail && loginEmail === staffEmail) {
            if (!user)
                throw new errorHandler_1.HttpError(401, "Invalid credentials");
            const ok = await bcryptjs_1.default.compare(params.password, user.passwordHash);
            if (!ok)
                throw new errorHandler_1.HttpError(401, "Invalid credentials");
            if (String(user.role) !== "STAFF") {
                await client_1.prisma.user.update({ where: { id: user.id }, data: { role: "STAFF" } });
            }
            return { id: user.id, name: user.name, email: user.email, role: "STAFF" };
        }
        // Bootstrap-only: allow ADMIN_PASSWORD login ONLY if the admin user doesn't exist yet.
        if (!user && envEmail && envPassword && params.email === envEmail && params.password === envPassword) {
            const passwordHash = await bcryptjs_1.default.hash(envPassword, 10);
            const created = await client_1.prisma.user.create({
                data: {
                    name: "Admin",
                    email: envEmail,
                    passwordHash,
                    role: "ADMIN",
                },
                select: { id: true, name: true, email: true, role: true },
            });
            return created;
        }
        if (!user)
            throw new errorHandler_1.HttpError(401, "Invalid credentials");
        const ok = await bcryptjs_1.default.compare(params.password, user.passwordHash);
        if (!ok)
            throw new errorHandler_1.HttpError(401, "Invalid credentials");
        if (user.role !== "ADMIN")
            throw new errorHandler_1.HttpError(403, "Not an admin");
        return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
    async createStaffResetNotification() {
        const staffEmail = String(process.env.STAFF_EMAIL ?? "").trim().toLowerCase();
        if (!staffEmail)
            throw new errorHandler_1.HttpError(500, "STAFF_EMAIL is not configured");
        const staffUser = await client_1.prisma.user.findUnique({ where: { email: staffEmail } });
        if (!staffUser)
            throw new errorHandler_1.HttpError(404, "Staff account not found");
        if (String(staffUser.role) !== "STAFF") {
            await client_1.prisma.user.update({ where: { id: staffUser.id }, data: { role: "STAFF" } });
        }
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await client_1.prisma.passwordResetToken.create({
            data: {
                userId: staffUser.id,
                tokenHash,
                expiresAt,
            },
        });
        const clientUrl = String(process.env.CLIENT_URL ?? "http://localhost:8080").trim();
        const resetLink = `${clientUrl.replace(/\/$/, "")}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
        const to = "gauravdesale11@gmail.com";
        const subject = "Staff Password Reset Requested";
        const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
        <div style="border:1px solid #e5e7eb;border-radius:18px;padding:22px;">
          <div style="font-size:18px;font-weight:800;">Staff password reset requested</div>
          <div style="color:#6b7280;margin-top:6px;">A password reset was requested for the staff account: <b>${staffEmail}</b>.</div>
          <div style="color:#6b7280;margin-top:10px;">Use the button below to set a new password for the staff account.</div>
          <div style="margin-top:16px;">
            <a href="${resetLink}" style="display:inline-block;background:#D4AF37;color:#111827;text-decoration:none;font-weight:800;padding:10px 14px;border-radius:999px;">Reset Password</a>
          </div>
          <div style="margin-top:14px;color:#6b7280;font-size:12px;word-break:break-all;">Or open this link: ${resetLink}</div>
          <div style="margin-top:18px;color:#6b7280;font-size:12px;">If you did not request this, you can ignore this email.</div>
        </div>
      </div>
    `;
        await (0, mailer_1.sendMailSafe)({
            to,
            subject,
            html,
            from: process.env.EMAIL_FROM,
            replyTo: process.env.EMAIL_REPLY_TO ?? undefined,
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
            smtpSecure: process.env.SMTP_SECURE,
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS,
        });
    },
    async createAdminResetToken(_params) {
        const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
        if (!adminEmail)
            throw new errorHandler_1.HttpError(500, "ADMIN_EMAIL is not configured");
        const adminUser = await client_1.prisma.user.findUnique({ where: { email: adminEmail } });
        const userId = adminUser?.id
            ? adminUser.id
            : (await client_1.prisma.user.create({
                data: {
                    name: "Admin",
                    email: adminEmail,
                    passwordHash: await bcryptjs_1.default.hash(crypto_1.default.randomBytes(32).toString("hex"), 10),
                    role: "ADMIN",
                },
                select: { id: true },
            })).id;
        await client_1.prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await client_1.prisma.passwordResetToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
        const clientUrl = String(process.env.CLIENT_URL ?? "http://localhost:8080").trim();
        const resetLink = `${clientUrl.replace(/\/$/, "")}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
        const to = "gauravdesale11@gmail.com";
        const subject = "Admin Password Reset";
        const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;">
        <div style="border:1px solid #e5e7eb;border-radius:18px;padding:22px;">
          <div style="font-size:18px;font-weight:800;">Reset Admin Password</div>
          <div style="color:#6b7280;margin-top:6px;">Use the button below to set a new password for the admin account.</div>
          <div style="margin-top:16px;">
            <a href="${resetLink}" style="display:inline-block;background:#D4AF37;color:#111827;text-decoration:none;font-weight:800;padding:10px 14px;border-radius:999px;">Reset Password</a>
          </div>
          <div style="margin-top:14px;color:#6b7280;font-size:12px;word-break:break-all;">Or open this link: ${resetLink}</div>
          <div style="margin-top:18px;color:#6b7280;font-size:12px;">If you did not request this, you can ignore this email.</div>
        </div>
      </div>
    `;
        await (0, mailer_1.sendMailSafe)({
            to,
            subject,
            html,
            from: process.env.EMAIL_FROM,
            replyTo: process.env.EMAIL_REPLY_TO ?? undefined,
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
            smtpSecure: process.env.SMTP_SECURE,
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS,
        });
    },
    async resetAdminPassword(params) {
        const tokenHash = crypto_1.default.createHash("sha256").update(params.token).digest("hex");
        const record = await client_1.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!record)
            throw new errorHandler_1.HttpError(400, "Invalid or expired token");
        if (record.usedAt)
            throw new errorHandler_1.HttpError(400, "Invalid or expired token");
        if (record.expiresAt.getTime() < Date.now())
            throw new errorHandler_1.HttpError(400, "Invalid or expired token");
        const passwordHash = await bcryptjs_1.default.hash(params.newPassword, 10);
        const staffEmail = String(process.env.STAFF_EMAIL ?? "").trim().toLowerCase();
        let roleToSet = "ADMIN";
        if (staffEmail) {
            const u = await client_1.prisma.user.findUnique({ where: { id: record.userId }, select: { email: true } });
            const email = String(u?.email ?? "").trim().toLowerCase();
            if (email && email === staffEmail)
                roleToSet = "STAFF";
        }
        await client_1.prisma.$transaction([
            client_1.prisma.user.update({ where: { id: record.userId }, data: { passwordHash, role: roleToSet } }),
            client_1.prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
        ]);
    },
};
