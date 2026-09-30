import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { venueService } from "./venue.service.js";
import { getVenuesSchema, venueIdSchema } from "./venue.schema.js";

const router = Router();

router.get(
    "/",
    validate(getVenuesSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await venueService.getVenues(req.query);
        return sendSuccess(res, { statusCode: 200, message: "Venues fetched successfully", data: result.data, meta: result.meta });
    })
);

router.get(
    "/:id",
    validate(venueIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await venueService.getVenueById(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Venue fetched successfully", data });
    })
);

export default router;
