import { Router } from "express";
import { promoController } from "../controllers/promoController";
import { requireAdmin, requireAuth } from "../middlewares/auth";

export const promoRouter = Router();

promoRouter.post("/validate", promoController.validate);

promoRouter.get("/", requireAuth, requireAdmin, promoController.list);
promoRouter.post("/", requireAuth, requireAdmin, promoController.create);
promoRouter.delete("/:id", requireAuth, requireAdmin, promoController.remove);
promoRouter.patch("/:id/active", requireAuth, requireAdmin, promoController.setActive);
