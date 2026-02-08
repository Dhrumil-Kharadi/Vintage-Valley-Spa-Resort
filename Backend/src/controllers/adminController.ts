import { asyncHandler } from "../utils/asyncHandler";
import { adminService } from "../services/adminService";
import { z } from "zod";

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

  createManualBooking: asyncHandler(async (req, res) => {
    const schema = z.object({
      userId: z.string().min(1),
      roomId: z.number().int(),
      checkIn: z.string().min(1),
      checkOut: z.string().min(1),
      checkInTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .optional()
        .nullable(),
      checkOutTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .optional()
        .nullable(),
      rooms: z.number().int().min(1).max(10).optional(),
      guests: z.number().int().min(1),
      adults: z.number().int().min(1),
      children: z.number().int().min(0),
      extraAdults: z.number().int().min(0),
      additionalInformation: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const booking = await adminService.createManualBooking({
      userId: body.userId,
      roomId: body.roomId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      checkInTime: body.checkInTime ?? null,
      checkOutTime: body.checkOutTime ?? null,
      rooms: body.rooms,
      guests: body.guests,
      adults: body.adults,
      children: body.children,
      extraAdults: body.extraAdults,
      additionalInformation: body.additionalInformation ?? null,
    });

    res.json({ ok: true, data: { booking } });
  }),

  payments: asyncHandler(async (_req, res) => {
    const payments = await adminService.listPayments();
    res.json({ ok: true, data: { payments } });
  }),
};
