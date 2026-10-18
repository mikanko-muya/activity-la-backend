import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { notificationService } from "./notification.service.js";
import {
    createNotificationSchema,
    eventHoldersNotificationSchema,
    eventIdParamSchema,
    getMyNotificationsSchema,
    getNotificationsSchema,
    notificationIdSchema,
} from "./notification.schema.js";

const router = Router();

router.get(
    "/me",
    validate(getMyNotificationsSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await notificationService.getMyNotifications(req.user.id, req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notifications fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    })
);

router.get(
    "/me/unread-count",
    asyncHandler(async (req, res) => {
        const data = await notificationService.getMyUnreadCount(req.user.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Unread count fetched successfully",
            data,
        });
    })
);

router.patch(
    "/me/read-all",
    asyncHandler(async (req, res) => {
        const data = await notificationService.markAllAsRead(req.user.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notifications marked as read",
            data,
        });
    })
);

router.patch(
    "/me/:id/read",
    validate(notificationIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await notificationService.markAsRead(req.params.id, {
            actingUserId: req.user.id,
        });
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notification marked as read",
            data,
        });
    })
);

router.delete(
    "/me/:id",
    validate(notificationIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await notificationService.deleteMyNotification(req.params.id, req.user.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notification deleted successfully",
            data,
        });
    })
);

router.get(
    "/",
    requirePermission(Permissions.notification.read),
    validate(getNotificationsSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await notificationService.getNotifications(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notifications fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    })
);

router.get(
    "/event-holders/:eventId/count",
    requirePermission(Permissions.notification.create),
    validate(eventIdParamSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await notificationService.countEventHolders(req.params.eventId);
        return sendSuccess(res, { statusCode: 200, message: "Ticket holders counted", data });
    })
);

router.post(
    "/event-holders",
    requirePermission(Permissions.notification.create),
    validate(eventHoldersNotificationSchema),
    asyncHandler(async (req, res) => {
        const data = await notificationService.notifyEventHolders(req.body);
        return sendSuccess(res, { statusCode: 201, message: `Sent to ${data.recipients} ticket holder(s)`, data });
    })
);

router.post(
    "/",
    requirePermission(Permissions.notification.create),
    validate(createNotificationSchema),
    asyncHandler(async (req, res) => {
        const data = await notificationService.createNotification(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: "Notification created successfully",
            data,
        });
    })
);

router.get(
    "/:id",
    requirePermission(Permissions.notification.read),
    validate(notificationIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await notificationService.getNotificationById(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notification fetched successfully",
            data,
        });
    })
);

router.patch(
    "/:id/read",
    requirePermission(Permissions.notification.update),
    validate(notificationIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await notificationService.markAsRead(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notification marked as read",
            data,
        });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.notification.delete),
    validate(notificationIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await notificationService.deleteNotification(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Notification deleted successfully",
            data,
        });
    })
);

export default router;
