import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middlewares/errorHandler";
import { roomService } from "../services/roomService";

export const roomController = {
  list: asyncHandler(async (_req, res) => {
    const rooms = await roomService.list();

    const data = rooms.map((room) => {
      const r: any = room as any;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        pricePerNight: r.pricePerNight,
        person: r.person,
        amenities: (r.amenities ?? []).map((a: any) => a.name),
        images: (r.images ?? []).map((i: any) => i.url),
      };
    });

    res.json({ ok: true, data: { rooms: data } });
  }),

  getById: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid room id");

    const room = await roomService.getById(id);
    if (!room) throw new HttpError(404, "Room not found");

    const r: any = room as any;

    res.json({
      ok: true,
      id: r.id,
      title: r.title,
      description: r.description,
      pricePerNight: r.pricePerNight,
      person: r.person,
      amenities: (r.amenities ?? []).map((a: any) => a.name),
      images: (r.images ?? []).map((i: any) => i.url),
    });
  }),
};
