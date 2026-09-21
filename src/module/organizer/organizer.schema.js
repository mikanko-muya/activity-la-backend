import { z } from "zod";

export const organizerIdSchema = z.object({
    id: z.string().uuid("Invalid organizer id format"),
})

export const getOrganizersSchema = z.object({
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["title", "email", "phone", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export const createOrganizerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().trim().min(1, "Phone is required"),
    description: z.string().trim().optional(),
})

export const updateOrganizerSchema = z.object({
    name: z.string().trim().optional(),
    emai: z.string().email("Invalid email format").optional(),
    phone: z.string().trim().min(1, "Phone is required").optional(),
    description: z.string().trim().optional(),
})