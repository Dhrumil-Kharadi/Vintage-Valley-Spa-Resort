import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middlewares/errorHandler";
import { prisma } from "../prisma/client";
import { Prisma } from "@prisma/client";

export const promoAdminController = {
  // List promos, optionally filter by scope
  list: asyncHandler(async (req, res) => {
    const { scope } = req.query;
    const where: any = {};
    if (scope === 'GLOBAL_FLAT') {
      where.promoScope = 'GLOBAL_FLAT';
    }
    const promos = await (prisma as any).promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        promoScope: true,
        discountValue: true,
        isGlobalActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ ok: true, promos });
  }),

  // Create a new promo (global flat or code-based)
  create: asyncHandler(async (req, res) => {
    const { promoScope, discountValue, isGlobalActive } = req.body;
    if (promoScope === 'GLOBAL_FLAT') {
      if (!discountValue || Number(discountValue) <= 0) {
        throw new HttpError(400, 'Discount value must be greater than 0');
      }
      // If activating, deactivate all other global flat promos first
      if (isGlobalActive) {
        await (prisma as any).promoCode.updateMany({
          where: { promoScope: 'GLOBAL_FLAT', isGlobalActive: true },
          data: { isGlobalActive: false },
        });
      }
      const promo = await (prisma as any).promoCode.create({
        data: {
          promoScope: 'GLOBAL_FLAT',
          discountValue: new Prisma.Decimal(discountValue),
          isGlobalActive: Boolean(isGlobalActive),
          // Dummy fields for existing schema
          code: `GLOBAL_${Date.now()}`,
          type: 'FLAT',
          value: new Prisma.Decimal(discountValue),
          isActive: true,
        },
        select: {
          id: true,
          promoScope: true,
          discountValue: true,
          isGlobalActive: true,
          createdAt: true,
        },
      });
      res.json({ ok: true, promo });
    } else {
      // Existing code-based promo creation logic can be added here
      throw new HttpError(400, 'Only GLOBAL_FLAT scope supported in this endpoint');
    }
  }),

  // Update a promo (activate/deactivate)
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isGlobalActive } = req.body;
    const existing = await (prisma as any).promoCode.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Promo not found');
    if (existing.promoScope !== 'GLOBAL_FLAT') {
      throw new HttpError(400, 'Only global flat promos can be updated here');
    }
    if (isGlobalActive) {
      // Deactivate all other global flat promos before activating this one
      await (prisma as any).promoCode.updateMany({
        where: { promoScope: 'GLOBAL_FLAT', isGlobalActive: true, id: { not: id } },
        data: { isGlobalActive: false },
      });
    }
    const promo = await (prisma as any).promoCode.update({
      where: { id },
      data: { isGlobalActive: Boolean(isGlobalActive) },
      select: {
        id: true,
        promoScope: true,
        discountValue: true,
        isGlobalActive: true,
        updatedAt: true,
      },
    });
    res.json({ ok: true, promo });
  }),

  // Delete a promo
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await (prisma as any).promoCode.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Promo not found');
    if (existing.promoScope !== 'GLOBAL_FLAT') {
      throw new HttpError(400, 'Only global flat promos can be deleted here');
    }
    await (prisma as any).promoCode.delete({ where: { id } });
    res.json({ ok: true, message: 'Promo deleted' });
  }),
};
