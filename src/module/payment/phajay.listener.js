import { io } from "socket.io-client";

import { PHAJAY_SECRET_KEY } from "../../config/globalkey.js";
import { paymentRepository } from "./payment.repository.js";
import { paymentService } from "./payment.service.js";

const SOCKET_URL = "https://payment-gateway.phajay.co";

// The only status a live sandbox payment has shown. Whether PhaJay reports
// failures or expiries on this channel at all is unknown, so anything else is
// left alone and the QR simply lapses on our side.
const COMPLETED = "PAYMENT_COMPLETED";

const parse = (payload) => {
    if (typeof payload !== "string") return payload;
    try {
        return JSON.parse(payload);
    } catch {
        return null;
    }
};

// Never log an event itself: it carries the payer's name and bank account, and
// this channel also delivers other people's payments.
export const handlePhajayEvent = async (raw) => {
    const event = parse(raw);
    if (!event?.transactionId || event.status !== COMPLETED) return "ignored";

    const payment = await paymentRepository.findByTransactionRef(event.transactionId);

    // The channel is keyed by the merchant secret, and the sandbox merchant is
    // shared - most events are not ours. An id we did not issue is not ours.
    if (!payment) return "not ours";

    // PhaJay delivered the same completion twice in testing.
    if (payment.status !== "PENDING") return "already settled";

    // Checked, not trusted: the event must confirm the amount we asked for.
    if (Number(event.txnAmount) !== Number(payment.amount) || (event.sourceCurrency ?? "LAK") !== "LAK") {
        console.warn(
            `[phajay] payment ${payment.id} not settled: expected ${Number(payment.amount)} LAK, ` +
            `event says ${event.txnAmount} ${event.sourceCurrency}`
        );
        return "amount mismatch";
    }

    try {
        await paymentService.settlePayment({
            transactionRef: event.transactionId,
            status: "SUCCESS",
            gatewayRef: event.exReferenceNo,
        });
        console.log(`[phajay] payment ${payment.id} settled`);
        return "settled";
    } catch (error) {
        // The money has moved but the order could not take it - most likely it
        // was already paid through a second QR. Tickets are not issued twice;
        // the customer is owed a refund.
        console.error(`[phajay] payment ${payment.id} could not be settled (${error.message}) - REFUND NEEDED`);
        return "settle failed";
    }
};

export const startPhajayListener = () => {
    if ((process.env.PAYMENT_GATEWAY ?? "phajay") !== "phajay") {
        console.log("[phajay] listener off: PAYMENT_GATEWAY is not phajay");
        return null;
    }

    if (!PHAJAY_SECRET_KEY) {
        console.warn("[phajay] listener off: PHAJAY_SECRET_KEY is not set, QR payments will never be confirmed");
        return null;
    }

    const socket = io(SOCKET_URL, {
        query: { key: PHAJAY_SECRET_KEY },
        transports: ["websocket", "polling"],
    });

    socket.on("connect", () => console.log("[phajay] listening for payments"));
    socket.on("connect_error", (error) => console.warn(`[phajay] connect error: ${error.message}`));

    // socket.io reconnects on its own, but an event sent while the connection
    // was down is gone - nothing replays it.
    socket.on("disconnect", (reason) =>
        console.warn(`[phajay] disconnected (${reason}); payments completed until it reconnects will be missed`)
    );

    socket.on(`join::${PHAJAY_SECRET_KEY}`, (payload) => {
        handlePhajayEvent(payload).catch((error) =>
            console.error(`[phajay] event handling failed: ${error.message}`)
        );
    });

    return socket;
};
