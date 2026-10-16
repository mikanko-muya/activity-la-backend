import { prisma } from "../../config/prisma.config.js";
import { paginateArgs } from "../../utils/pagination.js";

const include = {
    order: {
        select: {
            id: true,
            userId: true,
            eventId: true,
            status: true,
            totalAmount: true,
            expiresAt: true,
        },
    },
};

const buildWhere = (query) => ({
    ...(query.status && { status: query.status }),
    ...(query.method && { method: query.method }),
    ...(query.orderId && { orderId: query.orderId }),
    ...(query.userId && { order: { userId: query.userId } }),
});

export const paymentRepository = {
    create: (data) => prisma.payment.create({ data, include }),

    findById: (id) => prisma.payment.findUnique({ where: { id }, include }),

    findByTransactionRef: (transactionRef) =>
        prisma.payment.findUnique({ where: { transactionRef }, include }),

    findMany: async (query) => {
        const where = buildWhere(query);

        const [data, total] = await prisma.$transaction([
            prisma.payment.findMany({
                where,
                include,
                ...paginateArgs(query),
            }),
            prisma.payment.count({ where }),
        ]);

        return { data, total };
    },

    countByOrderIdAndStatus: (orderId, status) =>
        prisma.payment.count({ where: { orderId, status } }),

    // A QR that is still within its window for this order and bank. Pressing
    // Pay twice hands back the same QR instead of a second one, so there is
    // only ever one live QR to pay - two would invite paying twice.
    findLivePending: (orderId, method) =>
        prisma.payment.findFirst({
            where: { orderId, method, status: "PENDING", expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
            include,
        }),

    settle: (tx, id, data) =>
        tx.payment.updateMany({ where: { id, status: "PENDING" }, data }),

    markOrderPaid: (tx, orderId) =>
        tx.order.updateMany({
            where: { id: orderId, status: "PENDING" },
            data: { status: "PAID", expiresAt: null },
        }),

    issueTickets: (tx, rows) => tx.tickets.createMany({ data: rows }),

    countTicketsByOrderId: (orderId) => prisma.tickets.count({ where: { orderId } }),

    findTicketsByOrderId: (orderId) =>
        prisma.tickets.findMany({
            where: { orderId },
            select: { id: true, ticketCode: true, qrCode: true, status: true },
        }),
};
