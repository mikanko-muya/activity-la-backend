import { z } from "zod";
import { EventStatus } from "@prisma/client";
import { required } from "zod/mini";

export const eventIdSchema = z.object({
  id: z.string().uuid("Invalid event id format"),
});

export const getEventsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(EventStatus).optional(),
  organizerId: z.string().uuid("Invalid organizer id format").optional(),
  venueId: z.string().uuid("Invalid venue id format").optional(),
  categoryId: z.string().uuid("Invalid category id format").optional(),
  sortBy: z.enum(["createdAt", "startAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255),
    description: z.string().trim().min(1, "Description is required"),
    startAt: z.coerce.date("stratAt is required"),
    endAt: z.coerce.date("endAt is required"),
    organizerId: z.string().uuid("Invalid organizer id format"),
    venueId: z.string().uuid("Invalid venue id format"),
    categoryId: z.string().uuid("Invalid category id format"),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "endAt must be later than startAt",
    path: ["endAt"],
  });

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255).optional(),
    description: z.string().trim().min(1, "Description is required").optional(),
    startAt: z.coerce.date("stratAt is required").optional(),
    endAt: z.coerce.date("endAt is required").optional(),
    organizerId: z.string().uuid("Invalid organizer id format").optional(),
    venueId: z.string().uuid("Invalid venue id format").optional(),
    categoryId: z.string().uuid("Invalid category id format").optional(),
  })
  .refine(
    (data) => {
      if (!data.startAt || !data.endAt) return true;

      return data.endAt > data.startAt;
    },
    {
      message: "endAt must be later than startAt",
      path: ["endAt"],
    },
  );
