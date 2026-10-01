import { Router } from "express";
import authRoutes from "../module/user/auth.routers.js";

const router = Router()

router.use("/auth", authRoutes);

export default router;