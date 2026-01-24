import { asyncHandler } from "../../../Backend/src/utils/asyncHandler";
import { adminDataService } from "../services/adminDataService";

export const adminDataController = {
  users: asyncHandler(async (_req, res) => {
    const users = await adminDataService.listUsers();
    res.json({ ok: true, data: { users } });
  }),

  bookings: asyncHandler(async (_req, res) => {
    const bookings = await adminDataService.listBookings();
    res.json({ ok: true, data: { bookings } });
  }),

  payments: asyncHandler(async (_req, res) => {
    const payments = await adminDataService.listPayments();
    res.json({ ok: true, data: { payments } });
  }),

  rooms: asyncHandler(async (_req, res) => {
    const rooms = await adminDataService.listRooms();
    res.json({ ok: true, data: { rooms } });
  }),
};
