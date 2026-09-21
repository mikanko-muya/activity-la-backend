import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { couponService } from "./coupon.service.js";

export const getCouponById = asyncHandler( async (req, res) => {
    const data = await couponService.getCouponById(req.params.id)
    return sendSuccess(res, {statusCode: 200, message: "Coupon fetched successfully", data})
})

export const getCoupons = asyncHandler( async (req, res) => {
    const data = await couponService.getCoupons(req.query)
    return sendSuccess(res, {statusCode: 200, message: "Coupons fetched successfully", data , meta: data.meta})
})

export const getCouponByCode = asyncHandler( async (req, res) => {
    const data = await couponService.getCouponByCode(req.body)
    return sendSuccess(res, {statusCode: 200, message: "Coupon fetched successfully", data})
})

export const createCoupon = asyncHandler( async (req, res) => {
    const data = await couponService.createCoupon(req.body)
    return sendSuccess(res, {statusCode: 200, message: "Coupons fetched successfully", data , meta: data.meta})
})

export const updateCoupon = asyncHandler( async (req, res) => {
    const data = await couponService.updateCoupon(req.params.id, req.body)
    return sendSuccess(res, {statusCode: 200, message: "Updated coupon Successfully", data})
})
    
export const deleteCoupon = asyncHandler( async (req, res) => {
    const data = await couponService.deleteCoupon(req.params.id)
    return sendSuccess(res, {statusCode: 200, message: "Deleted account successfully", data})
})



