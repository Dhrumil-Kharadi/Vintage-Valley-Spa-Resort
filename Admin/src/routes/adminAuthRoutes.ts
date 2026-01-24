import { Router } from "express";
import { adminAuthController } from "../controllers/adminAuthController";
import { requireAdmin, requireAuth } from "../../../Backend/src/middlewares/auth";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", adminAuthController.login);
adminAuthRouter.post("/logout", adminAuthController.logout);
adminAuthRouter.get("/me", requireAuth, requireAdmin, adminAuthController.me);
