"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const candidates = [
    path_1.default.resolve(__dirname, "../../.env"),
    path_1.default.resolve(__dirname, "../../../Backend/.env"),
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
