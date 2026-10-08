import { createHash, timingSafeEqual } from "node:crypto";

import { PAYMENT_WEBHOOK_SECRET } from "../config/globalkey.js";
import { UnauthorizedError } from "../utils/errors/index.js";

const digest = (value) => createHash("sha256").update(String(value)).digest();

export const verifyWebhookSecret = (req, _res, next) => {
    if (!PAYMENT_WEBHOOK_SECRET) {
        return next(new UnauthorizedError("Payment webhook is not configured"));
    }

    const provided = req.headers["x-webhook-secret"];
    if (!provided) return next(new UnauthorizedError("Missing webhook signature"));

    if (!timingSafeEqual(digest(provided), digest(PAYMENT_WEBHOOK_SECRET))) {
        return next(new UnauthorizedError("Invalid webhook signature"));
    }

    return next();
};
