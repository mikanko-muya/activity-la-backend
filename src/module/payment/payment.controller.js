import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { paymentService } from "./payment.service.js";
import {
    createPaymentSchema,
    getMyPaymentsSchema,
    getPaymentsSchema,
    paymentIdSchema,
} from "./payment.schema.js";
import { orderIdSchema } from "../order/order.schema.js";

const router = Router();

router.post(
    "/",
    validate(createPaymentSchema),
    asyncHandler(async (req, res) => {
        const data = await paymentService.createPayment(req.user.id, req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: "Payment started successfully",
            data,
        });
    })
);

router.get(
    "/me",
    validate(getMyPaymentsSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await paymentService.getMyPayments(req.user.id, req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Payments fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    })
);

router.get(
    "/me/:id",
    validate(paymentIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await paymentService.getPaymentById(req.params.id, {
            actingUserId: req.user.id,
        });
        return sendSuccess(res, {
            statusCode: 200,
            message: "Payment fetched successfully",
            data,
        });
    })
);

router.get(
    "/me/orders/:id/tickets",
    validate(orderIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await paymentService.getMyOrderTickets(req.params.id, req.user.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Tickets fetched successfully",
            data,
        });
    })
);

router.get(
    "/",
    requirePermission(Permissions.payment.read),
    validate(getPaymentsSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await paymentService.getPayments(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Payments fetched successfully",
            data: result.data,
            meta: result.meta,
        });
    })
);

router.get(
    "/:id",
    requirePermission(Permissions.payment.read),
    validate(paymentIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await paymentService.getPaymentById(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: "Payment fetched successfully",
            data,
        });
    })
);

export default router;
