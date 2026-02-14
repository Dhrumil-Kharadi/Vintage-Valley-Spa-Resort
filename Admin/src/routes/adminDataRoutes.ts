import { Router } from "express";
import { requireAdmin, requireAdminOrStaff, requireAuth } from "../../../Backend/src/middlewares/auth";
import { adminDataController } from "../controllers/adminDataController";

export const adminDataRouter = Router();

adminDataRouter.use(requireAuth);

adminDataRouter.get("/users", requireAdminOrStaff, adminDataController.users);
adminDataRouter.get("/bookings", requireAdminOrStaff, adminDataController.bookings);
adminDataRouter.post("/bookings/manual", requireAdminOrStaff, adminDataController.createManualBooking);
adminDataRouter.delete("/bookings/:id", requireAdminOrStaff, adminDataController.deleteBooking);
adminDataRouter.get("/payments", requireAdminOrStaff, adminDataController.payments);
adminDataRouter.get("/rooms", requireAdminOrStaff, adminDataController.rooms);
