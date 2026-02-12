import { asyncHandler } from "../../../Backend/src/utils/asyncHandler";
import { adminDataService } from "../services/adminDataService";
import { adminService } from "../../../Backend/src/services/adminService";
import { z } from "zod";

export const adminDataController = {
  users: asyncHandler(async (_req, res) => {
    const users = await adminDataService.listUsers();
    res.json({ ok: true, data: { users } });
  }),

  bookings: asyncHandler(async (_req, res) => {
    const bookings = await adminDataService.listBookings();
    res.json({ ok: true, data: { bookings } });
  }),

  deleteBooking: asyncHandler(async (req, res) => {
    const schema = z.object({ id: z.string().min(1) });
    const { id } = schema.parse(req.params);
    await adminService.deleteBooking(id);
    res.json({ ok: true });
  }),

  createManualBooking: asyncHandler(async (req, res) => {
    const schema = z.object({
      paymentMethod: z.enum(["CASH", "UPI", "RECEPTION"]).optional(),
      userId: z.string().min(1).optional(),
      userName: z.string().min(1).optional(),
      userEmail: z.string().email().optional(),
      userPhone: z.string().optional().nullable(),
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
      adults: z.number().int().min(0),
      children: z.number().int().min(0),
      extraAdults: z.number().int().min(0),
      additionalInformation: z.string().nullable().optional(),
      mealPlanByDate: z
        .array(z.object({ date: z.string().min(1), plan: z.enum(["EP", "CP", "MAP"]) }))
        .optional(),
    });

    const body = schema.parse(req.body);
    if (!body.userId && (!body.userEmail || !body.userName)) {
      return res.status(400).json({ ok: false, error: { message: "User name and email are required" } });
    }

    const booking = await adminService.createManualBooking({
      paymentMethod: body.paymentMethod,
      userId: body.userId,
      userName: body.userName,
      userEmail: body.userEmail,
      userPhone: body.userPhone ?? null,
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
      mealPlanByDate: body.mealPlanByDate,
    });

    res.json({ ok: true, data: { booking } });
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
