import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
// FIX: was `import { categorySeervice }` (typo) - the module exports
// `categoryService`, so this threw a SyntaxError on import and every handler
// below referenced an undefined `categoryService` anyway.
import { categoryService } from "./category.service.js";

export const getCategoryById = asyncHandler(async (req, res) => {
    const data = await categoryService.getCategoryById(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Category fetched successfully", data });
})

export const getCategories = asyncHandler(async (req, res) => {
    const result = await categoryService.getCategories(req.query);
    // FIX: passed the whole {data, meta} object as `data`, so the payload was
    // nested one level too deep and meta was duplicated.
    return sendSuccess(res, { statusCode: 200, message: "Categories fetched successfully", data: result.data, meta: result.meta });
})

export const createCategory = asyncHandler(async (req, res) => {
    // FIX: the uploaded icon (req.file) was never forwarded to the service.
    const data = await categoryService.createCategory(req.body, req.file);
    return sendSuccess(res, { statusCode: 201, message: "Category created successfully", data });
})

export const updateCategory = asyncHandler(async (req, res) => {
    // FIX: called updateCategory(req.body) - the id was never passed, so there
    // was no way to know which category to update.
    const data = await categoryService.updateCategory(req.params.id, req.body, req.file);
    return sendSuccess(res, { statusCode: 200, message: "Category updated successfully", data });
})

export const deleteCategory = asyncHandler(async (req, res) => {
    const data = await categoryService.deleteCategory(req.params.id);
    // FIX: returned 201 Created for a delete.
    return sendSuccess(res, { statusCode: 200, message: "Category deleted successfully", data });
})
