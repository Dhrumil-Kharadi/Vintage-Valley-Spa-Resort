import { z } from "zod";
import { asyncHandler } from "../../../Backend/src/utils/asyncHandler";
import { adminRoomService } from "../services/adminRoomService";

const createRoomSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  pricePerNight: z.coerce.number().int().nonnegative(),
  images: z.array(z.string().min(1)).min(1),
  amenities: z.array(z.string().min(1)).default([]),
});

const updateRoomSchema = createRoomSchema;

export const adminRoomController = {
  list: asyncHandler(async (_req, res) => {
    const rooms = await adminRoomService.listRooms();
    res.json({ ok: true, data: { rooms } });
  }),

  create: asyncHandler(async (req, res) => {
    const body = createRoomSchema.parse(req.body);
    const room = await adminRoomService.createRoom(body);

    res.status(201).json({ ok: true, data: { room } });
  }),

  update: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: { message: "Invalid room id" } });
    }

    const body = updateRoomSchema.parse(req.body);
    const room = await adminRoomService.updateRoom(id, body);
    res.json({ ok: true, data: { room } });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: { message: "Invalid room id" } });
    }

    await adminRoomService.deleteRoom(id);
    res.json({ ok: true });
  }),
};
