import { z } from "zod"

export const registerSchema = z.object({
    name : z.string().trim().min(1, "Name is required").max(255),
    email: z.string().trim().email("Invalid email format"),
    phone: z.string().trim().min(6, "Phone is required"),
    password: z.string().trim().min(8, "Password must be at least 8 characters")
})

export const loginSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
    password: z.string().trim().min(1, "Password is required")
})

export const forgotPasswordSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
    newPassword: z.string().trim().min(8, "New password must be at least 6 characters")
})