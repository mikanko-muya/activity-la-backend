import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { couponService } from "./coupon.service.js";
import {
    couponCodeSchema,
    couponIdSchema,
    createCouponSchema,
    getCouponsSchema,
    updateCouponSchema,
} from "./coupon.schema.js";

const router = Router();

router.get(
    "/code/:code",
    validate(couponCodeSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await couponService.getUsableCouponByCode(req.params.code, {
            eventId: req.query.eventId,
            userId: req.user.id,
        });
        return sendSuccess(res, { statusCode: 200, message: "Coupon is valid", data });
    })
);

router.get(
    "/generate-code",
    requirePermission(Permissions.coupon.create),
    asyncHandler(async (req, res) => {
        const data = couponService.generateCode();
        return sendSuccess(res, { statusCode: 200, message: "Coupon code generated", data });
    })
);

router.get(
    "/",
    requirePermission(Permissions.coupon.read),
    validate(getCouponsSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await couponService.getCoupons(req.query);
        return sendSuccess(res, { statusCode: 200, message: "Coupons fetched successfully", data: result.data, meta: result.meta });
    })
);

router.post(
    "/",
    requirePermission(Permissions.coupon.create),
    validate(createCouponSchema),
    asyncHandler(async (req, res) => {
        const data = await couponService.createCoupon(req.body);
        return sendSuccess(res, { statusCode: 201, message: "Coupon created successfully", data });
    })
);

router.get(
    "/:id",
    requirePermission(Permissions.coupon.read),
    validate(couponIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await couponService.getCouponById(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Coupon fetched successfully", data });
    })
);

router.patch(
    "/:id",
    requirePermission(Permissions.coupon.update),
    validate(couponIdSchema, "params"),
    validate(updateCouponSchema),
    asyncHandler(async (req, res) => {
        const data = await couponService.updateCoupon(req.params.id, req.body);
        return sendSuccess(res, { statusCode: 200, message: "Coupon updated successfully", data });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.coupon.delete),
    validate(couponIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await couponService.deleteCoupon(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Coupon deleted successfully", data });
    })
);

export default router;
