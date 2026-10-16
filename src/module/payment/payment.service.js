import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/errors/index.js";
import { toPaginated } from "../../utils/pagination.js";
import { assertFound, checkExistBy } from "../../utils/resource.js";
import { prisma } from "../../config/prisma.config.js";
import { generateQrPayload, generateTicketCode, generateTransactionRef } from "../../utils/ticketCode.js";
import QRCode from "qrcode";

import { notificationService } from "../notification/notification.service.js";
import { orderRepository } from "../order/order.repository.js";
import { getPaymentGateway } from "./gateway/index.js";
import { paymentRepository } from "./payment.repository.js";

const checkExist = checkExistBy(paymentRepository.findById, "Payment");
const checkOrderExist = checkExistBy(orderRepository.findById, "Order");

const TICKET_CODE_ATTEMPTS = 5;

// How long a payment QR stays payable. The order's own reservation is longer,
// so a customer whose QR lapses can ask for a fresh one.
const QR_WINDOW_MINUTES = 5;

// Which bank's QR each payment method needs. bank_transfer has none: someone
// checks the statement and confirms it by hand.
const GATEWAY_BANK = {
    bcel_one: "BCEL",
    onepay: "BCEL",
    ldb_mobile: "LDB",
};

const isLive = (payment) =>
    payment.status === "PENDING" && payment.expiresAt && payment.expiresAt > new Date();

// The QR is stored as text. A client gets it rendered as an image as well, so
// a web page or an app can show it with a plain <img> and needs no QR library
// - but only while it can still be paid.
const withQrImage = async (payment) =>
    payment?.qrCode && isLive(payment)
        ? { ...payment, qrImage: await QRCode.toDataURL(payment.qrCode, { width: 360, margin: 2 }) }
        : payment;

const assertOrderPayable = (order) => {
    if (order.status !== "PENDING") {
        throw new BadRequestError(`Order is ${order.status} and cannot be paid`);
    }

    if (order.expiresAt && order.expiresAt <= new Date()) {
        throw new BadRequestError("Order reservation has expired");
    }
};

const ticketRowsFor = (order) =>
    order.orderItems.flatMap((item) =>
        Array.from({ length: item.quantity }, () => ({
            orderId: order.id,
            ticketCode: generateTicketCode(),
            qrCode: generateQrPayload(),
        }))
    );

const issueTickets = async (tx, order) => {
    for (let attempt = 1; attempt <= TICKET_CODE_ATTEMPTS; attempt += 1) {
        try {
            return await paymentRepository.issueTickets(tx, ticketRowsFor(order));
        } catch (error) {
            if (error?.code !== "P2002" || attempt === TICKET_CODE_ATTEMPTS) throw error;
        }
    }

    throw new ConflictError("Could not issue tickets, please try again");
};

