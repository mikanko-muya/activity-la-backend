import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { couponService } from "./coupon.service.js";

export const getCouponById = asyncHandler( async(req, res) => {
    const data = await couponService.getCouponById(req.params.id);
    return sendSuccess(res, {
        statusCode : 200,
        message : "Coupon fetched successfully",
        data
    })
});

export const getCoupons = asyncHandler(async(req,res) => {
    const result = await couponService.getCoupons(req.query);
    return sendSuccess(res, {
        statusCode : 200,
        message : "Coupons fetched successfully",
        data : result.data,
        meta : result.meta
    })
});

export const createCoupon = asyncHandler(async(req, res) => {
    const data = await couponService.createCoupon(req.body, req.files);
    return sendSuccess(res, {
        statusCode : 201,
        message : "Coupon created successfully",
        data
    })
});

export const updateCoupon = asyncHandler(async(req, res) => {
    const data = await couponService.updateCoupon(req.body,req.params.id,req.files);
    return sendSuccess(res, {
        statusCode : 200,
        message : "Coupon updated successfully",
        data
    })
});

export const deleteCoupon = asyncHandler(async(req, res) => {
    const data = await couponService.deleteCoupon(req.params.id);
    return sendSuccess(res, {
        statusCode : 200,
        message : "Coupon deleted successfully",
        data
    });
})