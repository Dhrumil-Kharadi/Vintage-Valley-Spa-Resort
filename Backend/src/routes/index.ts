import { Router } from "express";
import { authRouter } from "./authRoutes";
import { adminRouter } from "./adminRoutes";
import { bookingRouter } from "./bookingRoutes";
import { roomRouter } from "./roomRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/rooms", roomRouter);
