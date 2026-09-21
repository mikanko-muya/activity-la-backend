import {z} from "zod"

export const categoryIdSchema = z.object({
    id: z.string().uuid("Invaid category id format")
})

export const createCategorySchema = z.object({
    name: z.string().trim().min(1, "Name are require"),
})

export const updateCategorySchema = z.object({
    name: z.string().trim().min(1, "Name are require").optional(),
})

export const getCategoriesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(), 
    sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
})




