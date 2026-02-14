import { asyncHandler } from "../utils/asyncHandler";
import { adminService } from "../services/adminService";
import { z } from "zod";

export const adminController: Record<"users" | "rooms" | "bookings" | "newBookingsCount" | "deleteBooking" | "createManualBooking" | "payments", any> = {
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

  newBookingsCount: asyncHandler(async (req, res) => {
    const schema = z.object({ lastLogoutTime: z.string().optional().nullable() });
    const body = schema.parse(req.body ?? {});

    const raw = String(body.lastLogoutTime ?? "").trim();
    const since = raw ? new Date(raw) : new Date(0);
    if (!Number.isFinite(since.getTime())) {
      return res.status(400).json({ ok: false, error: { message: "Invalid lastLogoutTime" } });
    }

    const result = await adminService.countBookingsCreatedAfter({ since });
    res.json({ ok: true, data: result });
  }),

  deleteBooking: asyncHandler(async (req, res) => {
    const schema = z.object({ id: z.string().min(1) });
    const { id } = schema.parse(req.params);
    await adminService.deleteBooking(id);
    res.json({ ok: true });
  }),

  createManualBooking: asyncHandler(async (req, res) => {
    const schema = z.object({
      paymentMethod: z.enum(["CASH", "UPI", "CARD"]).optional(),
      staffName: z.string().min(1),
      userId: z.string().min(1).optional(),
      userName: z.string().min(1).optional(),
      userEmail: z.string().email().optional(),
      userPhone: z.string().min(1),
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
      staffName: body.staffName,
      userId: body.userId,
      userName: body.userName,
      userEmail: body.userEmail,
      userPhone: body.userPhone,
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
    const payments = await adminService.listPayments();
    res.json({ ok: true, data: { payments } });
  }),
};
