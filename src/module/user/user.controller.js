import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { upload } from "../../config/multer.config.js";
import { userService } from "./user.service.js";
import {
    assignRoleSchema,
    changePasswordSchema,
    createUserSchema,
    getUsersSchema,
    updateProfileSchema,
    updateUserSchema,
    userIdSchema,
} from "./user.schema.js";

const router = Router();

router.patch(
    "/me",
    upload.single("profile"),
    validate(updateProfileSchema),
    asyncHandler(async (req, res) => {
        const data = await userService.updateUser(req.user.id, req.body, req.file);
        return sendSuccess(res, { statusCode: 200, message: "Updated profile Successfully", data });
    })
);

router.patch(
    "/me/password",
    validate(changePasswordSchema),
    asyncHandler(async (req, res) => {
        const data = await userService.changePassword(req.user.id, req.body);
        return sendSuccess(res, { statusCode: 200, message: "Password changed successfully", data });
    })
);

router.get(
    "/",
    requirePermission(Permissions.user.read),
    validate(getUsersSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await userService.getUsers(req.query);
        return sendSuccess(res, { statusCode: 200, message: "Users fetched successfully", data: result.data, meta: result.meta });
    })
);

router.post(
    "/",
    requirePermission(Permissions.user.create),
    validate(createUserSchema),
    asyncHandler(async (req, res) => {
        const data = await userService.createUser(req.body);
        return sendSuccess(res, { statusCode: 201, message: "User created successfully", data });
    })
);

router.get(
    "/:id",
    requirePermission(Permissions.user.read),
    validate(userIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await userService.getUserById(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "User fetched successfully", data });
    })
);

router.patch(
    "/:id",
    requirePermission(Permissions.user.update),
    validate(userIdSchema, "params"),
    upload.single("profile"),
    validate(updateUserSchema),
    asyncHandler(async (req, res) => {
        const data = await userService.updateUser(req.params.id, req.body, req.file);
        return sendSuccess(res, { statusCode: 200, message: "Updated user Successfully", data });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.user.delete),
    validate(userIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await userService.deleteUser(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Deleted account successfully", data });
    })
);

router.patch(
    "/:id/role",
    requirePermission(Permissions.user.assignRole),
    validate(userIdSchema, "params"),
    validate(assignRoleSchema),
    asyncHandler(async (req, res) => {
        const data = await userService.assignRole(req.params.id, req.body.role);
        return sendSuccess(res, { statusCode: 200, message: "Role assigned successfully", data });
    })
);

router.get(
    "/:id/order-history",
    requirePermission(Permissions.user.read),
    validate(userIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await userService.getOrderHistory(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Order history fetched successfully", data });
    })
);

export default router;
