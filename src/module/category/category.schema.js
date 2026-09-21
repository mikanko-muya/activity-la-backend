import { z } from "zod"

export const categoryIdSchema = z.object({
    id: z.string().uuid("Invalid category id format")
})

export const createCategorySchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters")
})

export const updateCategorySchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional()
})

// Query strings arrive as text, so page/limit are coerced and the defaults here
// are what categoryRepository.findMany relies on for skip/take.
export const getCategoriesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
    sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
})
