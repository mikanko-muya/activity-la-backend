import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

export const getCategoryById = asyncHandler(async (req, res) => {
    const data = await categoryService.getCategoryById(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Category fetched successfully", data });
})

export const getCategories = asyncHandler(async (req, res) => {
    const data = await categoryService.getCategories(req.query);
    return sendSuccess(res, { statusCode: 200, message: "Categories fetched successfully", data , meta: data.meta });
})

export const createCategory = asyncHandler(async (req, res) => {
    const data = await categoryService.createCategory(req.body);
    return sendSuccess(res, { statusCode: 201, message: "Category created successfully", data });
})

export const updateCategory = asyncHandler(async (req, res) => {
    const data = await categoryService.updateCategory(req.body);
    return sendSuccess(res, { statusCode: 200, message: "Category updated successfully", data });
})

export const deleteCategory = asyncHandler(async (req, res) => {
    const data = await categoryService.deleteCategory(req.params.id);
    return sendSuccess(res, { statusCode: 201, message: "Category deleted successfully", data });
})


