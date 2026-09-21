import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { ticketTypeService } from "./ticketType.service.js";

export const getTicketTypeById = asyncHandler(async (req, res) => {
  data = await TicketTypeService.getTicketTypeById(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Ticket type fetched successfully", data });
});


export const getTicketTypes = asyncHandler(async (req, res) => {
  data = await TicketTypeService.getTicketTypeById(req.query);
  return sendSuccess(res, { statusCode: 200, message: "Ticke types fetched successfully", data, meta: date.meta });
});

export const createTicketType = asyncHandler(async (req, res) => {
  data = await TicketTypeService.createTicketType(req.body);
  return sendSuccess(res, { statusCode: 201, message: "Ticke type created successfully", data });
});

export const updateTicketType = asyncHandler(async (req, res) => {
  data = await TicketTypeService.updateTicketType(req.params.id, req.body);
  return sendSuccess(res, { statusCode: 200, message: "Ticket type updated successfully", data })
});

export const deleteTicketType = asyncHandler(async (req, res) => {
  data = await TicketTypeService.deleteTicketType(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Ticket type deleted successfully", data })
});


