import { prisma } from "../../config/prisma.config.js";

// A sale is a successful payment on an order that still stands: a refunded
// order paid once but is no longer revenue. One order has at most one
// successful payment, so counting payments counts orders.
const SOLD_ORDER_STATUSES = ["PAID", "COMPLETED"];

export const dashboardRepository = {
    findSales: ({ from, to }) =>
        prisma.payment.findMany({
            where: {
                status: "SUCCESS",
                paidAt: { gte: from, lt: to },
                order: { status: { in: SOLD_ORDER_STATUSES } },
            },
            select: {
                amount: true,
                paidAt: true,
                order: {
                    select: {
                        eventId: true,
                        orderItems: { select: { quantity: true } },
                    },
                },
            },
        }),

    countNewCustomers: ({ from, to }) =>
        prisma.user.count({ where: { role: "USER", createdAt: { gte: from, lt: to } } }),

    findEventTitles: (ids) =>
        prisma.event.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, titleEn: true } }),

    findUpcomingEvents: ({ now, take }) =>
        prisma.event.findMany({
            where: { eventStatus: "PUBLISHED", startAt: { gte: now } },
            orderBy: { startAt: "asc" },
            take,
            select: {
                id: true,
                title: true,
                titleEn: true,
                startAt: true,
                coverImgUrl: true,
                venue: { select: { name: true, nameEn: true } },
                ticketTypes: { select: { quantity: true, saleQuantity: true } },
            },
        }),

    findRecentOrders: ({ take }) =>
        prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            take,
            select: {
                id: true,
                status: true,
                totalAmount: true,
                expiresAt: true,
                createdAt: true,
                user: { select: { id: true, name: true } },
                event: { select: { id: true, title: true, titleEn: true } },
            },
        }),

    // Unpaid orders past their reservation still hold their seats until
    // something cancels them; the dashboard is where someone will notice.
    findExpiredPending: ({ now }) =>
        prisma.order.findMany({
            where: { status: "PENDING", expiresAt: { lt: now } },
            select: { orderItems: { select: { quantity: true } } },
        }),
};
