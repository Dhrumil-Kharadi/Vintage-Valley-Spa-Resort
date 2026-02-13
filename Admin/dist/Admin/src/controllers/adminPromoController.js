"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPromoController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../../../Backend/src/utils/asyncHandler");
const adminPromoService_1 = require("../services/adminPromoService");
const createSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    type: zod_1.z.enum(["PERCENT", "FLAT"]),
    value: zod_1.z.coerce.number(),
    startsAt: zod_1.z.string().optional().nullable(),
    expiresAt: zod_1.z.string().optional().nullable(),
    maxUses: zod_1.z.coerce.number().int().optional().nullable(),
    isActive: zod_1.z.coerce.boolean().optional(),
});
const setActiveSchema = zod_1.z.object({
    isActive: zod_1.z.coerce.boolean(),
});
exports.adminPromoController = {
    list: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        const promos = await adminPromoService_1.adminPromoService.list();
        res.json({ ok: true, data: { promos } });
    }),
    delete: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = String(req.params.id ?? "").trim();
        if (!id)
            return res.status(400).json({ ok: false, error: { message: "Invalid promo id" } });
        await adminPromoService_1.adminPromoService.delete({ id });
        res.json({ ok: true });
    }),
    create: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = createSchema.parse(req.body);
        const promo = await adminPromoService_1.adminPromoService.create({
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
    setActive: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const id = String(req.params.id ?? "");
        if (!id)
            return res.status(400).json({ ok: false, error: { message: "Invalid promo id" } });
        const body = setActiveSchema.parse(req.body);
        const promo = await adminPromoService_1.adminPromoService.setActive({ id, isActive: body.isActive });
        res.json({ ok: true, data: { promo } });
    }),
};
