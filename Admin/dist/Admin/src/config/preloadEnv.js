"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const candidates = [
    path_1.default.resolve(__dirname, "../../../Backend/.env"),
    path_1.default.resolve(__dirname, "../../../Backend/env"),
    path_1.default.resolve(__dirname, "../../../Backend/env (1)"),
    path_1.default.resolve(__dirname, "../../.env"),
    path_1.default.resolve(__dirname, "../../env"),
    path_1.default.resolve(__dirname, "../../env (1)"),
    path_1.default.resolve(__dirname, "../../.env.example"),
    path_1.default.resolve(__dirname, "../../../Backend/.env.example"),
    path_1.default.resolve(__dirname, "../.env.example"),
];
const envPath = candidates.find((p) => fs_1.default.existsSync(p));
if (envPath) {
    dotenv_1.default.config({ path: envPath });
}
else {
    dotenv_1.default.config();
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
