import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { eventService } from "./event.service.js";

export const getEventById = asyncHandler(async (req, res) => {
  data = await eventService.getEventById(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Event fetched successfully", data });
});

// export const getEventsByCategory = asyncHandler(async (req, res) => {
//   data = await eventService.getEventById(req.params.categoryId, req.query);
//   return sendSuccess(res, { statusCode: 200, message: "Events fetched successfully", data, meta: date.meta });
// })

export const getEvents = asyncHandler(async (req, res) => {
  data = await eventService.getEventById(req.query);
  return sendSuccess(res, { statusCode: 200, message: "Events fetched successfully", data, meta: date.meta });
});

export const createEvent = asyncHandler(async (req, res) => {
  data = await eventService.createEvent(req.body, req.file);
  return sendSuccess(res, { statusCode: 201, message: "Event created successfully", data });
});

export const updateEvent = asyncHandler(async (req, res) => {
  data = await eventService.updateEvent(req.params.id, req.body, req.file);
  return sendSuccess(res, { statusCode: 200, message: "Event updated successfully", data })
});

export const deleteEvent = asyncHandler(async (req, res) => {
  data = await eventService.deleteEvent(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Event deleted successfully", data })
});

