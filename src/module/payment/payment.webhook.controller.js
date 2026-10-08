import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { verifyWebhookSecret } from "../../middleware/webhook.js";
import { paymentService } from "./payment.service.js";
import { settlePaymentSchema } from "./payment.schema.js";

const router = Router();

router.post(
    "/",
    verifyWebhookSecret,
    validate(settlePaymentSchema),
    asyncHandler(async (req, res) => {
        const data = await paymentService.settlePayment(req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Payment settled successfully",
            data,
        });
    })
);

export default router;
