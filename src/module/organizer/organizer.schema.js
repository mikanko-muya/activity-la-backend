import { z } from "zod";

import { pairedTranslation } from "../../utils/schema.js";

export const organizerIdSchema = z.object({
    id: z.string().uuid("Invalid organizer id format"),
})

const listFields = {
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
}

export const getOrganizersSchema = z.object({
    ...listFields,
    sortBy: z.enum(["name", "nameEn", "email", "phone", "createdAt"]).default("createdAt"),
})

export const getPublicOrganizersSchema = z.object({
    ...listFields,
    sortBy: z.enum(["name", "nameEn", "createdAt"]).default("createdAt"),
})

export const createOrganizerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    nameEn: z.string().trim().min(1, "English name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().trim().min(1, "Phone is required"),
    description: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
}).superRefine(pairedTranslation("description"))

export const updateOrganizerSchema = z.object({
    name: z.string().trim().min(1, "Name is required").optional(),
    nameEn: z.string().trim().min(1, "English name is required").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().trim().min(1, "Phone is required").optional(),
    description: z.string().trim().optional(),
    descriptionEn: z.string().trim().optional(),
}).superRefine(pairedTranslation("description", { partial: true }))
