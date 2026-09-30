import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const orderIdSchema = z.object({
  id: z.string().uuid("Invalid order id format"),
});

export const getOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(OrderStatus).optional(),
  eventId: z.string().uuid("Invalid event id format").optional(),
  userId: z.string().uuid("Invalid user id format").optional(),
  sortBy: z.enum(["createdAt","updatedAt","totalAmount",]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createOrderSchema = z.object({
  eventId: z.string().uuid("Invalid event id format"),
  ticketTypeId: z.string().uuid("Invalid ticket type id format"),
  quantity: z.coerce.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  couponCode: z.string().trim().min(1).toUpperCase().optional(),
});

export const cancelOrderSchema = z.object({id: z.string().uuid("Invalid order id format"),});