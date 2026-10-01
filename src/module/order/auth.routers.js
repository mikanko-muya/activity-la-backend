import { Router } from "express";
import * as authController from "../module/auth/auth.controller.js"
import { validate } from "../middleware/validation.js";
import { upload } from "../middleware/multer.js";
import { registerSchema, loginSchema, forgotPasswordSchema } from "../module/auth/auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), authController.register);

router.post("/login", validate(loginSchema, "body"), authController.login);

// router.post("/refresh-token",validate(refreshTokenSchema, "body"), authController.refreshToken);

router.patch("/forgotPassword", validate(forgotPasswordSchema, "body"), authController.forgotPassword)

export default router;