export const paymentService = {
    async createPayment(actingUserId, input) {
        const order = await checkOrderExist(input.orderId);

        if (order.userId !== actingUserId) {
            throw new ForbiddenError("You do not have permission");
        }

        assertOrderPayable(order);

        const settled = await paymentRepository.countByOrderIdAndStatus(order.id, "SUCCESS");
        if (settled > 0) throw new ConflictError("Order has already been paid");

        const bank = GATEWAY_BANK[input.method];

        if (!bank) {
            return paymentRepository.create({
                orderId: order.id,
                amount: order.totalAmount,
                method: input.method,
                status: "PENDING",
                transactionRef: generateTransactionRef(),
            });
        }

        const live = await paymentRepository.findLivePending(order.id, input.method);
        if (live) return withQrImage(live);

        // Kip has no subunit and a gateway charges whole amounts, so a total
        // with a fraction is refused rather than silently rounded - the event
        // that confirms the payment is checked against this exact amount.
        const amount = Number(order.totalAmount);
        if (!Number.isInteger(amount) || amount < 1) {
            throw new BadRequestError(
                amount === 0
                    ? "This order is free and does not need a payment"
                    : "Order total must be a whole number of kip to be paid by QR"
            );
        }

        const qrDeadline = new Date(Date.now() + QR_WINDOW_MINUTES * 60 * 1000);
        const expiresAt =
            order.expiresAt && order.expiresAt < qrDeadline ? order.expiresAt : qrDeadline;

        // Outside any transaction: this is a network call to someone else's
        // server, and a slow answer must not hold database locks. If it fails
        // no payment row exists, so there is nothing to undo.
        const qr = await getPaymentGateway().createQr({
            bank,
            amount,
            description: `Activity LA order ${order.id.slice(0, 8)}`,
        });

        const payment = await paymentRepository.create({
            orderId: order.id,
            amount: order.totalAmount,
            method: input.method,
            status: "PENDING",
            transactionRef: qr.transactionId,
            qrCode: qr.qrCode,
            deepLink: qr.deepLink,
            expiresAt,
        });

        return withQrImage(payment);
    },

    async settlePayment(input) {
        const payment = assertFound(
            await paymentRepository.findByTransactionRef(input.transactionRef),
            "Payment"
        );

        if (payment.status !== "PENDING") {
            return paymentRepository.findById(payment.id);
        }

        const order = await checkOrderExist(payment.orderId);

        const succeeded = input.status === "SUCCESS";

        await prisma.$transaction(async (tx) => {
            const updated = await paymentRepository.settle(tx, payment.id, {
                status: input.status,
                paidAt: succeeded ? (input.paidAt ?? new Date()) : null,
                failureReason: succeeded ? null : (input.failureReason ?? "Payment failed"),
                ...(input.gatewayRef && { gatewayRef: input.gatewayRef }),
            });

            if (updated.count !== 1) {
                throw new ConflictError("Payment has already been settled");
            }

            if (!succeeded) return;

            const paid = await paymentRepository.markOrderPaid(tx, payment.orderId);
            if (paid.count !== 1) {
                throw new ConflictError("Order is no longer awaiting payment");
            }

            await issueTickets(tx, order);
        });

        const ticketCount = succeeded ? await paymentRepository.countTicketsByOrderId(order.id) : 0;

        await notificationService.notifyUserSafely(
            succeeded
                ? {
                    userId: order.userId,
                    orderId: order.id,
                    notifType: "PAYMENT",
                    title: "Payment received",
                    message:
                        `We received ${Number(payment.amount).toFixed(2)} for "${order.event.title}". ` +
                        `${ticketCount} ticket(s) are ready in your order.`,
                }
                : {
                    userId: order.userId,
                    orderId: order.id,
                    notifType: "PAYMENT",
                    title: "Payment failed",
                    message:
                        `Your payment for "${order.event.title}" did not go through` +
                        `${input.failureReason ? `: ${input.failureReason}` : ""}. ` +
                        `You can try again while the reservation lasts.`,
                }
        );

        return paymentRepository.findById(payment.id);
    },

    async getPaymentById(id, { actingUserId } = {}) {
        const payment = await checkExist(id);

        if (actingUserId && payment.order.userId !== actingUserId) {
            throw new NotFoundError("Payment not found");
        }

        // This is the read a checkout screen polls while it waits, so it
        // carries the QR image for as long as the QR can be paid.
        return withQrImage(payment);
    },

    async getMyPayments(actingUserId, query) {
        const result = await paymentRepository.findMany({ ...query, userId: actingUserId });
        return toPaginated(result, query);
    },

    async getPayments(query) {
        return toPaginated(await paymentRepository.findMany(query), query);
    },

    async getMyOrderTickets(orderId, actingUserId) {
        const order = await checkOrderExist(orderId);

        if (order.userId !== actingUserId) {
            throw new NotFoundError("Order not found");
        }

        return paymentRepository.findTicketsByOrderId(orderId);
    },
};
