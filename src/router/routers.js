import express from "express";
import AuthControllers from "../controllers/auth.controller.js";
import { authorize } from "../middleware/role.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post('/auth/register', AuthControllers.register);
router.post('/auth/login', AuthControllers.login)

export default router;