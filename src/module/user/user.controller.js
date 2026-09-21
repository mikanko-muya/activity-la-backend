import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { userService } from "./user.service.js";

export const getUserById = asyncHandler( async (req, res) => {
    // FIX: this used to do `req.body.id = req.params.id` and pass req.body.
    // On Express 5 req.body is undefined for a GET with no JSON body, so the
    // assignment threw a TypeError - and the service wants an id string anyway.
    const data = await userService.getUserById(req.params.id)
    return sendSuccess(res, {statusCode: 200, message: "User fetched successfully", data})
})

export const getUsers = asyncHandler( async (req, res) => {
    const result = await userService.getUsers(req.query)
    // FIX: passed the whole {data, meta} object as `data`, nesting the payload
    // one level too deep and repeating meta inside it.
    return sendSuccess(res, {statusCode: 200, message: "Users fetched successfully", data: result.data, meta: result.meta})
})

export const createUser = asyncHandler( async (req, res) => {
    const data = await userService.createUser(req.body)
    // FIX: a create answers 201, not 200.
    return sendSuccess(res, {statusCode: 201, message: "User created successfully", data})
})

export const updateUser = asyncHandler( async (req, res) => {
    // FIX: called updateUser(req.params.id, req.file). The signature is
    // (id, input, file), so the multer file landed in the `input` slot and got
    // spread into the Prisma update as bogus columns (fieldname, buffer, ...).
    const data = await userService.updateUser(req.params.id, req.body, req.file)
    return sendSuccess(res, {statusCode: 200, message: "Updated user Successfully", data})
})

export const updateProfile = asyncHandler( async (req, res) => {
    // Self-service: always the caller's own row, never a :id from the URL, so
    // one user can't edit another's profile by changing the path.
    const data = await userService.updateUser(req.user.id, req.body, req.file)
    return sendSuccess(res, {statusCode: 200, message: "Updated profile Successfully", data})
})

export const changePassword = asyncHandler( async (req, res) => {
    // Same reasoning as updateProfile - a password change is only ever for the
    // authenticated caller, and it is verified against their old password.
    const data = await userService.changePassword(req.user.id, req.body)
    return sendSuccess(res, {statusCode: 200, message: "Password changed successfully", data})
})

export const deleteAccount = asyncHandler( async (req, res) => {
    // FIX: called userService.deleteAccount, but the service method is
    // deleteUser - this threw "is not a function".
    const data = await userService.deleteUser(req.params.id)
    return sendSuccess(res, {statusCode: 200, message: "Deleted account successfully", data})
})

export const getOrderHistory = asyncHandler( async (req, res) => {
    const data = await userService.getOrderHistory(req.params.id)
    return sendSuccess(res, {statusCode: 200, message: "Order history fetched successfully", data})
})
