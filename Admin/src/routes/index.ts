import { Router } from "express";
import { adminAuthRouter } from "./adminAuthRoutes";
import { adminRoomRouter } from "./adminRoomRoutes";

export const adminApiRouter = Router();

adminApiRouter.use("/auth", adminAuthRouter);
adminApiRouter.use("/rooms", adminRoomRouter);
