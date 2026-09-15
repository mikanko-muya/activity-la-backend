import express from "express";
import * as AuthControllers from "../module/auth/auth.controller.js";
import { validate } from "../middleware/validation.js"
import { registerSchema } from "../module/auth/auth.schema.js";
const router = express.Router();

router.post('/auth/register',validate(registerSchema) ,AuthControllers.register);
router.post('/auth/login', AuthControllers.login)

export default router;