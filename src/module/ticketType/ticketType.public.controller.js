import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { ticketTypeService } from "./ticketType.service.js";
import { getPublicTicketTypesSchema, ticketTypeIdSchema } from "./ticketType.schema.js";

const router = Router();

router.get(
    "/",
    validate(getPublicTicketTypesSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await ticketTypeService.getPublicTicketTypes(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Ticket types fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    })
);

router.get(
    "/:id",
    validate(ticketTypeIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await ticketTypeService.getPublicTicketTypeById(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Ticket type fetched successfully",
            data,
        });
    })
);

export default router;
