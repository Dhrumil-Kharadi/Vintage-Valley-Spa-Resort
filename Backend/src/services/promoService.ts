import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { HttpError } from "../middlewares/errorHandler";

const round2 = (n: number) => Math.round(n * 100) / 100;

const normalizeCode = (code: string) => code.trim().toUpperCase();

export const promoService = {
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
