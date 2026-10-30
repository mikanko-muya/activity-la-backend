import { NotFoundError } from "../../utils/errors/index.js";
import { toPaginated } from "../../utils/pagination.js";
import { checkExistBy } from "../../utils/resource.js";
import { eventRepository } from "../event/event.repository.js";
import { notificationRepository } from "./notification.repository.js";

const checkExist = checkExistBy(notificationRepository.findById, "Notification");
const checkEventExist = checkExistBy(eventRepository.findById, "Event");

const assertRelationsExist = async ({ userId, eventId, orderId, couponId }) => {
    const { user, event, order, coupon } = await notificationRepository.findRelations({
        userId,
        eventId,
        orderId,
        couponId,
    });

    if (!user) throw new NotFoundError("User not found");
    if (eventId && !event) throw new NotFoundError("Event not found");
    if (orderId && !order) throw new NotFoundError("Order not found");
    if (couponId && !coupon) throw new NotFoundError("Coupon not found");
};

export const notificationService = {
    async getMyNotifications(userId, query) {
        const result = await notificationRepository.findMany({ ...query, userId });
        return toPaginated(result, query);
    },

    async getMyUnreadCount(userId) {
        return { unread: await notificationRepository.countUnread(userId) };
    },

    async markAsRead(id, { actingUserId } = {}) {
        if (!actingUserId) {
            await checkExist(id);

            return notificationRepository.markAsRead(id);
        }

        const updated = await notificationRepository.markAsReadOwned(id, actingUserId);

        if (updated.count !== 1) {
            const notification = await notificationRepository.findById(id);
            if (!notification || notification.userId !== actingUserId) {
                throw new NotFoundError("Notification not found");
            }
        }

        return notificationRepository.findById(id);
    },

    async markAllAsRead(userId) {
        const updated = await notificationRepository.markAllAsRead(userId);
        return { updated: updated.count };
    },

    async deleteMyNotification(id, actingUserId) {
        const deleted = await notificationRepository.deleteOwned(id, actingUserId);
        if (deleted.count !== 1) throw new NotFoundError("Notification not found");

        return { id };
    },

    async getNotifications(query) {
        const result = await notificationRepository.findMany(query, { withUser: true });
        return toPaginated(result, query);
    },

    async getNotificationById(id) {
        return checkExist(id);
    },

    async countEventHolders(eventId) {
        await checkEventExist(eventId);
        return { recipients: (await notificationRepository.findTicketHolderIds(eventId)).length };
    },

    // One row per ticket holder, written in a single statement. Nobody holding
    // a ticket is not an error - it answers 0, and nothing is written.
    async notifyEventHolders(input) {
        await checkEventExist(input.eventId);
        const userIds = await notificationRepository.findTicketHolderIds(input.eventId);

        if (userIds.length > 0) {
            await notificationRepository.createMany(
                userIds.map((userId) => ({
                    userId,
                    eventId: input.eventId,
                    title: input.title,
                    titleEn: input.titleEn,
                    message: input.message,
                    messageEn: input.messageEn,
                    notifType: input.notifType,
                }))
            );
        }

        return { recipients: userIds.length };
    },

    async createNotification(input) {
        await assertRelationsExist(input);

        return notificationRepository.create(input);
    },

    async notifyUser(
        { userId, title, titleEn, message, messageEn, notifType, eventId = null, orderId = null, couponId = null },
        client
    ) {
        return notificationRepository.create(
            { userId, title, titleEn, message, messageEn, notifType, eventId, orderId, couponId },
            client
        );
    },

    async notifyUserSafely(input, client) {
        try {
            return await notificationService.notifyUser(input, client);
        } catch (error) {
            console.error(`Failed to create ${input.notifType} notification:`, error.message);
            return null;
        }
    },

    async deleteNotification(id) {
        await checkExist(id);

        return notificationRepository.delete(id);
    },
};
