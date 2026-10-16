import { AppError } from "../../../utils/errors/index.js";
import { PHAJAY_SECRET_KEY } from "../../../config/globalkey.js";

const BASE_URL = "https://payment-gateway.lailaolab.com/v1/api/payment";
const TIMEOUT_MS = 10_000;

// Only BCEL is wired: it is the endpoint a live sandbox payment confirmed.
// LDB exists in PhaJay's community SDK but has not been tried here.
const ENDPOINTS = {
    BCEL: "generate-bcel-qr",
};

export const SUPPORTED_BANKS = Object.keys(ENDPOINTS);

export const phajayGateway = {
    name: "phajay",

    async createQr({ bank, amount, description }) {
        if (!PHAJAY_SECRET_KEY) {
            throw new AppError("Payment provider is not configured", 503);
        }

        const endpoint = ENDPOINTS[bank];
        if (!endpoint) throw new AppError(`${bank} payments are not available yet`, 400);

        let response;
        try {
            response = await fetch(`${BASE_URL}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", secretKey: PHAJAY_SECRET_KEY },
                body: JSON.stringify({ amount, description }),
                // A hung gateway must not hold the customer's request open.
                signal: AbortSignal.timeout(TIMEOUT_MS),
            });
        } catch {
            throw new AppError("Payment provider did not respond, please try again", 502);
        }

        const body = await response.json().catch(() => null);

        if (!response.ok || !body?.transactionId || !body?.qrCode) {
            // PhaJay's own message says why - an amount outside the sandbox's
            // 1-999 kip, for instance - and carries nothing secret.
            throw new AppError(
                `Payment provider refused the request${body?.message ? `: ${body.message}` : ""}`,
                502
            );
        }

        // PhaJay returns the QR as text, not an image, and a deep link that
        // opens the bank app on the same phone.
        return {
            transactionId: body.transactionId,
            qrCode: body.qrCode,
            deepLink: body.link ?? null,
        };
    },
};
