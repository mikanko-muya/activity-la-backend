import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { organizerService } from "./organizer.service.js";
import { getPublicOrganizersSchema, organizerIdSchema } from "./organizer.schema.js";

const router = Router();

router.get(
    "/",
    validate(getPublicOrganizersSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await organizerService.getPublicOrganizers(req.query);
        return sendSuccess(res, {
            statusCode : 200,
            message : "Organizers fetched successfully",
            data: result.data,
            meta: result.meta,
        })
        })
    );

router.get(
    "/:id",
    validate(organizerIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await organizerService.getPublicOrganizerById(req.params.id)
        return sendSuccess(res, { 
            statusCode : 200,
            message : "Organizer fetched successfully",
            data
        })
        })
    );

export default router;
