import { Router } from "express";
import { authRouter } from "./authRoutes";
import { bookingRouter } from "./bookingRoutes";
import { roomRouter } from "./roomRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/rooms", roomRouter);
