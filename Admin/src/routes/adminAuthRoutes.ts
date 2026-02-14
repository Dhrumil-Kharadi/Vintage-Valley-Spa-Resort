import { Router } from "express";
import { adminAuthController } from "../controllers/adminAuthController";
import { requireAdminOrStaff, requireAuth } from "../../../Backend/src/middlewares/auth";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", adminAuthController.login);
adminAuthRouter.post("/forgot-password", adminAuthController.forgotPassword);
adminAuthRouter.post("/reset-password", adminAuthController.resetPassword);
adminAuthRouter.post("/logout", adminAuthController.logout);
adminAuthRouter.get("/me", requireAuth, requireAdminOrStaff, adminAuthController.me);
