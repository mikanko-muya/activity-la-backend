import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export const paymentIdSchema = z.object({
    id: z.string().uuid("Invalid payment id format"),
});

const listFields = {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(PaymentStatus).optional(),
    method: z.enum(PaymentMethod).optional(),
    orderId: z.string().uuid("Invalid order id format").optional(),
    sortBy: z.enum(["createdAt", "paidAt", "amount"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
};

export const getMyPaymentsSchema = z.object(listFields);

export const getPaymentsSchema = z.object({
    ...listFields,
    userId: z.string().uuid("Invalid user id format").optional(),
});

export const createPaymentSchema = z.object({
    orderId: z.string().uuid("Invalid order id format"),
    method: z.enum(PaymentMethod),
});

export const settlePaymentSchema = z.object({
    transactionRef: z.string().trim().min(1, "transactionRef is required"),
    status: z.enum([PaymentStatus.SUCCESS, PaymentStatus.FAILED]),
    paidAt: z.coerce.date("Invalid date format").optional(),
    failureReason: z.string().trim().max(500).optional(),
});
