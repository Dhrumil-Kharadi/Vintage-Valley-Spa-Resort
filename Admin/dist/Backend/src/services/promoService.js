"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoService = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const errorHandler_1 = require("../middlewares/errorHandler");
const round2 = (n) => Math.round(n * 100) / 100;
const normalizeCode = (code) => code.trim().toUpperCase();
exports.promoService = {
    async validateForBaseAmount(params) {
        const code = normalizeCode(params.code);
        if (!code)
            throw new errorHandler_1.HttpError(400, "Promo code is required");
        const baseAmount = Number(params.baseAmount);
        if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
            throw new errorHandler_1.HttpError(400, "Invalid base amount");
        }
        const promo = await client_2.prisma.promoCode.findUnique({ where: { code } });
        if (!promo)
            throw new errorHandler_1.HttpError(400, "Invalid Promocode");
        if (!promo.isActive)
            throw new errorHandler_1.HttpError(400, "Invalid Promocode");
        const now = new Date();
        if (promo.startsAt && now < new Date(promo.startsAt))
            throw new errorHandler_1.HttpError(400, "Invalid Promocode");
        if (promo.expiresAt && now > new Date(promo.expiresAt))
            throw new errorHandler_1.HttpError(400, "Invalid Promocode");
        if (promo.maxUses != null && Number.isFinite(Number(promo.maxUses))) {
            const maxUses = Number(promo.maxUses);
            const usedCount = Number(promo.usedCount ?? 0);
            if (maxUses >= 0 && usedCount >= maxUses)
                throw new errorHandler_1.HttpError(400, "Invalid Promocode");
        }
        const valueNum = Number(promo.value);
        if (!Number.isFinite(valueNum) || valueNum <= 0)
            throw new errorHandler_1.HttpError(400, "Invalid promo code value");
        let discount = 0;
        if (promo.type === "PERCENT") {
            discount = round2((baseAmount * valueNum) / 100);
        }
        else if (promo.type === "FLAT") {
            discount = round2(valueNum);
        }
        else {
            throw new errorHandler_1.HttpError(400, "Unsupported promo code type");
        }
        discount = Math.max(0, Math.min(round2(baseAmount), discount));
        return {
            promo: {
                id: String(promo.id),
                code: String(promo.code),
                type: String(promo.type),
                value: new client_1.Prisma.Decimal(String(promo.value)),
            },
            discountAmount: discount,
        };
    },
};
