import { sendSuccess } from "../../utils/response.js";
import { authService } from "./aurh.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js"


export const register = asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    return sendSuccess(res, { statusCode: 201, message:"Registration successful" , data })
})

export const login = asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    return sendSuccess(res, { statusCode: 200, message:"Login successful" , data })
})

export const forgotPassword = asyncHandler(async (req, res) => {
    const data = await authService.forgotPassword(req.body);
    return sendSuccess(res, { statusCode: 200, message:"'Password changed successfully" , data })
})

