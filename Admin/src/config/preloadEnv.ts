import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const candidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../env"),
  path.resolve(__dirname, "../../env (1)"),
  path.resolve(__dirname, "../../../Backend/.env"),
  path.resolve(__dirname, "../../../Backend/env"),
  path.resolve(__dirname, "../../../Backend/env (1)"),
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
}
