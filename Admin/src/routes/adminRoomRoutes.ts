import { Router } from "express";
import { requireAdminOrStaff, requireAuth } from "../../../Backend/src/middlewares/auth";
import { adminRoomController } from "../controllers/adminRoomController";

export const adminRoomRouter = Router();

adminRoomRouter.use(requireAuth, requireAdminOrStaff);

adminRoomRouter.get("/", adminRoomController.list);
adminRoomRouter.post("/", adminRoomController.create);
adminRoomRouter.put("/:id", adminRoomController.update);
adminRoomRouter.delete("/:id", adminRoomController.remove);
