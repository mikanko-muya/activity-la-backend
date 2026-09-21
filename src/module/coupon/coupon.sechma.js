import { z } from "zod";
import { DiscountType } from "@prisma/client";

export const couponIdSchema = z.object({
    id: z.string().uuid("Invalid coupon id format"),
});

export const getCouponsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    isUsed: z.stringbool().optional(),
    eventId: z.string().uuid("Invalid event id format").optional(),
    sortBy: z.enum(["code", "discountValue", "validFrom", "validTo", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createCouponSchema = z
    .object({
        code: z.string().trim().min(1, "Coupon code is required").toUpperCase(),
        discountType: z.enum(DiscountType).default("FIXED"),
        discountValue: z.coerce.number("Discount value mush be a number").positive("Discount value must be greater than 0"),
        validFrom: z.string().min(1, "validFrom is required").pipe(z.coerce.date("Invalid validFrom")),
        validTo: z.string().min(1, "validTo is required").pipe(z.coerce.date("Invalid validTo")),
        eventId: z.string().uuid("Invalid event id format"),
    })
    .refine((data) => data.validTo > data.validFrom, {
        message: "validTo must be later than validFrom",
        path: ["endAt"],
    });

export const updateCouponSchema = z
    .object({
        code: z.string().trim().min(1, "Coupon code is required").toUpperCase().optional(),
        discountType: z.enum(DiscountType).default("FIXED").optional(),
        discountValue: z.coerce.number("Discount value mush be a number").positive("Discount value must be greater than 0").optional(),
        validFrom: z.string().min(1, "validFrom is required").pipe(z.coerce.date("Invalid validFrom")).optional(),
        validTo: z.string().min(1, "validTo is required").pipe(z.coerce.date("Invalid validTo")).optional,
        eventId: z.string().uuid("Invalid event id format"),
    })
    .refine((data) => {
        if (!data.validFrom || !data.validTo) return true;
        return data.validTo > data.validFrom
    },
        {
            message: "validTo must be later than validFrom",
            path: ["endAt"],
        });
