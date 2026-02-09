import { Router } from "express";
import { promoController } from "../controllers/promoController";

export const promoRouter = Router();

promoRouter.post("/validate", promoController.validate);
