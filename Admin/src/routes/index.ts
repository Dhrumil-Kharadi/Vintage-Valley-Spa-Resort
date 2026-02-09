import { Router } from "express";
import { adminAuthRouter } from "./adminAuthRoutes";
import { adminDataRouter } from "./adminDataRoutes";
import { adminRoomRouter } from "./adminRoomRoutes";
import { adminPromoRouter } from "./adminPromoRoutes";

export const adminApiRouter = Router();

adminApiRouter.use("/auth", adminAuthRouter);
adminApiRouter.use(adminDataRouter);
adminApiRouter.use("/promos", adminPromoRouter);
adminApiRouter.use("/rooms", adminRoomRouter);
