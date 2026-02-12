import { Router } from "express";
import { requireAdmin, requireAuth } from "../../../Backend/src/middlewares/auth";
import { adminDataController } from "../controllers/adminDataController";

export const adminDataRouter = Router();

adminDataRouter.use(requireAuth, requireAdmin);

adminDataRouter.get("/users", adminDataController.users);
adminDataRouter.get("/bookings", adminDataController.bookings);
adminDataRouter.post("/bookings/manual", adminDataController.createManualBooking);
adminDataRouter.delete("/bookings/:id", adminDataController.deleteBooking);
adminDataRouter.get("/payments", adminDataController.payments);
adminDataRouter.get("/rooms", adminDataController.rooms);
