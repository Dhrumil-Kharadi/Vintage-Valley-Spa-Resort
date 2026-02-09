"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("../prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const env_1 = require("../config/env");
exports.authService = {
    async signup(params) {
        const existing = await client_1.prisma.user.findUnique({ where: { email: params.email } });
        if (existing)
            throw new errorHandler_1.HttpError(409, "Email already registered");
        const passwordHash = await bcryptjs_1.default.hash(params.password, 10);
        const user = await client_1.prisma.user.create({
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
    async login(params) {
        const user = await client_1.prisma.user.findUnique({ where: { email: params.email } });
        if (!user)
            throw new errorHandler_1.HttpError(401, "Invalid credentials");
        const ok = await bcryptjs_1.default.compare(params.password, user.passwordHash);
        if (!ok)
            throw new errorHandler_1.HttpError(401, "Invalid credentials");
        return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    },
    async findOrCreateFromGoogle(params) {
        const email = params.email.trim().toLowerCase();
        if (!email)
            throw new errorHandler_1.HttpError(400, "Invalid email");
        const existing = await client_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone, role: existing.role };
        }
        const randomPassword = crypto_1.default.randomBytes(32).toString("hex");
        const passwordHash = await bcryptjs_1.default.hash(randomPassword, 10);
        const user = await client_1.prisma.user.create({
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
    async me(userId) {
        const user = await client_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, phone: true, role: true },
        });
        if (!user)
            throw new errorHandler_1.HttpError(401, "Unauthorized");
        return user;
    },
    async createResetToken(email) {
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return;
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + env_1.env.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);
        await client_1.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });
        return rawToken;
    },
    async resetPassword(params) {
        const tokenHash = crypto_1.default.createHash("sha256").update(params.token).digest("hex");
        const record = await client_1.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!record)
            throw new errorHandler_1.HttpError(400, "Invalid or expired token");
        if (record.usedAt)
            throw new errorHandler_1.HttpError(400, "Invalid or expired token");
        if (record.expiresAt.getTime() < Date.now())
            throw new errorHandler_1.HttpError(400, "Invalid or expired token");
        const passwordHash = await bcryptjs_1.default.hash(params.newPassword, 10);
        await client_1.prisma.$transaction([
            client_1.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
            client_1.prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
        ]);
    },
    async updateProfile(userId, params) {
        const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new errorHandler_1.HttpError(404, "User not found");
        const updateData = {};
        if (params.name !== undefined)
            updateData.name = params.name;
        if (params.phone !== undefined)
            updateData.phone = params.phone;
        if (params.password !== undefined) {
            updateData.passwordHash = await bcryptjs_1.default.hash(params.password, 10);
        }
        const updated = await client_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, phone: true, role: true },
        });
        return updated;
    },
};
