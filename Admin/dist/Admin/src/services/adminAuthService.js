"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("../../../Backend/src/prisma/client");
const errorHandler_1 = require("../../../Backend/src/middlewares/errorHandler");
exports.adminAuthService = {
    async loginAdmin(params) {
        const envEmail = process.env.ADMIN_EMAIL;
        const envPassword = process.env.ADMIN_PASSWORD;
        if (envEmail && envPassword && params.email === envEmail && params.password === envPassword) {
            const passwordHash = await bcryptjs_1.default.hash(envPassword, 10);
            const user = await client_1.prisma.user.upsert({
                where: { email: envEmail },
                create: {
                    name: "Admin",
                    email: envEmail,
                    passwordHash,
                    role: "ADMIN",
                },
                update: {
                    role: "ADMIN",
                    passwordHash,
                },
                select: { id: true, name: true, email: true, role: true },
            });
            return user;
        }
        const user = await client_1.prisma.user.findUnique({ where: { email: params.email } });
        if (!user)
            throw new errorHandler_1.HttpError(401, "Invalid credentials");
        const ok = await bcryptjs_1.default.compare(params.password, user.passwordHash);
        if (!ok)
            throw new errorHandler_1.HttpError(401, "Invalid credentials");
        if (user.role !== "ADMIN")
            throw new errorHandler_1.HttpError(403, "Not an admin");
        return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
};
