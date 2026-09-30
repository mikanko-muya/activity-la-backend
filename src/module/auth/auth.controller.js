import { Router } from "express";

import { sendSuccess } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middleware/validation.js";
import { authService } from "./auth.service.js";
import { forgotPasswordSchema, loginSchema, registerSchema } from "./auth.schema.js";

const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        const data = await authService.register(req.body);
        return sendSuccess(res, { statusCode: 201, message: "Registration successful", data });
    })
);

router.post(
    "/login",
    validate(loginSchema),
    asyncHandler(async (req, res) => {
        const data = await authService.login(req.body);
        return sendSuccess(res, { statusCode: 200, message: "Login successful", data });
    })
);

router.post(
    "/forgot-password",
    validate(forgotPasswordSchema),
    asyncHandler(async (req, res) => {
        const data = await authService.forgotPassword(req.body);
        return sendSuccess(res, { statusCode: 200, message: "Password changed successfully", data });
    })
);

export default router;
