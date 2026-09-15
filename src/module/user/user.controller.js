import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { userService } from "./user.service.js";

export const getUserById = asyncHandler( async (req, res) => {
    const data = await userService.getUserById(req.body)
    return sendSuccess(res, {statusCode: 200, message: "User fetched successfully", data})
})

export const getUsers = asyncHandler( async (req, res) => {
    const data = await userService.getUsers(req.query)
    return sendSuccess(res, {statusCode: 200, message: "Users fetched successfully", data , meta: data.meta})
})

export const createUser = asyncHandler( async (req, res) => {
    const data = await userService.getUsers(req.query)
    return sendSuccess(res, {statusCode: 200, message: "Users fetched successfully", data , meta: data.meta})
})

export const updateUser = asyncHandler( async (req, res) => {
    const data = await userService.updateUser(req.params.id, req.file)
    return sendSuccess(res, {statusCode: 200, message: "Updated user Successfully", data})
})
    
export const updateProfile = asyncHandler( async (req, res) => {
    const data = await userService.updateUser(req.params.id, req.file)
    return sendSuccess(res, {statusCode: 200, message: "Updated profile Successfully", data})
})

export const changePassword = asyncHandler( async (req, res) => {
    const data = await userService.changePassword(req.params.id, req.body)
    return sendSuccess(res, {statusCode: 200, message: "Password changed successfully", data})
})

export const deleteAccount = asyncHandler( async (req, res) => {
    const data = await userService.deleteAccount(req.params.id)
    return sendSuccess(res, {statusCode: 200, message: "Deleted account successfully", data})
})

export const getOrderHistory = asyncHandler( async (req, res) => {
    const data = await userService.getOrderHistory(req.params.id)
    return sendSuccess(res, {statusCode: 200, message: "Order history fetched successfully", data})
})

