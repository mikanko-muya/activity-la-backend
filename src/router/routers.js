import { Router } from "express";

import { authenticate } from "../middleware/auth.js";

import auth from "../module/auth/auth.controller.js";
import user from "../module/user/user.controller.js";
import category from "../module/category/category.controller.js";
import event from "../module/event/event.controller.js";
import venue from "../module/venue/venue.controller.js";
import order from "../module/order/order.controller.js";
import coupon from "../module/coupon/coupon.controller.js";
import organizer from "../module/organizer/organizer.controller.js";
import notification from "../module/notification/notification.controller.js";
import categoryPublic from "../module/category/category.public.controller.js";
import eventPublic from "../module/event/event.public.controller.js";
import venuePublic from "../module/venue/venue.public.controller.js";
import organizerPublic from "../module/organizer/organizer.public.controller.js";

const router = Router();

router.use("/auth", auth);
router.use("/public/categories", categoryPublic);
router.use("/public/events", eventPublic);
router.use("/public/venues", venuePublic);
router.use("/public/organizers", organizerPublic);

router.use("/users", authenticate, user);
router.use("/categories", authenticate, category);
router.use("/events", authenticate, event);
router.use("/venues", authenticate, venue);
router.use("/orders", authenticate, order);
router.use("/coupons", authenticate, coupon);
router.use("/organizers", authenticate, organizer);
router.use("/notifications", authenticate, notification);

export default router;
