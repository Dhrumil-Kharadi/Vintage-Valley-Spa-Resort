import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";

const round2 = (n: number) => Math.round(n * 100) / 100;

const normalizeCode = (code: string) => code.trim().toUpperCase();

export const promoService = {
  async listAdmin() {
    const promos: any[] = await (prisma as any).promoCode.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    return promos.map((p: any) => ({
      id: String(p.id),
      code: String(p.code),
      type: String(p.type),
      value: String(p.value),
      isActive: Boolean(p.isActive),
      usedCount: Number(p.usedCount ?? 0),
      maxUses: p.maxUses == null ? null : Number(p.maxUses),
      startsAt: p.startsAt ? new Date(p.startsAt).toISOString() : null,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : null,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));
  },

  async createAdmin(params: {
    code: string;
    type: "PERCENT" | "FLAT";
    value: string | number;
    isActive?: boolean;
    maxUses?: string | number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
  }) {
    const code = normalizeCode(params.code);
    if (!code) throw new HttpError(400, "Promo code is required");

    const valueNum = Number(params.value);
    if (!Number.isFinite(valueNum) || valueNum <= 0) throw new HttpError(400, "Invalid promo value");

    const maxUses = params.maxUses == null || String(params.maxUses).trim() === "" ? null : Number(params.maxUses);
    if (maxUses != null && (!Number.isFinite(maxUses) || maxUses < 0)) throw new HttpError(400, "Invalid maxUses");

    const startsAt = params.startsAt ? new Date(params.startsAt) : null;
    if (params.startsAt && Number.isNaN(startsAt?.getTime())) throw new HttpError(400, "Invalid startsAt");

    const expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
    if (params.expiresAt && Number.isNaN(expiresAt?.getTime())) throw new HttpError(400, "Invalid expiresAt");

    try {
      const created: any = await (prisma as any).promoCode.create({
        data: {
          code,
          type: params.type,
          value: new Prisma.Decimal(String(valueNum)),
          isActive: params.isActive ?? true,
          maxUses,
          startsAt,
          expiresAt,
        },
      });

      return {
        id: String(created.id),
        code: String(created.code),
        type: String(created.type),
        value: String(created.value),
        isActive: Boolean(created.isActive),
        usedCount: Number(created.usedCount ?? 0),
        maxUses: created.maxUses == null ? null : Number(created.maxUses),
        startsAt: created.startsAt ? new Date(created.startsAt).toISOString() : null,
        expiresAt: created.expiresAt ? new Date(created.expiresAt).toISOString() : null,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new HttpError(409, "Promo code already exists");
      }
      throw err;
    }
  },

  async removeAdmin(params: { id: string }) {
    await (prisma as any).promoCode.delete({ where: { id: params.id } });
  },

  async setActiveAdmin(params: { id: string; isActive: boolean }) {
    const updated: any = await (prisma as any).promoCode.update({
      where: { id: params.id },
      data: { isActive: params.isActive },
    });

    return {
      id: String(updated.id),
      code: String(updated.code),
      type: String(updated.type),
      value: String(updated.value),
      isActive: Boolean(updated.isActive),
      usedCount: Number(updated.usedCount ?? 0),
      maxUses: updated.maxUses == null ? null : Number(updated.maxUses),
      startsAt: updated.startsAt ? new Date(updated.startsAt).toISOString() : null,
      expiresAt: updated.expiresAt ? new Date(updated.expiresAt).toISOString() : null,
    };
  },

  async validateForBaseAmount(params: { code: string; baseAmount: number }) {
    const code = normalizeCode(params.code);
    if (!code) throw new HttpError(400, "Promo code is required");

    const baseAmount = Number(params.baseAmount);
    if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
      throw new HttpError(400, "Invalid base amount");
    }

    const promo: any = await (prisma as any).promoCode.findUnique({ where: { code } });
    if (!promo) throw new HttpError(400, "Invalid Promocode");
    if (!promo.isActive) throw new HttpError(400, "Invalid Promocode");

    const now = new Date();
    if (promo.startsAt && now < promo.startsAt) throw new HttpError(400, "Invalid Promocode");
    if (promo.expiresAt && now > promo.expiresAt) throw new HttpError(400, "Invalid Promocode");

    if (promo.maxUses != null && Number.isFinite(Number(promo.maxUses))) {
      const maxUses = Number(promo.maxUses);
      const usedCount = Number(promo.usedCount ?? 0);
      if (maxUses >= 0 && usedCount >= maxUses) throw new HttpError(400, "Invalid Promocode");
    }

    const valueNum = Number(promo.value);
    if (!Number.isFinite(valueNum) || valueNum <= 0) throw new HttpError(400, "Invalid promo code value");

    let discount = 0;
    if (promo.type === "PERCENT") {
      discount = round2((baseAmount * valueNum) / 100);
    } else if (promo.type === "FLAT") {
      discount = round2(valueNum);
    } else {
      throw new HttpError(400, "Unsupported promo code type");
    }

    discount = Math.max(0, Math.min(round2(baseAmount), discount));

    return {
      promo: {
        id: String(promo.id),
        code: String(promo.code),
        type: String(promo.type) as "PERCENT" | "FLAT",
        value: new Prisma.Decimal(String(promo.value)),
      },
      discountAmount: discount,
    };
  },
};
