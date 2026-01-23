import { Router } from "express";
import { roomController } from "../controllers/roomController";

export const roomRouter = Router();

roomRouter.get("/", roomController.list);
roomRouter.get("/:id", roomController.getById);
