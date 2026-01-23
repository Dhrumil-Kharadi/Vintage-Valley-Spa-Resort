import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { requireAdmin, requireAuth } from "../middlewares/auth";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", adminController.users);
adminRouter.get("/rooms", adminController.rooms);
adminRouter.get("/bookings", adminController.bookings);
adminRouter.get("/payments", adminController.payments);
