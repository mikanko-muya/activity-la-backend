import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { orderService } from "./order.service.js";
import { createOrderSchema, getOrdersSchema, orderIdSchema } from "./order.schema.js";

const router = Router();

router.post(
    "/",
    validate(createOrderSchema),
    asyncHandler(async (req, res) => {
        const data = await orderService.createOrder(req.user.id, req.body);
        return sendSuccess(res, { statusCode: 201, message: "Order created successfully", data });
    })
);

router.get(
    "/me",
    asyncHandler(async (req, res) => {
        const data = await orderService.getOrdersByUserId(req.user.id);
        return sendSuccess(res, { statusCode: 200, message: "Orders fetched successfully", data });
    })
);

router.get(
    "/",
    requirePermission(Permissions.order.read),
    validate(getOrdersSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await orderService.getOrders(req.query);
        return sendSuccess(res, { statusCode: 200, message: "Orders fetched successfully", data: result.data, meta: result.meta });
    })
);

router.get(
    "/:id",
    requirePermission(Permissions.order.read),
    validate(orderIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await orderService.getOrderById(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Order fetched successfully", data });
    })
);

router.patch(
    "/:id/cancel",
    requirePermission(Permissions.order.cancel),
    validate(orderIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await orderService.cancelOrder(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Order cancelled successfully", data });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.order.delete),
    validate(orderIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await orderService.deleteOrder(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Order deleted successfully", data });
    })
);

export default router;
