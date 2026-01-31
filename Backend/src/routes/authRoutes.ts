import { Router } from "express";
import { authController } from "../controllers/authController";
import { requireAuth } from "../middlewares/auth";

export const authRouter = Router();

authRouter.post("/signup", authController.signup);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.put("/me", requireAuth, authController.updateProfile);
