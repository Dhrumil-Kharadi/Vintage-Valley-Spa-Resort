"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5050),
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    CLIENT_URL: zod_1.z.string().default("http://localhost:8080"),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    JWT_COOKIE_NAME: zod_1.z.string().default("token"),
    COOKIE_SECURE: zod_1.z.coerce.boolean().default(false),
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    GMAIL_USER: zod_1.z.string().optional(),
    GMAIL_APP_PASSWORD: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().optional(),
    EMAIL_REPLY_TO: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_SECURE: zod_1.z.coerce.boolean().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    RESET_TOKEN_EXPIRES_MINUTES: zod_1.z.coerce.number().default(30),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_REDIRECT_URL: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
