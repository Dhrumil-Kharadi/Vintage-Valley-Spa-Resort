import { Router } from "express";
import { authRouter } from "./authRoutes";
import { adminRouter } from "./adminRoutes";
import { bookingRouter } from "./bookingRoutes";
import { inquiryRouter } from "./inquiryRoutes";
import { roomRouter } from "./roomRoutes";
import { promoRouter } from "./promoRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/inquiries", inquiryRouter);
apiRouter.use("/promos", promoRouter);
apiRouter.use("/rooms", roomRouter);
