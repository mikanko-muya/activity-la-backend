import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/errors/index.js";
import { buildMeta } from "../../utils/pagination.js";
import { prisma } from "../../config/prisma.config.js";
import { generateQrPayload, generateTicketCode, generateTransactionRef } from "../../utils/ticketCode.js";
import { notificationService } from "../notification/notification.service.js";
import { orderRepository } from "../order/order.repository.js";
import { paymentRepository } from "./payment.repository.js";

const TICKET_CODE_ATTEMPTS = 5;

const paginated = (result, query) => ({
    data: result.data,
    meta: buildMeta({ total: result.total, page: query.page, limit: query.limit }),
});

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
        const order = await orderRepository.findById(input.orderId);
        if (!order) throw new NotFoundError("Order not found");

        if (order.userId !== actingUserId) {
            throw new ForbiddenError("You do not have permission");
        }

        assertOrderPayable(order);

        const settled = await paymentRepository.countByOrderIdAndStatus(order.id, "SUCCESS");
        if (settled > 0) throw new ConflictError("Order has already been paid");

        return paymentRepository.create({
            orderId: order.id,
            amount: order.totalAmount,
            method: input.method,
            status: "PENDING",
            transactionRef: generateTransactionRef(),
        });
    },

    async settlePayment(input) {
        const payment = await paymentRepository.findByTransactionRef(input.transactionRef);
        if (!payment) throw new NotFoundError("Payment not found");

        if (payment.status !== "PENDING") {
            return paymentRepository.findById(payment.id);
        }

        const order = await orderRepository.findById(payment.orderId);
        if (!order) throw new NotFoundError("Order not found");

        const succeeded = input.status === "SUCCESS";

        await prisma.$transaction(async (tx) => {
            const updated = await paymentRepository.settle(tx, payment.id, {
                status: input.status,
                paidAt: succeeded ? (input.paidAt ?? new Date()) : null,
                failureReason: succeeded ? null : (input.failureReason ?? "Payment failed"),
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
        const payment = await paymentRepository.findById(id);
        if (!payment) throw new NotFoundError("Payment not found");

        if (actingUserId && payment.order.userId !== actingUserId) {
            throw new NotFoundError("Payment not found");
        }

        return payment;
    },

    async getMyPayments(actingUserId, query) {
        const result = await paymentRepository.findMany({ ...query, userId: actingUserId });
        return paginated(result, query);
    },

    async getPayments(query) {
        return paginated(await paymentRepository.findMany(query), query);
    },

    async getMyOrderTickets(orderId, actingUserId) {
        const order = await orderRepository.findById(orderId);
        if (!order) throw new NotFoundError("Order not found");

        if (order.userId !== actingUserId) {
            throw new NotFoundError("Order not found");
        }

        return paymentRepository.findTicketsByOrderId(orderId);
    },
};
