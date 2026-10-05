import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { ticketTypeService } from "./ticketType.service.js";
import {
    createTicketTypeSchema,
    getTicketTypesSchema,
    ticketTypeIdSchema,
    updateTicketTypeSchema,
} from "./ticketType.schema.js";

const router = Router();

router.get(
    "/",
    requirePermission(Permissions.ticketType.read),
    validate(getTicketTypesSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await ticketTypeService.getTicketTypes(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Ticket types fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    })
);

router.post(
    "/",
    requirePermission(Permissions.ticketType.create),
    validate(createTicketTypeSchema),
    asyncHandler(async (req, res) => {
        const data = await ticketTypeService.createTicketType(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: "Ticket type created successfully",
            data,
        });
    })
);

router.get(
    "/:id",
    requirePermission(Permissions.ticketType.read),
    validate(ticketTypeIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await ticketTypeService.getTicketTypeById(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Ticket type fetched successfully",
            data,
        });
    })
);

router.patch(
    "/:id",
    requirePermission(Permissions.ticketType.update),
    validate(ticketTypeIdSchema, "params"),
    validate(updateTicketTypeSchema),
    asyncHandler(async (req, res) => {
        const data = await ticketTypeService.updateTicketType(req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Ticket type updated successfully",
            data,
        });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.ticketType.delete),
    validate(ticketTypeIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await ticketTypeService.deleteTicketType(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Ticket type deleted successfully",
            data,
        });
    })
);

export default router;
