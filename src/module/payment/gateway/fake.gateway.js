import { randomUUID } from "node:crypto";

import { AppError } from "../../../utils/errors/index.js";
import { SUPPORTED_BANKS } from "./phajay.gateway.js";

// Stands in for PhaJay where no real money should move: the development seed,
// and tests. Its QR is not scannable and no payment event will ever arrive;
// settle it by calling paymentService.settlePayment directly.
//
// It refuses the same banks the real gateway refuses, so a flow that passes
// against the fake does not then fail against PhaJay.
export const fakeGateway = {
    name: "fake",

    async createQr({ bank, amount }) {
        if (!SUPPORTED_BANKS.includes(bank)) {
            throw new AppError(`${bank} payments are not available yet`, 400);
        }

        const transactionId = randomUUID();
        return {
            transactionId,
            qrCode: `FAKE-QR|${transactionId}|${amount}`,
            deepLink: null,
        };
    },
};
