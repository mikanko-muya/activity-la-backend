import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { validate } from "../../middleware/validation.js";
import { categoryService } from "./category.service.js";
import { categoryIdSchema, getCategoriesSchema } from "./category.schema.js";

const router = Router();

router.get(
    "/",
    validate(getCategoriesSchema, "query"),
    asyncHandler(async (req, res) => {
        const result = await categoryService.getCategories(req.query);
        return sendSuccess(res, { statusCode: 200, message: "Categories fetched successfully", data: result.data, meta: result.meta });
    })
);

router.get(
    "/:id",
    validate(categoryIdSchema, "params"),
    asyncHandler(async (req, res) => {
        const data = await categoryService.getCategoryById(req.params.id);
        return sendSuccess(res, { statusCode: 200, message: "Category fetched successfully", data });
    })
);

export default router;
