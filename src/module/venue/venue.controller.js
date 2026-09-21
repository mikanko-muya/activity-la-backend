import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { venueService } from "./venue.repository.js";

export const getVenueById = asyncHandler(async (req, res) => {
  data = await venueService.getVenueById(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Venue fetched successfully", data });
});

export const getVenues = asyncHandler(async (req, res) => {
  data = await VenueService.getVenueById(req.query);
  return sendSuccess(res, { statusCode: 200, message: "Venues fetched successfully", data, meta: date.meta });
});

export const createVenue = asyncHandler(async (req, res) => {
  data = await VenueService.createVenue(req.body);
  return sendSuccess(res, { statusCode: 201, message: "Venue created successfully", data });
});

export const updateVenue = asyncHandler(async (req, res) => {
  data = await VenueService.updateVenue(req.params.id, req.body);
  return sendSuccess(res, { statusCode: 200, message: "Venue updated successfully", data })
});

export const deleteVenue = asyncHandler(async (req, res) => {
  data = await VenueService.deleteVenue(req.params.id);
  return sendSuccess(res, { statusCode: 200, message: "Venue deleted successfully", data })
});
