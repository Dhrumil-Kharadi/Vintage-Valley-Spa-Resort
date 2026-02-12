import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { inquiryController } from "../controllers/inquiryController";
import { requireAdmin, requireAuth } from "../middlewares/auth";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", adminController.users);
adminRouter.get("/rooms", adminController.rooms);
adminRouter.get("/bookings", adminController.bookings);
adminRouter.post("/bookings/manual", adminController.createManualBooking);
adminRouter.delete("/bookings/:id", adminController.deleteBooking);
adminRouter.get("/payments", adminController.payments);

adminRouter.get("/inquiries", inquiryController.list);
adminRouter.get("/inquiries/unread-count", inquiryController.unreadCount);
adminRouter.patch("/inquiries/:id/read", inquiryController.markRead);
