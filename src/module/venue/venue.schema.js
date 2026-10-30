import { z } from "zod";

export const venueIdSchema = z.object({
    id: z.string().uuid("Invalid venue id format"),
});

export const getVenuesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    sortBy: z.enum(["name", "nameEn", "address", "addressEn", "province", "provinceEn", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createVenueSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(255),
    nameEn: z.string().trim().min(1, "English name is required").max(255),
    province: z.string().trim().min(1, "Province is required").max(255),
    provinceEn: z.string().trim().min(1, "English province is required").max(255),
    address: z.string().trim().min(1, "Address is required").max(191),
    addressEn: z.string().trim().min(1, "English address is required").max(191),
    mapUrl: z.string().url("Invalid URL format"),
});

// min(1) on each, or an edit could blank a venue's name - optional means "may
// be left out", not "may be emptied".
export const updatevenueSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(255).optional(),
    nameEn: z.string().trim().min(1, "English name is required").max(255).optional(),
    province: z.string().trim().min(1, "Province is required").max(255).optional(),
    provinceEn: z.string().trim().min(1, "English province is required").max(255).optional(),
    address: z.string().trim().min(1, "Address is required").max(191).optional(),
    addressEn: z.string().trim().min(1, "English address is required").max(191).optional(),
    mapUrl: z.string().url("Invalid URL format").optional(),
})

