import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { requirePermission } from "../../middleware/auth.js";
import { Permissions } from "../../config/permissions.js";
import { upload } from "../../config/multer.config.js";
import { categoryService } from "./category.service.js";
import { categoryIdSchema, createCategorySchema, updateCategorySchema } from "./category.schema.js";

const router = Router();

router.post(
    "/",
    requirePermission(Permissions.category.create),
    upload.single("icon"),
    validate(createCategorySchema),
    asyncHandler(async (req, res) => {
        const data = await categoryService.createCategory(req.body, req.file);
        return sendSuccess(res, { statusCode: 201, message: "Category created successfully", data });
    })
);

router.patch(
    "/:id",
    requirePermission(Permissions.category.update),
    validate(categoryIdSchema, "params"),
    upload.single("icon"),
    validate(updateCategorySchema),
    asyncHandler(async (req, res) => {
        const data = await categoryService.updateCategory(req.params.id, req.body, req.file);
        return sendSuccess(res, { statusCode: 200, message: "Category updated successfully", data });
    })
);

router.delete(
    "/:id",
    requirePermission(Permissions.category.delete),
    validate(categoryIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await categoryService.deleteCategory(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Category deleted successfully", data });
    })
);

export default router;
