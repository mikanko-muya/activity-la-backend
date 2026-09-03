import express from "express";
import AuthControllers from "../controllers/auth.controllers.js";

const router = express.Router();

router.post('/auth/register', AuthControllers.register);
router.post('/auth/login', AuthControllers.login)

export default router;