import { Router } from "express";
import { promoController } from "../controllers/promoController";
import { requireAdminOrStaff, requireAuth } from "../middlewares/auth";

export const promoRouter = Router();

promoRouter.post("/validate", promoController.validate);

promoRouter.get("/", requireAuth, requireAdminOrStaff, promoController.list);
promoRouter.post("/", requireAuth, requireAdminOrStaff, promoController.create);
promoRouter.delete("/:id", requireAuth, requireAdminOrStaff, promoController.remove);
promoRouter.patch("/:id/active", requireAuth, requireAdminOrStaff, promoController.setActive);
