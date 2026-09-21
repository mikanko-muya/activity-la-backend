import { prisma } from "../../config/prisma.config.js";

// Every read returns the event with its relations, matching what the old
// controller sent clients.
const include = {
    organizer: true,
    venue: true,
    category: true,
};

export const eventRepository = {
    create: (data) => prisma.event.create({ data, include }),
    update: (id, data) => prisma.event.update({ where: { id }, data, include }),
    delete: (id) => prisma.event.delete({ where: { id } }),
    findById: (id) => prisma.event.findUnique({ where: { id }, include }),

    // One round trip for the three foreign keys, so the service can report
    // exactly which one is missing before Prisma raises a generic FK error.
    findRelations: async ({ organizerId, venueId, categoryId }) => {
        const [organizer, venue, category] = await prisma.$transaction([
            prisma.organizer.findUnique({ where: { id: organizerId ?? "" } }),
            prisma.venue.findUnique({ where: { id: venueId ?? "" } }),
            prisma.category.findUnique({ where: { id: categoryId ?? "" } }),
        ]);
        return { organizer, venue, category };
    },

    findMany: async ({ page, limit, search, categoryId, organizerId, venueId, eventStatus, isFree, sortBy, sortOrder }) => {
        const where = {
            ...(categoryId && { categoryId }),
            ...(organizerId && { organizerId }),
            ...(venueId && { venueId }),
            ...(eventStatus && { eventStatus }),
            ...(isFree !== undefined && { isFree }),
            ...(search && {
                OR: [
                    { title: { contains: search } },
                    { description: { contains: search } },
                ],
            }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.event.findMany({
                where,
                include,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.event.count({ where }),
        ]);

        return { data, total };
    },
};
