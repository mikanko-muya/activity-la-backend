import { Router } from "express";

import { authenticate } from "../middleware/auth.js";

import auth from "../module/auth/auth.controller.js";
import user from "../module/user/user.controller.js";
import category from "../module/category/category.controller.js";
import event from "../module/event/event.controller.js";
import categoryPublic from "../module/category/category.public.controller.js";
import eventPublic from "../module/event/event.public.controller.js";

const router = Router();

router.use("/auth", auth);
router.use("/public/categories", categoryPublic);
router.use("/public/events", eventPublic);

router.use("/users", authenticate, user);
router.use("/categories", authenticate, category);
router.use("/events", authenticate, event);

export default router;
