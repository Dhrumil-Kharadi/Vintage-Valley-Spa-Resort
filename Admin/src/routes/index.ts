import { Router } from "express";
import { requireAdmin, requireAdminOrStaff, requireAuth } from "../../../Backend/src/middlewares/auth";

import { adminAuthRouter } from "./adminAuthRoutes";
import { adminDataRouter } from "./adminDataRoutes";
import { adminRoomRouter } from "./adminRoomRoutes";
import { adminPromoRouter } from "./adminPromoRoutes";

export const adminApiRouter = Router();

// =====================
// PUBLIC ROUTES
// =====================
adminApiRouter.use("/auth", adminAuthRouter);

// =====================
// PROTECTED ROUTES
// =====================
adminApiRouter.use("/", requireAuth, adminDataRouter);
adminApiRouter.use("/promos", requireAuth, requireAdminOrStaff, adminPromoRouter);
adminApiRouter.use("/rooms", requireAuth, requireAdminOrStaff, adminRoomRouter);
