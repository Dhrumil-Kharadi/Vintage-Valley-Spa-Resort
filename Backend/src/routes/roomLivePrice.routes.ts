import { Router } from "express";
import { roomLivePriceController } from "../controllers/roomLivePrice.controller";

export const roomLivePriceRouter = Router();

roomLivePriceRouter.get("/", roomLivePriceController.getPrices);
roomLivePriceRouter.post("/sync", roomLivePriceController.syncPrices);
roomLivePriceRouter.get("/database", roomLivePriceController.getDatabasePrices);
roomLivePriceRouter.post("/scheduler/start", roomLivePriceController.startScheduler);
roomLivePriceRouter.post("/scheduler/stop", roomLivePriceController.stopScheduler);
roomLivePriceRouter.get("/scheduler/status", roomLivePriceController.getSchedulerStatus);
