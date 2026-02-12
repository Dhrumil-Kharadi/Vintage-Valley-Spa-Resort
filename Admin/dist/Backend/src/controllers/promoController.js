"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const promoService_1 = require("../services/promoService");
const validateSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    baseAmount: zod_1.z.number(),
});
exports.promoController = {
    validate: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = validateSchema.parse(req.body);
        const result = await promoService_1.promoService.validateForBaseAmount({
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
};
