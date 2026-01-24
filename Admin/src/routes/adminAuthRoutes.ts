import { Router } from "express";
import { adminAuthController } from "../controllers/adminAuthController";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", adminAuthController.login);
adminAuthRouter.post("/logout", adminAuthController.logout);
