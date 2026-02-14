import { Router } from "express";
import { bookingController } from "../controllers/bookingController";
import { requireAuth } from "../middlewares/auth";

export const bookingRouter = Router();

bookingRouter.get("/", requireAuth, bookingController.me);
bookingRouter.get("/me", requireAuth, bookingController.me);
bookingRouter.get("/total-count", requireAuth, bookingController.totalCount);
bookingRouter.post("/", requireAuth, bookingController.create);
bookingRouter.post("/:id/verify", requireAuth, bookingController.verify);
bookingRouter.delete("/:id", requireAuth, bookingController.deletePending);
bookingRouter.get("/:id/invoice", requireAuth, bookingController.invoice);
