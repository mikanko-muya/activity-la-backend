import { prisma } from "../../config/prisma.config.js";
import { paginateArgs } from "../../utils/pagination.js";

const include = {
    event: {
        select: {
            id: true,
            title: true,
            startAt: true,
        },
    },

    order: {
        select: {
            id: true,
            status: true,
            totalAmount: true,
            expiresAt: true,
        },
    },

    coupon: {
        select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            validTo: true,
            isActive: true,
        },
    },
};

const adminInclude = {
    ...include,
    user: {
        select: {
            id: true,
            name: true,
            phone: true,
        },
    },
};

const buildWhere = ({ userId, eventId, orderId, couponId, notifType, isRead }) => ({
    ...(userId && { userId }),
    ...(eventId && { eventId }),
    ...(orderId && { orderId }),
    ...(couponId && { couponId }),
    ...(notifType && { notifType }),
    ...(isRead !== undefined && { isRead }),
});

export const notificationRepository = {
    create: (data, client = prisma) => client.notification.create({ data, include }),

    findById: (id) => prisma.notification.findUnique({ where: { id }, include: adminInclude }),

    findMany: async (query, { withUser = false } = {}) => {
        const where = buildWhere(query);

        const [data, total] = await prisma.$transaction([
            prisma.notification.findMany({
                where,
                ...paginateArgs(query),
                include: withUser ? adminInclude : include,
            }),
            prisma.notification.count({ where }),
        ]);

        return { data, total };
    },

    countUnread: (userId) =>
        prisma.notification.count({ where: { userId, isRead: false } }),

    markAsRead: (id) =>
        prisma.notification.update({ where: { id }, data: { isRead: true }, include }),

    markAsReadOwned: (id, userId) =>
        prisma.notification.updateMany({
            where: { id, userId, isRead: false },
            data: { isRead: true },
        }),

    markAllAsRead: (userId) =>
        prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        }),

    delete: (id) => prisma.notification.delete({ where: { id } }),

    deleteOwned: (id, userId) =>
        prisma.notification.deleteMany({ where: { id, userId } }),

    findRelations: async ({ userId, eventId, orderId, couponId }) => {
        const [user, event, order, coupon] = await prisma.$transaction([
            prisma.user.findUnique({ where: { id: userId ?? "" } }),
            prisma.event.findUnique({ where: { id: eventId ?? "" } }),
            prisma.order.findUnique({ where: { id: orderId ?? "" } }),
            prisma.coupon.findUnique({ where: { id: couponId ?? "" } }),
        ]);

        return { user, event, order, coupon };
    },
};
