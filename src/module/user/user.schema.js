import {optional, z} from "zod";
import { UserRole } from "@prisma/client";

export const userIdSchema = z.object({
    id: z.string().uuid("Invalid user id format")
})

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Username must be at least 1 characters").max(30,"Username must be at most 30 characters").optional(),
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
    limit: z.coerce.number().int().max(100).default(10),
    search: z.string().trim().min(1).optional(),
    role: z.enum(UserRole).optional(),
    isActive: z.boolean().optional(),
    sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
})