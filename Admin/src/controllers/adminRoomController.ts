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

export const adminRoomController = {
  create: asyncHandler(async (req, res) => {
    const body = createRoomSchema.parse(req.body);
    const room = await adminRoomService.createRoom(body);

    res.status(201).json({ ok: true, data: { room } });
  }),
};
