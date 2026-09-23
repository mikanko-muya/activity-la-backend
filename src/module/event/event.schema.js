import { z } from "zod";
import { EventStatus } from "@prisma/client";
import { booleanFromText } from "../../utils/schema.js";

export const eventIdSchema = z.object({
    id: z.string().uuid("Invalid event id format"),
});

export const categoryIdParamSchema = z.object({
    categoryId: z.string().uuid("Invalid category id format"),
});

// startAt/endAt arrive as ISO strings; coerce.date() rejects unparseable input
// rather than silently producing an Invalid Date, which is what
// `new Date(startAt)` did in the old controller.

export const createEventSchema = z
    .object({
        title: z.string().trim().min(1, "Title is required").max(255),
        description: z.string().trim().min(1, "Description is required"),
        startAt: z.coerce.date({ message: "startAt must be a valid date" }),
        endAt: z.coerce.date({ message: "endAt must be a valid date" }),
        isFree: booleanFromText.optional(),
        organizerId: z.string().uuid("Invalid organizer id format"),
        venueId: z.string().uuid("Invalid venue id format"),
        categoryId: z.string().uuid("Invalid category id format"),
    })
    // The old controller accepted an event that ended before it started.
    .refine((data) => data.endAt > data.startAt, {
        message: "endAt must be after startAt",
        path: ["endAt"],
    });

export const updateEventSchema = z
    .object({
        title: z.string().trim().min(1, "Title is required").max(255).optional(),
        description: z.string().trim().min(1, "Description is required").optional(),
        startAt: z.coerce.date({ message: "startAt must be a valid date" }).optional(),
        endAt: z.coerce.date({ message: "endAt must be a valid date" }).optional(),
        isFree: booleanFromText.optional(),
        organizerId: z.string().uuid("Invalid organizer id format").optional(),
        venueId: z.string().uuid("Invalid venue id format").optional(),
        categoryId: z.string().uuid("Invalid category id format").optional(),
        eventStatus: z.enum(EventStatus).optional(),
    })
    // Only checkable when both are present; a partial update that moves just one
    // of them is validated against the stored event in the service.
    .refine((data) => !data.startAt || !data.endAt || data.endAt > data.startAt, {
        message: "endAt must be after startAt",
        path: ["endAt"],
    });

export const getEventsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    // Replaces the searchEvent handler, which was an empty try/catch that
    // returned nothing at all.
    search: z.string().trim().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    organizerId: z.string().uuid().optional(),
    venueId: z.string().uuid().optional(),
    eventStatus: z.enum(EventStatus).optional(),
    isFree: booleanFromText.optional(),
    sortBy: z.enum(["createdAt", "startAt", "title"]).default("startAt"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
