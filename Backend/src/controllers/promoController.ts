import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { promoService } from "../services/promoService";

const validateSchema = z.object({
  code: z.string().min(1),
  baseAmount: z.number(),
});

export const promoController = {
  validate: asyncHandler(async (req, res) => {
    const body = validateSchema.parse(req.body);

    const result = await promoService.validateForBaseAmount({
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
