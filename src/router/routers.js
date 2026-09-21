import express from "express";

import { validate } from "../middleware/validation.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { upload } from "../config/multer.config.js";

import * as AuthControllers from "../module/auth/auth.controller.js";
import { forgotPasswordSchema, loginSchema, registerSchema } from "../module/auth/auth.schema.js";

import * as UserControllers from "../module/user/user.controller.js";
import {
    changePasswordSchema,
    createUserSchema,
    getUsersSchema,
    updateProfileSchema,
    updateUserSchema,
    userIdSchema,
} from "../module/user/user.schema.js";

import * as EventControllers from "../module/event/event.controller.js";
import {
    categoryIdParamSchema,
    createEventSchema,
    eventIdSchema,
    getEventsSchema,
    updateEventSchema,
} from "../module/event/event.schema.js";

import * as CategoryControllers from "../module/category/category.controller.js";
import {
    categoryIdSchema,
    createCategorySchema,
    getCategoriesSchema,
    updateCategorySchema,
} from "../module/category/category.schema.js";

const router = express.Router();

/* ---------------------------------- auth ---------------------------------- */

router.post('/auth/register', validate(registerSchema), AuthControllers.register);
// FIX: login had no validation at all, so a request with no phone reached the
// service and turned into a Prisma error instead of a clean 400.
router.post('/auth/login', validate(loginSchema), AuthControllers.login);
// FIX: the forgotPassword controller existed but was never routed - it was
// unreachable dead code.
router.post('/auth/forgot-password', validate(forgotPasswordSchema), AuthControllers.forgotPassword);

/* ---------------------------------- users ---------------------------------- */
// Self-service routes come before /users/:id so "me" is never parsed as an id.

router.patch(
    '/users/me',
    authenticate,
    upload.single('profile'),
    validate(updateProfileSchema),
    UserControllers.updateProfile
);
router.patch(
    '/users/me/password',
    authenticate,
    validate(changePasswordSchema),
    UserControllers.changePassword
);

router.get('/users', authenticate, authorize('ADMIN'), validate(getUsersSchema, 'query'), UserControllers.getUsers);
router.post('/users', authenticate, authorize('ADMIN'), validate(createUserSchema), UserControllers.createUser);
router.get('/users/:id', authenticate, authorize('ADMIN'), validate(userIdSchema, 'params'), UserControllers.getUserById);
router.patch(
    '/users/:id',
    authenticate,
    authorize('ADMIN'),
    validate(userIdSchema, 'params'),
    upload.single('profile'),
    validate(updateUserSchema),
    UserControllers.updateUser
);
router.delete('/users/:id', authenticate, authorize('ADMIN'), validate(userIdSchema, 'params'), UserControllers.deleteAccount);
router.get('/users/:id/order-history', authenticate, authorize('ADMIN'), validate(userIdSchema, 'params'), UserControllers.getOrderHistory);

/* -------------------------------- categories -------------------------------- */
// Reads are public; writes are admin-only.

router.get('/categories', validate(getCategoriesSchema, 'query'), CategoryControllers.getCategories);
router.get('/categories/:id', validate(categoryIdSchema, 'params'), CategoryControllers.getCategoryById);
router.post(
    '/categories',
    authenticate,
    authorize('ADMIN'),
    upload.single('icon'),
    validate(createCategorySchema),
    CategoryControllers.createCategory
);
router.patch(
    '/categories/:id',
    authenticate,
    authorize('ADMIN'),
    validate(categoryIdSchema, 'params'),
    upload.single('icon'),
    validate(updateCategorySchema),
    CategoryControllers.updateCategory
);
router.delete('/categories/:id', authenticate, authorize('ADMIN'), validate(categoryIdSchema, 'params'), CategoryControllers.deleteCategory);

/* ---------------------------------- events ---------------------------------- */
// Ported from the version2.0 controller. Reads are public; writes are admin-only,
// matching categories. ?search= replaces the old empty searchEvent handler.

router.get('/events', validate(getEventsSchema, 'query'), EventControllers.getEvents);
router.get('/events/category/:categoryId', validate(categoryIdParamSchema, 'params'), validate(getEventsSchema, 'query'), EventControllers.getEventsByCategory);
router.get('/events/:id', validate(eventIdSchema, 'params'), EventControllers.getEventById);
router.post(
    '/events',
    authenticate,
    authorize('ADMIN'),
    upload.single('cover'),
    validate(createEventSchema),
    EventControllers.createEvent
);
router.patch(
    '/events/:id',
    authenticate,
    authorize('ADMIN'),
    validate(eventIdSchema, 'params'),
    upload.single('cover'),
    validate(updateEventSchema),
    EventControllers.updateEvent
);
router.patch('/events/:id/publish', authenticate, authorize('ADMIN'), validate(eventIdSchema, 'params'), EventControllers.publishEvent);
router.patch('/events/:id/cancel', authenticate, authorize('ADMIN'), validate(eventIdSchema, 'params'), EventControllers.cancelEvent);
router.delete('/events/:id', authenticate, authorize('ADMIN'), validate(eventIdSchema, 'params'), EventControllers.deleteEvent);

export default router;
