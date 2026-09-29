import prisma from "../../config/prisma.js";

const include = {
    user: {
        select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
        },
    },

    event: {
        select: {
            id: true,
            title: true,
            status: true,
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
    couponUsage: true,
};

export const orderRepository = {
    findById: (id) => prisma.order.findUnique({ where: { id }, include }),

    findByUserId: (userId) => prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc", },
        include
    }),

    findMany: async ({ page, limit, userId, eventId, status, sortBy, sortOrder, }) => {
        const where = {
            ...(userId && { userId }),
            ...(eventId && { eventId }),
            ...(status && { status }),
        };

        const [data, total] =
            await prisma.$transaction([
                prisma.order.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder, },
                    include
                }),

                prisma.order.count({ where, }),
            ]);

        return { data, total };
    },


    findRelations: async ({ userId, eventId, couponCode, }) => {
        const [user, event, coupon] = await prisma.$transaction([
            prisma.user.findUnique({ where: { id: userId ?? "" } }),
            prisma.event.findUnique({ where: { id: eventId ?? "" } }),
            prisma.coupon.findUnique({ where: { code: couponCode ?? "" } }),
        ]);
        return { user, event, coupon };
    },

    isUsedCoupon: async (couponId, userId) => {
        const usage = await prisma.couponUsage.findUnique({
            where: {
                couponId_userId: {
                    couponId,
                    userId,
                },
            },
        });

        return Boolean(usage);
    },

    findTicketTypeById: (id) => prisma.ticketType.findUnique({ where: { id }, }),


    create: (tx, data) => tx.order.create({ data, }),

    createOrderItems: (tx, data) => tx.orderItem.create({ data, }),

    update: (tx, id, data) => tx.prisma.order.update({
        where: { id },
        data,
        include
    }),

    delete: (id) => prisma.order.delete({ where: { id } }),

    reserveTicketQuantity: async (tx, ticketTypeId, quantity) => {
        const result = await tx.ticketType.updateMany({
            where: {
                id: ticketTypeId,
                status: "ACTIVE",
                quantity: { gte: quantity, },
            },

            data: {
                quantity: { decrement: quantity, },
            },
        });

        return result.count === 1;
    },

    releaseTicketQuantity: (tx, ticketTypeId, quantity) =>
        tx.ticketType.update({
            where: { id: ticketTypeId, },
            data: { quantity: { increment: quantity, } },
        }),

    cancelOrder: (tx, orderId) =>
        tx.order.updateMany({
            where: {
                id: orderId,
                status: "PENDING",
            },
            data: {
                status: "CANCELLED",
            },
        }),
};
