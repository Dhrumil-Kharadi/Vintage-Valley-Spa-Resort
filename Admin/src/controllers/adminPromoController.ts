import { z } from "zod";
import { asyncHandler } from "../../../Backend/src/utils/asyncHandler";
import { adminPromoService } from "../services/adminPromoService";

const createSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.coerce.number(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  maxUses: z.coerce.number().int().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

const setActiveSchema = z.object({
  isActive: z.coerce.boolean(),
});

export const adminPromoController = {
  list: asyncHandler(async (_req, res) => {
    const promos = await adminPromoService.list();
    res.json({ ok: true, data: { promos } });
  }),

  delete: asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) return res.status(400).json({ ok: false, error: { message: "Invalid promo id" } });
    await adminPromoService.delete({ id });
    res.json({ ok: true });
  }),

  create: asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const promo = await adminPromoService.create({
      code: body.code,
      type: body.type,
      value: body.value,
      startsAt: body.startsAt ?? null,
      expiresAt: body.expiresAt ?? null,
      maxUses: body.maxUses ?? null,
      isActive: body.isActive ?? true,
    });
    res.status(201).json({ ok: true, data: { promo } });
  }),

  setActive: asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "");
    if (!id) return res.status(400).json({ ok: false, error: { message: "Invalid promo id" } });

    const body = setActiveSchema.parse(req.body);
    const promo = await adminPromoService.setActive({ id, isActive: body.isActive });
    res.json({ ok: true, data: { promo } });
  }),
};
