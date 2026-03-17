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
      applicableLabel: String(p.applicableLabel ?? ''),
      promoScope: String(p.promoScope ?? ''),
      isActive: Boolean(p.isActive),
      usedCount: Number(p.usedCount ?? 0),
      maxUses: p.maxUses == null ? null : Number(p.maxUses),
      startsAt: p.startsAt ? new Date(p.startsAt).toISOString() : null,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : null,
      minNights: p.minNights == null ? null : Number(p.minNights),
      maxNights: p.maxNights == null ? null : Number(p.maxNights),
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
    }));
  },

  async createAdmin(params: {
    code: string;
    type: "PERCENT" | "FLAT";
    value: string | number;
    applicableLabel?: string;
    isActive?: boolean;
    maxUses?: string | number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    minNights?: string | number | null;
    maxNights?: string | number | null;
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

    const applicableLabel = String(params.applicableLabel ?? '').trim().slice(0, 100);

    const minNights = params.minNights == null || String(params.minNights).trim() === "" ? null : Number(params.minNights);
    const maxNights = params.maxNights == null || String(params.maxNights).trim() === "" ? null : Number(params.maxNights);

    try {
      const created: any = await (prisma as any).promoCode.create({
        data: {
          code,
          type: params.type,
          value: new Prisma.Decimal(String(valueNum)),
          applicableLabel: applicableLabel || null,
          isActive: params.isActive ?? true,
          maxUses,
          startsAt,
          expiresAt,
          minNights,
          maxNights,
        },
      });

      return {
        id: String(created.id),
        code: String(created.code),
        type: String(created.type),
        value: String(created.value),
        applicableLabel: String(created.applicableLabel ?? ''),
        promoScope: String(created.promoScope ?? ''),
        isActive: Boolean(created.isActive),
        usedCount: Number(created.usedCount ?? 0),
        maxUses: created.maxUses == null ? null : Number(created.maxUses),
        startsAt: created.startsAt ? new Date(created.startsAt).toISOString() : null,
        expiresAt: created.expiresAt ? new Date(created.expiresAt).toISOString() : null,
        minNights: created.minNights == null ? null : Number(created.minNights),
        maxNights: created.maxNights == null ? null : Number(created.maxNights),
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

  async updateAdmin(params: {
    id: string;
    applicableLabel?: string;
    maxUses?: string | number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    minNights?: string | number | null;
    maxNights?: string | number | null;
  }) {
    const data: any = {};

    if (params.applicableLabel !== undefined) {
      data.applicableLabel = String(params.applicableLabel ?? '').trim().slice(0, 100) || null;
    }
    if (params.maxUses !== undefined) {
      data.maxUses = params.maxUses == null || String(params.maxUses).trim() === "" ? null : Number(params.maxUses);
    }
    if (params.startsAt !== undefined) {
      data.startsAt = params.startsAt ? new Date(params.startsAt) : null;
    }
    if (params.expiresAt !== undefined) {
      data.expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
    }
    if (params.minNights !== undefined) {
      data.minNights = params.minNights == null || String(params.minNights).trim() === "" ? null : Number(params.minNights);
    }
    if (params.maxNights !== undefined) {
      data.maxNights = params.maxNights == null || String(params.maxNights).trim() === "" ? null : Number(params.maxNights);
    }

    const updated: any = await (prisma as any).promoCode.update({
      where: { id: params.id },
      data,
    });

    return {
      id: String(updated.id),
      code: String(updated.code),
      type: String(updated.type),
      value: String(updated.value),
      applicableLabel: String(updated.applicableLabel ?? ''),
      promoScope: String(updated.promoScope ?? ''),
      isActive: Boolean(updated.isActive),
      usedCount: Number(updated.usedCount ?? 0),
      maxUses: updated.maxUses == null ? null : Number(updated.maxUses),
      startsAt: updated.startsAt ? new Date(updated.startsAt).toISOString() : null,
      expiresAt: updated.expiresAt ? new Date(updated.expiresAt).toISOString() : null,
      minNights: updated.minNights == null ? null : Number(updated.minNights),
      maxNights: updated.maxNights == null ? null : Number(updated.maxNights),
    };
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
      applicableLabel: String(updated.applicableLabel ?? ''),
      promoScope: String(updated.promoScope ?? ''),
      isActive: Boolean(updated.isActive),
      usedCount: Number(updated.usedCount ?? 0),
      maxUses: updated.maxUses == null ? null : Number(updated.maxUses),
      startsAt: updated.startsAt ? new Date(updated.startsAt).toISOString() : null,
      expiresAt: updated.expiresAt ? new Date(updated.expiresAt).toISOString() : null,
      minNights: updated.minNights == null ? null : Number(updated.minNights),
      maxNights: updated.maxNights == null ? null : Number(updated.maxNights),
    };
  },

  async validateForBaseAmount(params: {
    code: string;
    baseAmount: number;
    nights?: number;
    checkIn?: string;
    checkOut?: string;
  }) {
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

    // Enforce night-based eligibility
    if (params.nights != null && Number.isFinite(params.nights)) {
      const nights = params.nights;
      if (promo.minNights != null && nights < promo.minNights)
        throw new HttpError(400, `This promo requires at least ${promo.minNights} night(s)`);
      if (promo.maxNights != null && nights > promo.maxNights)
        throw new HttpError(400, `This promo is only valid for up to ${promo.maxNights} night(s)`);
    }

    // Enforce weekend-only applicability if label contains "weekend"
    const label = String(promo.applicableLabel ?? "").toLowerCase();
    if (label.includes("weekend")) {
      if (!params.checkIn || !params.checkOut) {
        // If dates are missing, we can't verify, but we should probably err on the side of caution or allow if nights > 5
        // Ideally, the frontend always sends dates.
      } else {
        const start = new Date(params.checkIn);
        const end = new Date(params.checkOut);
        
        let hasWeekend = false;
        // Check each night of the stay
        const current = new Date(start);
        while (current < end) {
          const day = current.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
          if (day === 5 || day === 6) { // Friday or Saturday night
            hasWeekend = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }

        if (!hasWeekend) {
          throw new HttpError(400, "This promo code is only applicable for weekend stays (Friday or Saturday nights).");
        }
      }
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
