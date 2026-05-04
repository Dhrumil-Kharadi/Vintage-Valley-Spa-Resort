import { Router } from "express";
import { roomController } from "../controllers/roomController";

export const roomRouter = Router();

roomRouter.get("/", roomController.list);
roomRouter.get("/raw", roomController.listRaw);
roomRouter.get("/prices", roomController.getPrices);
roomRouter.get("/lotus-availability", roomController.lotusAvailability);
roomRouter.get("/:id", roomController.getById);
