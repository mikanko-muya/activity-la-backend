import { z } from "zod";
import { NotificationType } from "@prisma/client";

import { booleanFromText } from "../../utils/schema.js";

export const notificationIdSchema = z.object({
    id: z.string().uuid("Invalid notification id format"),
});

const listFields = {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    isRead: booleanFromText.optional(),
    notifType: z.enum(NotificationType).optional(),
    eventId: z.string().uuid("Invalid event id format").optional(),
    orderId: z.string().uuid("Invalid order id format").optional(),
    couponId: z.string().uuid("Invalid coupon id format").optional(),
    sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
};

export const getMyNotificationsSchema = z.object(listFields);

export const getNotificationsSchema = z.object({
    ...listFields,
    userId: z.string().uuid("Invalid user id format").optional(),
});

export const createNotificationSchema = z.object({
    userId: z.string().uuid("Invalid user id format"),
    eventId: z.string().uuid("Invalid event id format").optional(),
    orderId: z.string().uuid("Invalid order id format").optional(),
    couponId: z.string().uuid("Invalid coupon id format").optional(),
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    message: z.string().trim().min(1, "Message is required").max(1000, "Message is too long"),
    notifType: z.enum(NotificationType).default(NotificationType.SYSTEM),
});

// One message to everyone holding a paid ticket for an event - for when the
// event moves, is cancelled, or the doors open early.
export const eventHoldersNotificationSchema = z.object({
    eventId: z.string().uuid("Invalid event id format"),
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    message: z.string().trim().min(1, "Message is required").max(1000, "Message is too long"),
    notifType: z.enum(NotificationType).default(NotificationType.EVENT_REMINDER),
});

export const eventIdParamSchema = z.object({
    eventId: z.string().uuid("Invalid event id format"),
});
