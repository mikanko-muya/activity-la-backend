import { Router } from "express";

import { authenticate } from "../middleware/auth.js";
import { readLanguage } from "../middleware/language.js";

import auth from "../module/auth/auth.controller.js";
import user from "../module/user/user.controller.js";
import category from "../module/category/category.controller.js";
import event from "../module/event/event.controller.js";
import venue from "../module/venue/venue.controller.js";
import order from "../module/order/order.controller.js";
import coupon from "../module/coupon/coupon.controller.js";
import organizer from "../module/organizer/organizer.controller.js";
import notification from "../module/notification/notification.controller.js";
import ticketType from "../module/ticketType/ticketType.controller.js";
import payment from "../module/payment/payment.controller.js";
import dashboard from "../module/dashboard/dashboard.controller.js";
import categoryPublic from "../module/category/category.public.controller.js";
import eventPublic from "../module/event/event.public.controller.js";
import venuePublic from "../module/venue/venue.public.controller.js";
import organizerPublic from "../module/organizer/organizer.public.controller.js";
import ticketTypePublic from "../module/ticketType/ticketType.public.controller.js";
import paymentWebhook from "../module/payment/payment.webhook.controller.js";

const router = Router();

router.use(readLanguage);

router.use("/auth", auth);
router.use("/public/categories", categoryPublic);
router.use("/public/events", eventPublic);
router.use("/public/venues", venuePublic);
router.use("/public/organizers", organizerPublic);
router.use("/public/ticket-types", ticketTypePublic);
router.use("/payments/webhook", paymentWebhook);

router.use("/users", authenticate, user);
router.use("/categories", authenticate, category);
router.use("/events", authenticate, event);
router.use("/venues", authenticate, venue);
router.use("/orders", authenticate, order);
router.use("/coupons", authenticate, coupon);
router.use("/organizers", authenticate, organizer);
router.use("/notifications", authenticate, notification);
router.use("/ticket-types", authenticate, ticketType);
router.use("/payments", authenticate, payment);
router.use("/dashboard", authenticate, dashboard);

export default router;
