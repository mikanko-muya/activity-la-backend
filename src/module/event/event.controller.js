import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { eventService } from "./event.service.js";

export const getEvents = asyncHandler(async (req, res) => {
    const result = await eventService.getEvents(req.query);
    return sendSuccess(res, { statusCode: 200, message: "Events retrieved successfully", data: result.data, meta: result.meta });
});

export const getEventById = asyncHandler(async (req, res) => {
    const data = await eventService.getEventById(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Event retrieved successfully", data });
});

export const getEventsByCategory = asyncHandler(async (req, res) => {
    const result = await eventService.getEventsByCategory(req.params.categoryId, req.query);
    return sendSuccess(res, { statusCode: 200, message: "Events retrieved successfully", data: result.data, meta: result.meta });
});

export const createEvent = asyncHandler(async (req, res) => {
    const data = await eventService.createEvent(req.body, req.file);
    return sendSuccess(res, { statusCode: 201, message: "Event created successfully", data });
});

export const updateEvent = asyncHandler(async (req, res) => {
    const data = await eventService.updateEvent(req.params.id, req.body, req.file);
    return sendSuccess(res, { statusCode: 200, message: "Event updated successfully", data });
});

export const publishEvent = asyncHandler(async (req, res) => {
    const data = await eventService.publishEvent(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Event published successfully", data });
});

export const cancelEvent = asyncHandler(async (req, res) => {
    const data = await eventService.cancelEvent(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Event canceled successfully", data });
});

export const deleteEvent = asyncHandler(async (req, res) => {
    const data = await eventService.deleteEvent(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Event deleted successfully", data });
});
