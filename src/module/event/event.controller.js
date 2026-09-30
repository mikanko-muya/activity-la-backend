import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { upload } from "../../config/multer.config.js";
import { eventService } from "./event.service.js";
import { createEventSchema, eventIdSchema, updateEventSchema } from "./event.schema.js";

const router = Router();

router.post(
    "/",
    requirePermission(Permissions.event.create),
    upload.single("cover"),
    validate(createEventSchema),
    asyncHandler(async (req, res) => {
        const data = await eventService.createEvent(req.body, req.file);
        return sendSuccess(res, { statusCode: 201, message: "Event created successfully", data });
    })
);

router.patch(
    "/:id",
    requirePermission(Permissions.event.update),
    validate(eventIdSchema, "params"),
    upload.single("cover"),
    validate(updateEventSchema),
    asyncHandler(async (req, res) => {
        const data = await eventService.updateEvent(req.params.id, req.body, req.file);
        return sendSuccess(res, { statusCode: 200, message: "Event updated successfully", data });
    })
);

router.patch(
    "/:id/publish",
    requirePermission(Permissions.event.publish),
    validate(eventIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await eventService.publishEvent(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Event published successfully", data });
    })
);

router.patch(
    "/:id/cancel",
    requirePermission(Permissions.event.publish),
    validate(eventIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await eventService.cancelEvent(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Event canceled successfully", data });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.event.delete),
    validate(eventIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await eventService.deleteEvent(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Event deleted successfully", data });
    })
);

export default router;
