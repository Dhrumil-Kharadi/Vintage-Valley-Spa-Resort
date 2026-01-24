import { Router } from "express";
import { adminAuthRouter } from "./adminAuthRoutes";
import { adminDataRouter } from "./adminDataRoutes";
import { adminRoomRouter } from "./adminRoomRoutes";

export const adminApiRouter = Router();

adminApiRouter.use("/auth", adminAuthRouter);
adminApiRouter.use(adminDataRouter);
adminApiRouter.use("/rooms", adminRoomRouter);
