import { z } from "zod";
import { TicketTypeStatus } from "@prisma/client";

export const ticketTypeIdSchema = z.object({
    id: z.string().uuid("Invalid ticketType id format"),
});

export const getTicketTypesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    status: z.enum(TicketTypeStatus).optional(),
    eventId: z.string().uuid("Invalid event id format").optional(),
    sortBy: z.enum(["createdAt", "name", "price", "saleStart"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createTicketTypeSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required"),
        description: z.string().trim().optional(),
        satatus: z.enum(TicketTypeStatus).default("ACTIVE"),
        price: z.coerce.number("Price must be a number").positive("Price must be greater than 0"),
        quantity: z.coerce.number("Quantity must be a number").int().positive("Quantity must be greater than 0"),
        saleStart: z.string().optional().pipe(z.coerce.date("Invalid date format")),
        saleEnd: z.string().optional().pipe(z.coerce.date("Invalid date format")),
        eventId: z.string().uuid("Invalid event id format"),
    })
    .refine(
        (data) => {
            if (!data.saleStart || !data.saleEnd) return true;

            return data.saleEnd > data.saleStart;
        },
        {
            message: "saleEnd must be later than saleStart",
            path: ["saleEnd"],
        },
    );

export const updateticketTypeSchema = z
    .object({
        name: z.string().trim().optional(),
        description: z.string().trim().optional(),
        satatus: z.enum(TicketTypeStatus).optional(),
        price: z.coerce.number("Price must be a number").positive("Price must be greater than 0").optional(),
        quantity: z.coerce.number("Quantity must be a number").int().positive("Quantity must be greater than 0").optional(),
        saleStart: z.string().optional().pipe(z.coerce.date("Invalid date format")),
        saleEnd: z.string().optional().pipe(z.coerce.date("Invalid date format")),
        eventId: z.string().uuid("Invalid event id format").optional(),
    })
    .refine(
        (data) => {
            if (!data.saleStart || !data.saleEnd) return true;

            return data.saleEnd > data.saleStart;
        },
        {
            message: "saleEnd must be later than saleStart",
            path: ["saleEnd"],
        },
    );
