import { prisma } from "../../config/prisma.config.js";

const include = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    },

    event: {
        select: {
            id: true,
            title: true,
            eventStatus: true,
            startAt: true,
            endAt: true,
        },
    },

    orderItems: {
        include: {
            ticketType: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    status: true,
                    eventId: true,
                    saleStart: true,
                    saleEnd: true,
                },
            },
        },
    },

    coupon: true,
    couponRedemption: true,
};

export const orderRepository = {
    findById: (id) => prisma.order.findUnique({ where: { id }, include }),

    findByUserId: (userId) =>
        prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include }),

    findMany: async ({ page, limit, userId, eventId, status, sortBy, sortOrder }) => {
        const where = {
            ...(userId && { userId }),
            ...(eventId && { eventId }),
            ...(status && { status }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.order.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include,
            }),
            prisma.order.count({ where }),
        ]);

        return { data, total };
    },

    findRelations: async ({ userId, eventId, couponCode }) => {
        const [user, event, coupon] = await prisma.$transaction([
            prisma.user.findUnique({ where: { id: userId ?? "" } }),
            prisma.event.findUnique({ where: { id: eventId ?? "" } }),
            prisma.coupon.findUnique({ where: { code: couponCode ?? "" } }),
        ]);
        return { user, event, coupon };
    },

    findTicketTypeById: (id) => prisma.ticketType.findUnique({ where: { id } }),

    isRedeemedByUser: async (couponId, userId) =>
        Boolean(
            await prisma.couponRedemption.findUnique({
                where: { couponId_userId: { couponId, userId } },
            })
        ),

    incrementCouponUsage: (tx, couponId) =>
        tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }),

    decrementCouponUsage: (tx, couponId) =>
        tx.coupon.update({ where: { id: couponId }, data: { usedCount: { decrement: 1 } } }),

    create: (tx, data) => tx.order.create({ data }),

    createOrderItem: (tx, data) => tx.orderItem.create({ data }),

    update: (tx, id, data) => tx.order.update({ where: { id }, data, include }),

    delete: (id) => prisma.order.delete({ where: { id } }),

    createRedemption: (tx, { couponId, userId, orderId }) =>
        tx.couponRedemption.create({ data: { couponId, userId, orderId } }),

    reserveTicketQuantity: async (tx, ticketTypeId, quantity) => {
        const affected = await tx.$executeRaw`
            UPDATE \`TicketType\`
               SET \`saleQuantity\` = \`saleQuantity\` + ${quantity}
             WHERE \`id\` = ${ticketTypeId}
               AND \`status\` = 'ACTIVE'
               AND \`saleQuantity\` + ${quantity} <= \`quantity\``;

        return affected === 1;
    },

    releaseTicketQuantity: (tx, ticketTypeId, quantity) =>
        tx.ticketType.update({
            where: { id: ticketTypeId },
            data: { saleQuantity: { decrement: quantity } },
        }),

    cancelOrder: (tx, orderId) =>
        tx.order.updateMany({
            where: { id: orderId, status: "PENDING" },
            data: { status: "CANCELLED" },
        }),

    deleteRedemptionByOrderId: (tx, orderId) =>
        tx.couponRedemption.deleteMany({ where: { orderId } }),
};
