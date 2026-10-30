import { z } from "zod";
import { TicketTypeStatus } from "@prisma/client";

import { pairedTranslation } from "../../utils/schema.js";

export const ticketTypeIdSchema = z.object({
    id: z.string().uuid("Invalid ticketType id format"),
});

export const eventIdParamSchema = z.object({
    eventId: z.string().uuid("Invalid event id format"),
});

const listFields = {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    eventId: z.string().uuid("Invalid event id format").optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
};

export const getTicketTypesSchema = z.object({
    ...listFields,
    status: z.enum(TicketTypeStatus).optional(),
    sortBy: z.enum(["createdAt", "name", "nameEn", "price", "saleStart", "quantity"]).default("createdAt"),
});

export const getPublicTicketTypesSchema = z.object({
    ...listFields,
    sortBy: z.enum(["price", "name", "nameEn", "saleStart", "createdAt"]).default("price"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const saleWindowIsOrdered = (data) =>
    !data.saleStart || !data.saleEnd || data.saleEnd > data.saleStart;

const saleWindowError = {
    message: "saleEnd must be later than saleStart",
    path: ["saleEnd"],
};

export const createTicketTypeSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required"),
        nameEn: z.string().trim().min(1, "English name is required"),
        description: z.string().trim().optional(),
        descriptionEn: z.string().trim().optional(),
        status: z.enum(TicketTypeStatus).default(TicketTypeStatus.ACTIVE),
        price: z.coerce.number("Price must be a number").min(0, "Price cannot be negative"),
        quantity: z.coerce
            .number("Quantity must be a number")
            .int("Quantity must be an integer")
            .positive("Quantity must be greater than 0"),
        saleStart: z.coerce.date("Invalid date format").optional(),
        saleEnd: z.coerce.date("Invalid date format").optional(),
        eventId: z.string().uuid("Invalid event id format"),
    })
    .refine(saleWindowIsOrdered, saleWindowError)
    .superRefine(pairedTranslation("description"));

export const updateTicketTypeSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").optional(),
        nameEn: z.string().trim().min(1, "English name is required").optional(),
        description: z.string().trim().optional(),
        descriptionEn: z.string().trim().optional(),
        status: z.enum(TicketTypeStatus).optional(),
        price: z.coerce.number("Price must be a number").min(0, "Price cannot be negative").optional(),
        quantity: z.coerce
            .number("Quantity must be a number")
            .int("Quantity must be an integer")
            .positive("Quantity must be greater than 0")
            .optional(),
        saleStart: z.coerce.date("Invalid date format").optional(),
        saleEnd: z.coerce.date("Invalid date format").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required to update",
    })
    .refine(saleWindowIsOrdered, saleWindowError)
    .superRefine(pairedTranslation("description", { partial: true }));
