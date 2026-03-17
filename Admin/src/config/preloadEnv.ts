import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const candidates = [
  path.resolve(__dirname, "../../../Backend/.env"),
  path.resolve(__dirname, "../../../Backend/env"),
  path.resolve(__dirname, "../../../Backend/env (1)"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../env"),
  path.resolve(__dirname, "../../env (1)"),
  path.resolve(__dirname, "../../.env.example"),
  path.resolve(__dirname, "../../../Backend/.env.example"),
  path.resolve(__dirname, "../.env.example"),
];

const envPath = candidates.find((p) => fs.existsSync(p));

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

if (String(process.env.NODE_ENV ?? "development").trim().toLowerCase() !== "production") {
  const user = String(process.env.SMTP_USER ?? "").trim();
  const masked = user ? `${user.slice(0, 2)}***${user.slice(-2)}` : "";
  // eslint-disable-next-line no-console
  console.log("ADMIN ENV LOADED >>>", { envPath: envPath ?? "default", smtpUserMasked: masked });
  // Log eZee-specific variables to ensure correct Backend .env is used
  // eslint-disable-next-line no-console
  console.log("ADMIN ENV EZEE >>>", {
    envPath,
    EZEE_BASE_URL: process.env.EZEE_BASE_URL ? "SET" : "MISSING",
    EZEE_HOTEL_CODE: process.env.EZEE_HOTEL_CODE ? "SET" : "MISSING",
    EZEE_API_KEY: process.env.EZEE_API_KEY ? "SET" : "MISSING",
    EZEE_SOURCE_ID: process.env.EZEE_SOURCE_ID ?? "NOT_SET",
    EZEE_PAYMENTTYPEUNKID: process.env.EZEE_PAYMENTTYPEUNKID ?? "NOT_SET",
    EZEE_ALLOW_MISSING_BOOKING_IDS: process.env.EZEE_ALLOW_MISSING_BOOKING_IDS ?? "NOT_SET",
    // Show raw values for debugging
    _raw_EZEE_SOURCE_ID: process.env.EZEE_SOURCE_ID,
    _raw_EZEE_PAYMENTTYPEUNKID: process.env.EZEE_PAYMENTTYPEUNKID,
    _raw_EZEE_ALLOW_MISSING_BOOKING_IDS: process.env.EZEE_ALLOW_MISSING_BOOKING_IDS,
  });
}
