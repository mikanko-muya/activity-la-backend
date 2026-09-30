import { z } from "zod";
import { DiscountType } from "@prisma/client";
import { booleanFromText } from "../../utils/schema.js";

export const couponIdSchema = z.object({
  id: z.string().uuid("invalid coupon id format"),
});

export const couponCodeSchema = z.object({
  code: z.string().trim().min(1, "Coupon's code is required"),
});

export const createCouponSchema = z
  .object({
    code: z.string().trim().min(1, "Coupon's code is required").optional(),
    discountType: z.enum(DiscountType),
    discountValue: z
      .number()
      .positive("Discount value must be a positive number"),
    validFrom: z.coerce.date().default(() => new Date()),
    validTo: z.coerce.date(),
    usageLimit: z
      .number()
      .int()
      .positive("Usage limit must be a positive integer")
      .optional(),
  })
  .refine((date) => date.validTo > date.validFrom, {
    message: "validTO must be greater than validFrom",
    path: ["validTo"],
  })
  .refine(
    (percentage) =>
      percentage.discountType === "PERCENTAGE"
        ? percentage.discountValue <= 100
        : true,
    {
      message:
        "Discount value must be less than or equal to 100 for percentage discount type",
      path: ["discountValue"],
    },
  );

export const updateCouponSchema = z
  .object({
    code: z.string().trim().min(1, "Coupon's code is required").optional(),
    discountType: z.enum(DiscountType).optional(),
    discountValue: z
      .number()
      .positive("Discount value must be a positive number")
      .optional(),
    validFrom: z.coerce.date().optional(),
    validTo: z.coerce.date().optional(),
    usageLimit: z
      .number()
      .int()
      .positive("Usage limit must be a positive integer")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !data.validFrom || !data.validTo || data.validTo > data.validFrom,
    {
      message: "validTO must be greater than validFrom",
      path: ["validTo"],
    },
  )
  .refine(
    (percentage) =>
      percentage.discountType === "PERCENTAGE"
        ? percentage.discountValue <= 100
        : true,
    {
      message:
        "Discount value must be less than or equal to 100 for percentage discount type",
      path: ["discountValue"],
    },
  );

export const getCouponsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(["createdAt", "code"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  isActive: booleanFromText.optional(),
  discountType: z.enum(DiscountType).optional(),
});

// model Coupon {
//   id            String       @id @default(uuid()) @db.VarChar(36)
//   code          String       @unique
//   discountType  DiscountType
//   discountValue Decimal
//   validFrom     DateTime
//   validTo       DateTime
//   usageLimit    Int?
//   usedCount     Int          @default(0)
//   isActive      Boolean      @default(true)
//   createdAt     DateTime     @default(now())
//   updatedAt     DateTime     @updatedAt

//   orders Order[]
// }
