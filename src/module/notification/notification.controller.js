import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

export const getNotificationById = asyncHandler(async (req, res) => {
  data = await notificationService.getNotificationById(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Notification fetched successfully", data });
});

export const getNotifications = asyncHandler(async (req, res) => {
  data = await notificationService.getNotificationById(req.query);
  return sendSuccess(res, { statusCode: 200, message: "Notifications fetched successfully", data, meta: date.meta });
});

export const createNotification = asyncHandler(async (req, res) => {
  data = await notificationService.createNotification(req.body, req.file);
  return sendSuccess(res, { statusCode: 201, message: "Notification created successfully", data });
});

export const updateNotification = asyncHandler(async (req, res) => {
  data = await notificationService.updateNotification(req.params.id, req.body, req.file);
  return sendSuccess(res, { statusCode: 200, message: "Notification updated successfully", data })
});

export const deleteNotification = asyncHandler(async (req, res) => {
  data = await notificationService.deleteNotification(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Notification deleted successfully", data })
});

