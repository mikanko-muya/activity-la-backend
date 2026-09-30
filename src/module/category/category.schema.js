import { z } from "zod"

export const categoryIdSchema = z.object({
    id: z.string().uuid("Invalid category id format")
})

export const createCategorySchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
    iconUrl : z.string().optional(),

})

export const updateCategorySchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional()
})

export const getCategoriesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
    sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
})

//   id           String  @id @default(uuid()) @db.VarChar(36)
//   name         String  @unique
//   iconUrl      String?
//   iconPublicId String?

//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt