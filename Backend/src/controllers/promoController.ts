import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { promoService } from "../services/promoService";

const validateSchema = z.object({
  code: z.string().min(1),
  baseAmount: z.number(),
});

const createSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.union([z.string(), z.number()]),
  isActive: z.boolean().optional(),
  maxUses: z.union([z.number(), z.string()]).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export const promoController = {
  validate: asyncHandler(async (req, res) => {
    const body = validateSchema.parse(req.body);

    const result = await promoService.validateForBaseAmount({
      code: body.code,
      baseAmount: body.baseAmount,
    });

    res.json({
      ok: true,
      data: {
        promo: {
          code: result.promo.code,
          type: result.promo.type,
          value: String(result.promo.value),
        },
        discountAmount: result.discountAmount,
      },
    });
  }),

  list: asyncHandler(async (_req, res) => {
    const promos = await promoService.listAdmin();
    res.json({ ok: true, data: { promos } });
  }),

  create: asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const promo = await promoService.createAdmin({
      code: body.code,
      type: body.type,
      value: body.value,
      isActive: body.isActive,
      maxUses: body.maxUses,
      startsAt: body.startsAt,
      expiresAt: body.expiresAt,
    });
    res.json({ ok: true, data: { promo } });
  }),

  remove: asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) throw new Error("Invalid id");
    await promoService.removeAdmin({ id });
    res.json({ ok: true });
  }),

  setActive: asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) throw new Error("Invalid id");
    const body = setActiveSchema.parse(req.body);
    const promo = await promoService.setActiveAdmin({ id, isActive: body.isActive });
    res.json({ ok: true, data: { promo } });
  }),
};
