import { z } from "zod";
import { asyncHandler } from "../../../Backend/src/utils/asyncHandler";
import { adminRoomService } from "../services/adminRoomService";
import { AuthedRequest } from "../../../Backend/src/middlewares/auth";

const createRoomSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  pricePerNight: z.coerce.number().int().nonnegative(),
  person: z.coerce.number().int().positive().default(2),
  images: z.array(z.string().min(1)).min(1),
  amenities: z.array(z.string().min(1)).default([]),
});

const updateRoomSchema = createRoomSchema;

const updateRoomPriceSchema = z.object({
  pricePerNight: z.coerce.number().int().nonnegative(),
});

export const adminRoomController = {
  list: asyncHandler(async (_req, res) => {
    const rooms = await adminRoomService.listRooms();
    res.json({ ok: true, data: { rooms } });
  }),

  create: asyncHandler(async (req, res) => {
    const role = String((req as AuthedRequest).user?.role ?? "");
    if (role === "STAFF") {
      return res.status(403).json({ ok: false, error: { message: "Forbidden" } });
    }
    const body = createRoomSchema.parse(req.body);
    const room = await adminRoomService.createRoom(body);

    res.status(201).json({ ok: true, data: { room } });
  }),

  update: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: { message: "Invalid room id" } });
    }

    const role = String((req as AuthedRequest).user?.role ?? "");
    if (role === "STAFF") {
      const body = updateRoomPriceSchema.parse(req.body);
      const room = await adminRoomService.updateRoomPrice(id, body);
      res.json({ ok: true, data: { room } });
      return;
    }

    const body = updateRoomSchema.parse(req.body);
    const room = await adminRoomService.updateRoom(id, body);
    res.json({ ok: true, data: { room } });
  }),

  remove: asyncHandler(async (req, res) => {
    const role = String((req as AuthedRequest).user?.role ?? "");
    if (role === "STAFF") {
      return res.status(403).json({ ok: false, error: { message: "Forbidden" } });
    }
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: { message: "Invalid room id" } });
    }

    await adminRoomService.deleteRoom(id);
    res.json({ ok: true });
  }),
};
