import { Router } from "express";
import { requireAdminOrStaff, requireAuth } from "../../../Backend/src/middlewares/auth";
import { adminPromoController } from "../controllers/adminPromoController";

export const adminPromoRouter = Router();

adminPromoRouter.use(requireAuth, requireAdminOrStaff);

adminPromoRouter.get("/", adminPromoController.list);
adminPromoRouter.post("/", adminPromoController.create);
adminPromoRouter.delete("/:id", adminPromoController.delete);
adminPromoRouter.patch("/:id/active", adminPromoController.setActive);
