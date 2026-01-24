import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const candidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../Backend/.env"),
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
