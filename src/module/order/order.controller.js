import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { orderService } from "./order.service.js"

export const getOrders = asyncHandler(async (req, res) => {
    const result = await orderService.getOrders(req.query);
    return sendSuccess(res, { statusCode: 200, message: "Orders fetched successfully", data: result.data, meta: result.meta });
});

export const getOrderById = asyncHandler(async (req, res) => {
    const data = await orderService.getOrderById(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Order fetched successfully", data });
});

export const getOrdersByUserId = asyncHandler(async (req, res) => {
    const data = await orderService.getOrdersByUserId(req.user.id, req.query);
    return sendSuccess(res, { statusCode: 200, message: "Orders fetched successfully", data });
});

export const createOrder = asyncHandler(async (req, res) => {
    const data = await orderService.createOrder(req.user.id, req.body);
    return sendSuccess(res, { statusCode: 201, message: "Order created successfully", data });
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const data = await orderService.cancelOrder(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Order cancelled successfully", data });
});

export const deleteOrder = asyncHandler(async (req, res) => {
    const data = await orderService.deleteOrder(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Order deleted successfully", data });
});
