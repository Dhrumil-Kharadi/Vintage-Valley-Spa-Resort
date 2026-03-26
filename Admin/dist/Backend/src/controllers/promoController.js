"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const promoService_1 = require("../services/promoService");
const validateSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    baseAmount: zod_1.z.number(),
    nights: zod_1.z.number().optional(),
    checkIn: zod_1.z.string().optional(),
    checkOut: zod_1.z.string().optional(),
});
const createSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    type: zod_1.z.enum(["PERCENT", "FLAT"]),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    applicableLabel: zod_1.z.string().max(100).optional(),
    isActive: zod_1.z.boolean().optional(),
    maxUses: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    startsAt: zod_1.z.string().optional().nullable(),
    expiresAt: zod_1.z.string().optional().nullable(),
    minNights: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    maxNights: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    appliesTo: zod_1.z.string().optional().nullable(),
});
const setActiveSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
const updateSchema = zod_1.z.object({
    applicableLabel: zod_1.z.string().max(100).optional(),
    maxUses: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    startsAt: zod_1.z.string().optional().nullable(),
    expiresAt: zod_1.z.string().optional().nullable(),
    minNights: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    maxNights: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional().nullable(),
    appliesTo: zod_1.z.string().optional().nullable(),
});
exports.promoController = {
    validate: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = validateSchema.parse(req.body);
        const result = await promoService_1.promoService.validateForBaseAmount({
            code: body.code,
            baseAmount: body.baseAmount,
            nights: body.nights,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
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
    list: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const promos = await promoService_1.promoService.listAdmin();
        res.json({ ok: true, data: { promos } });
    }),
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = createSchema.parse(req.body);
        const promo = await promoService_1.promoService.createAdmin({
            code: body.code,
            type: body.type,
            value: body.value,
            applicableLabel: body.applicableLabel,
            isActive: body.isActive,
            maxUses: body.maxUses,
            startsAt: body.startsAt,
            expiresAt: body.expiresAt,
            minNights: body.minNights,
            maxNights: body.maxNights,
            appliesTo: body.appliesTo,
        });
        res.json({ ok: true, data: { promo } });
    }),
    remove: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = String(req.params.id ?? "").trim();
        if (!id)
            throw new Error("Invalid id");
        await promoService_1.promoService.removeAdmin({ id });
        res.json({ ok: true });
    }),
    setActive: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = String(req.params.id ?? "").trim();
        if (!id)
            throw new Error("Invalid id");
        const body = setActiveSchema.parse(req.body);
        const promo = await promoService_1.promoService.setActiveAdmin({ id, isActive: body.isActive });
        res.json({ ok: true, data: { promo } });
    }),
    update: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = String(req.params.id ?? "").trim();
        if (!id)
            throw new Error("Invalid id");
        const body = updateSchema.parse(req.body);
        const promo = await promoService_1.promoService.updateAdmin({
            id,
            applicableLabel: body.applicableLabel,
            maxUses: body.maxUses,
            startsAt: body.startsAt,
            expiresAt: body.expiresAt,
            minNights: body.minNights,
            maxNights: body.maxNights,
            appliesTo: body.appliesTo,
        });
        res.json({ ok: true, data: { promo } });
    }),
};
