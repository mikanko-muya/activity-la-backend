// FIX: dropped the stray `optional` import from zod - it was imported but never
// used, and it is not the helper this file wants anyway.
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Query strings are always text, so "true"/"false" has to be turned into a real
// boolean before Prisma sees it. z.boolean() alone rejected every request that
// passed ?isActive=.
const booleanFromQuery = z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => value === true || value === "true");

export const userIdSchema = z.object({
    id: z.string().uuid("Invalid user id format")
})

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Username must be at least 1 characters").max(30,"Username must be at most 30 characters").optional(),
})

// Admin-side create. Public signup uses registerSchema in the auth module.
export const createUserSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(30, "Username must be at most 30 characters"),
    email: z.string().trim().email("Invalid email format"),
    phone: z.string().trim().min(6, "Phone is required"),
    password: z.string().trim().min(8, "Password must be at least 8 characters"),
    role: z.enum(UserRole).optional(),
    isActive: z.boolean().optional(),
})

export const updateUserSchema = z.object({
    name: z.string().trim().min(1, "Username must be at least 1 characters").max(30,"Username must be at most 30 characters").optional(),
    email: z.string().trim().email("Invalid email format").optional(),
    phone: z.string().trim().min(6, "Phone is required").optional(),
    password: z.string().trim().min(8, "Password must be at least 8 characters").optional(),
    role: z.enum(UserRole).optional(),
    isActive: z.boolean().optional(),
})


export const changePasswordSchema = z.object({
    oldPassword : z.string().min(1, "Old password are required"),
    newPassword : z.string().min(8, "New password must be at least 8 characters")
})

export const getUsersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    // FIX: added the missing .min(1) - ?limit=0 produced take: 0, and a negative
    // limit made Prisma throw.
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
    role: z.enum(UserRole).optional(),
    isActive: booleanFromQuery.optional(),
    sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
})
