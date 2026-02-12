"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPromoService = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("../../../Backend/src/prisma/client");
const errorHandler_1 = require("../../../Backend/src/middlewares/errorHandler");
const normalizeCode = (code) => code.trim().toUpperCase();
exports.adminPromoService = {
    async list() {
        const promos = await client_2.prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
        return promos.map((p) => ({
            id: p.id,
            code: p.code,
            type: p.type,
            value: String(p.value),
            isActive: p.isActive,
            startsAt: p.startsAt,
            expiresAt: p.expiresAt,
            maxUses: p.maxUses,
            usedCount: p.usedCount,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));
    },
    async create(params) {
        const code = normalizeCode(params.code);
        if (!code)
            throw new errorHandler_1.HttpError(400, "Code is required");
        const valueNum = Number(params.value);
        if (!Number.isFinite(valueNum) || valueNum <= 0)
            throw new errorHandler_1.HttpError(400, "Invalid value");
        if (params.type === "PERCENT" && valueNum > 100)
            throw new errorHandler_1.HttpError(400, "Percent discount cannot exceed 100");
        const startsAt = params.startsAt ? new Date(params.startsAt) : null;
        const expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
        if (startsAt && !Number.isFinite(startsAt.getTime()))
            throw new errorHandler_1.HttpError(400, "Invalid startsAt");
        if (expiresAt && !Number.isFinite(expiresAt.getTime()))
            throw new errorHandler_1.HttpError(400, "Invalid expiresAt");
        if (startsAt && expiresAt && expiresAt <= startsAt)
            throw new errorHandler_1.HttpError(400, "expiresAt must be after startsAt");
        const maxUses = params.maxUses == null ? null : Number(params.maxUses);
        if (maxUses != null && (!Number.isFinite(maxUses) || !Number.isInteger(maxUses) || maxUses < 0)) {
            throw new errorHandler_1.HttpError(400, "Invalid maxUses");
        }
        try {
            const promo = await client_2.prisma.promoCode.create({
                data: {
                    code,
                    type: params.type,
                    value: new client_1.Prisma.Decimal(valueNum.toFixed(2)),
                    isActive: params.isActive ?? true,
                    startsAt,
                    expiresAt,
                    maxUses,
                },
            });
            return {
                id: promo.id,
                code: promo.code,
                type: promo.type,
                value: String(promo.value),
                isActive: promo.isActive,
                startsAt: promo.startsAt,
                expiresAt: promo.expiresAt,
                maxUses: promo.maxUses,
                usedCount: promo.usedCount,
                createdAt: promo.createdAt,
                updatedAt: promo.updatedAt,
            };
        }
        catch (e) {
            const msg = String(e?.message ?? "");
            if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
                throw new errorHandler_1.HttpError(400, "Promo code already exists");
            }
            throw e;
        }
    },
    async setActive(params) {
        const promo = await client_2.prisma.promoCode.update({
            where: { id: params.id },
            data: { isActive: params.isActive },
        });
        return {
            id: promo.id,
            code: promo.code,
            type: promo.type,
            value: String(promo.value),
            isActive: promo.isActive,
            startsAt: promo.startsAt,
            expiresAt: promo.expiresAt,
            maxUses: promo.maxUses,
            usedCount: promo.usedCount,
            createdAt: promo.createdAt,
            updatedAt: promo.updatedAt,
        };
    },
};
