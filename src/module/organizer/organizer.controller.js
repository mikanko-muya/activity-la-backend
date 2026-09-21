import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { organizerService } from "./Organizer.service.js";

export const getOrganizerById = asyncHandler(async (req, res) => {
    const data = await organizerService.getOrganizerById(req.params.id)
    return sendSuccess(res, { statusCode: 200, message: "Organizer fetched successfully", data })
})

export const getOrganizers = asyncHandler(async (req, res) => {
    const data = await organizerService.getOrganizers(req.query)
    return sendSuccess(res, { statusCode: 200, message: "Organizers fetched successfully", data, meta: data.meta })
})

export const createOrganizer = asyncHandler(async (req, res) => {
    const data = await organizerService.createOrganizer(req.body, req.file)
    return sendSuccess(res, { statusCode: 200, message: "Organizers fetched successfully", data, meta: data.meta })
})

export const updateOrganizer = asyncHandler(async (req, res) => {
    const data = await organizerService.updateOrganizer(req.params.id, req.body, req.file)
    return sendSuccess(res, { statusCode: 200, message: "Updated Organizer Successfully", data })
})

export const deleteOrganizer = asyncHandler(async (req, res) => {
    const data = await organizerService.deleteOrganizer(req.params.id)
    return sendSuccess(res, { statusCode: 200, message: "Deleted account successfully", data })
})



