"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoAdminController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const errorHandler_1 = require("../middlewares/errorHandler");
const client_1 = require("../prisma/client");
const client_2 = require("@prisma/client");
exports.promoAdminController = {
    // List promos, optionally filter by scope
    list: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { scope } = req.query;
        const where = {};
        if (scope === 'GLOBAL_FLAT') {
            where.promoScope = 'GLOBAL_FLAT';
        }
        const promos = await client_1.prisma.promoCode.findMany({
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
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { promoScope, discountValue, isGlobalActive } = req.body;
        if (promoScope === 'GLOBAL_FLAT') {
            if (!discountValue || Number(discountValue) <= 0) {
                throw new errorHandler_1.HttpError(400, 'Discount value must be greater than 0');
            }
            // If activating, deactivate all other global flat promos first
            if (isGlobalActive) {
                await client_1.prisma.promoCode.updateMany({
                    where: { promoScope: 'GLOBAL_FLAT', isGlobalActive: true },
                    data: { isGlobalActive: false },
                });
            }
            const promo = await client_1.prisma.promoCode.create({
                data: {
                    promoScope: 'GLOBAL_FLAT',
                    discountValue: new client_2.Prisma.Decimal(discountValue),
                    isGlobalActive: Boolean(isGlobalActive),
                    // Dummy fields for existing schema
                    code: `GLOBAL_${Date.now()}`,
                    type: 'FLAT',
                    value: new client_2.Prisma.Decimal(discountValue),
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
        }
        else {
            // Existing code-based promo creation logic can be added here
            throw new errorHandler_1.HttpError(400, 'Only GLOBAL_FLAT scope supported in this endpoint');
        }
    }),
    // Update a promo (activate/deactivate)
    update: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { isGlobalActive } = req.body;
        const existing = await client_1.prisma.promoCode.findUnique({ where: { id } });
        if (!existing)
            throw new errorHandler_1.HttpError(404, 'Promo not found');
        if (existing.promoScope !== 'GLOBAL_FLAT') {
            throw new errorHandler_1.HttpError(400, 'Only global flat promos can be updated here');
        }
        if (isGlobalActive) {
            // Deactivate all other global flat promos before activating this one
            await client_1.prisma.promoCode.updateMany({
                where: { promoScope: 'GLOBAL_FLAT', isGlobalActive: true, id: { not: id } },
                data: { isGlobalActive: false },
            });
        }
        const promo = await client_1.prisma.promoCode.update({
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
    delete: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const existing = await client_1.prisma.promoCode.findUnique({ where: { id } });
        if (!existing)
            throw new errorHandler_1.HttpError(404, 'Promo not found');
        if (existing.promoScope !== 'GLOBAL_FLAT') {
            throw new errorHandler_1.HttpError(400, 'Only global flat promos can be deleted here');
        }
        await client_1.prisma.promoCode.delete({ where: { id } });
        res.json({ ok: true, message: 'Promo deleted' });
    }),
};
