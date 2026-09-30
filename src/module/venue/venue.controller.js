import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { venueService } from "./venue.service.js";
import { createVenueSchema, updatevenueSchema, venueIdSchema } from "./venue.schema.js";

const router = Router();

router.post(
    "/",
    requirePermission(Permissions.venue.create),
    validate(createVenueSchema),
    asyncHandler(async (req, res) => {
        const data = await venueService.createVenue(req.body);
        return sendSuccess(res, { statusCode: 201, message: "Venue created successfully", data });
    })
);

router.patch(
    "/:id",
    requirePermission(Permissions.venue.update),
    validate(venueIdSchema, "params"),
    validate(updatevenueSchema),
    asyncHandler(async (req, res) => {
        const data = await venueService.updateVenue(req.params.id, req.body);
        return sendSuccess(res, { statusCode: 200, message: "Venue updated successfully", data });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.venue.delete),
    validate(venueIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await venueService.deleteVenue(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Venue deleted successfully", data });
    })
);

export default router;
