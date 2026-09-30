import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { eventService } from "./event.service.js";
import { categoryIdParamSchema, eventIdSchema, getEventsSchema } from "./event.schema.js";

const router = Router();

router.get(
    "/",
    validate(getEventsSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await eventService.getEvents(req.query);
        return sendSuccess(res, { statusCode: 200, message: "Events retrieved successfully", data: result.data, meta: result.meta });
    })
);

router.get(
    "/category/:categoryId",
    validate(categoryIdParamSchema, "params"),
    validate(getEventsSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await eventService.getEventsByCategory(req.params.categoryId, req.query);
        return sendSuccess(res, { statusCode: 200, message: "Events retrieved successfully", data: result.data, meta: result.meta });
    })
);

router.get(
    "/:id",
    validate(eventIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await eventService.getEventById(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Event retrieved successfully", data });
    })
);

export default router;
