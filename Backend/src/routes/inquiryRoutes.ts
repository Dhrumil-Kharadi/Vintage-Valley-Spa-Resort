import { Router } from "express";
import { inquiryController } from "../controllers/inquiryController";

export const inquiryRouter = Router();

inquiryRouter.post("/", inquiryController.create);
