"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const routes_1 = require("./routes");
const createServer = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.CLIENT_URL,
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    // ✅ ADD HERE
    app.get("/", (_req, res) => {
        res.json({ message: "Vintage Backend Running 🚀" });
    });
    app.get("/api/health", (_req, res) => {
        res.json({ ok: true });
    });
    app.use("/api", routes_1.apiRouter);
    app.use(notFoundHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createServer = createServer;
