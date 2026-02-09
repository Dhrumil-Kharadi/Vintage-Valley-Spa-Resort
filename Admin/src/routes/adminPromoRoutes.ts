import { Router } from "express";
import { requireAdmin, requireAuth } from "../../../Backend/src/middlewares/auth";
import { adminPromoController } from "../controllers/adminPromoController";

export const adminPromoRouter = Router();

adminPromoRouter.use(requireAuth, requireAdmin);

adminPromoRouter.get("/", adminPromoController.list);
adminPromoRouter.post("/", adminPromoController.create);
adminPromoRouter.patch("/:id/active", adminPromoController.setActive);
