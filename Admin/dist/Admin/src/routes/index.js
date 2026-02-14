"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminApiRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../../Backend/src/middlewares/auth");
const adminAuthRoutes_1 = require("./adminAuthRoutes");
const adminDataRoutes_1 = require("./adminDataRoutes");
const adminRoomRoutes_1 = require("./adminRoomRoutes");
const adminPromoRoutes_1 = require("./adminPromoRoutes");
exports.adminApiRouter = (0, express_1.Router)();
// =====================
// PUBLIC ROUTES
// =====================
exports.adminApiRouter.use("/auth", adminAuthRoutes_1.adminAuthRouter);
// =====================
// PROTECTED ROUTES
// =====================
exports.adminApiRouter.use("/", auth_1.requireAuth, auth_1.requireAdmin, adminDataRoutes_1.adminDataRouter);
exports.adminApiRouter.use("/promos", auth_1.requireAuth, auth_1.requireAdmin, adminPromoRoutes_1.adminPromoRouter);
exports.adminApiRouter.use("/rooms", auth_1.requireAuth, auth_1.requireAdmin, adminRoomRoutes_1.adminRoomRouter);
