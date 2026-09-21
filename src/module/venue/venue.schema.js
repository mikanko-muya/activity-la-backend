import { z } from "zod";

export const venueIdSchema = z.object({
    id: z.string().uuid("Invalid venue id format"),
});

export const getVenuesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    sortBy: z.enum(["name", "address", "province", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createVenueSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(255),
    province: z.string().trim().min(1, "Province is required").max(255),
    address: z.string().trim().min(1, "Address is required"),
    mapUrl: z.string().url("Invalid URL format"),
});

export const updatevenueSchema = z.object({
    name: z.string().trim().max(255).optional(),
    province: z.string().trim().max(255).optional(),
    address: z.string().trim().optional(),
    mapUrl: z.string().url("Invalid URL format").optional(),
})

