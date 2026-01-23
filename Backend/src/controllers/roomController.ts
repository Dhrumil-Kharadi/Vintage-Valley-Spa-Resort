import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middlewares/errorHandler";
import { roomService } from "../services/roomService";

export const roomController = {
  list: asyncHandler(async (_req, res) => {
    const rooms = await roomService.list();

    const data = rooms.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      pricePerNight: r.pricePerNight,
      amenities: r.amenities.map((a) => a.name),
      images: r.images.map((i) => i.url),
    }));

    res.json({ ok: true, data: { rooms: data } });
  }),

  getById: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid room id");

    const room = await roomService.getById(id);
    if (!room) throw new HttpError(404, "Room not found");

    res.json({
      ok: true,
      id: room.id,
      title: room.title,
      description: room.description,
      pricePerNight: room.pricePerNight,
      amenities: room.amenities.map((a) => a.name),
      images: room.images.map((i) => i.url),
    });
  }),
};
