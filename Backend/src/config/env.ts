import "dotenv/config";
import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(5050),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  CLIENT_URL: z.string().default("http://localhost:8080"),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_COOKIE_NAME: z.string().default("token"),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_REPLY_TO: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  RESET_TOKEN_EXPIRES_MINUTES: z.coerce.number().default(30),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URL: z.string().optional(),

  EZEE_BASE_URL: z.string().min(1).optional(),
  EZEE_HOTEL_CODE: z.string().min(1).optional(),
  EZEE_API_KEY: z.string().min(1).optional(),

  EZEE_SOURCE_ID: z.string().optional(),
  EZEE_PAYMENTTYPEUNKID: z.string().optional(),

  EZEE_ALLOW_MISSING_BOOKING_IDS: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);
