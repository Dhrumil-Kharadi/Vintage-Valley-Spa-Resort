import { Router } from "express";
import { bookingController } from "../controllers/bookingController";
import { requireAuth } from "../middlewares/auth";

export const bookingRouter = Router();

bookingRouter.post("/", requireAuth, bookingController.create);
bookingRouter.post("/:id/verify", requireAuth, bookingController.verify);
