import { Router } from "express";
import { requireAdmin, requireAuth } from "../../../Backend/src/middlewares/auth";
import { adminRoomController } from "../controllers/adminRoomController";

export const adminRoomRouter = Router();

adminRoomRouter.use(requireAuth, requireAdmin);

adminRoomRouter.post("/", adminRoomController.create);
