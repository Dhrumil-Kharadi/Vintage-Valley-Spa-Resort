import { asyncHandler } from "../utils/asyncHandler";
import { adminService } from "../services/adminService";

export const adminController = {
  users: asyncHandler(async (_req, res) => {
    const users = await adminService.listUsers();
    res.json({ ok: true, data: { users } });
  }),

  rooms: asyncHandler(async (_req, res) => {
    const rooms = await adminService.listRooms();

    const data = rooms.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      pricePerNight: r.pricePerNight,
      amenities: r.amenities.map((a) => a.name),
      images: r.images.map((i) => i.url),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ ok: true, data: { rooms: data } });
  }),

  bookings: asyncHandler(async (_req, res) => {
    const bookings = await adminService.listBookings();
    res.json({ ok: true, data: { bookings } });
  }),

  payments: asyncHandler(async (_req, res) => {
    const payments = await adminService.listPayments();
    res.json({ ok: true, data: { payments } });
  }),
};
