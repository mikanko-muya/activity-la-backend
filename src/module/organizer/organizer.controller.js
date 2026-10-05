import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { upload } from "../../middleware/multer.js";
import { organizerService } from "./organizer.service.js";
import {
    createOrganizerSchema,
    getOrganizersSchema,
    organizerIdSchema,
    updateOrganizerSchema,
} from "./organizer.schema.js";

const router = Router();

router.get(
    "/",
    requirePermission(Permissions.organizer.read),
    validate(getOrganizersSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await organizerService.getOrganizers(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Organizers fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    })
);

router.get(
    "/:id",
    requirePermission(Permissions.organizer.read),
    validate(organizerIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await organizerService.getOrganizerById(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Organizer fetched successfully",
            data,
        });
    })
);

router.post(
    "/",
    requirePermission(Permissions.organizer.create),
    upload.single("logo"),
    validate(createOrganizerSchema),
    asyncHandler(async (req, res) => {
        const data = await organizerService.createOrganizer(req.body, req.file)
        return sendSuccess(res, { 
            statusCode: 201,
            message: "Organizer created successfully",
            data
             })
    })
)

router.patch(
    "/:id",
    requirePermission(Permissions.organizer.update),
    validate(organizerIdSchema, "params"),
    upload.single("logo"),
    validate(updateOrganizerSchema),
    asyncHandler(async (req, res) => {
        const data = await organizerService.updateOrganizer(req.params.id, req.body, req.file)
        return sendSuccess(res, { 
            statusCode: 200,
            message: "Organizer updated successfully",
            data
             })
    })
)

router.delete(
    "/:id",
    requirePermission(Permissions.organizer.delete),
    validate(organizerIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await organizerService.deleteOrganizer(req.params.id)
        return sendSuccess(res, {
            statusCode : 200,
            message : "Organizer deleted successfully",
            data
        })
    })
)

export default router;
