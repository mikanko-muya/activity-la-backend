import { prisma } from "../../config/prisma.config.js";
import { paginateArgs } from "../../utils/pagination.js";

const include = {
    organizer: { select: { id: true, name: true, logoUrl: true } },
    venue: true,
    category: true,
};

const buildWhere = (query) => ({
    ...(query.categoryId && { categoryId: query.categoryId }),
    ...(query.organizerId && { organizerId: query.organizerId }),
    ...(query.venueId && { venueId: query.venueId }),
    ...(query.eventStatus && { eventStatus: query.eventStatus }),
    ...(query.isFree !== undefined && { isFree: query.isFree }),
    ...(query.search && {
        OR: [
            { title: { contains: query.search } },
            { description: { contains: query.search } },
        ],
    }),
});

export const eventRepository = {
    create: (data) => prisma.event.create({ data, include }),
    update: (id, data) => prisma.event.update({ where: { id }, data, include }),
    delete: (id) => prisma.event.delete({ where: { id } }),
    findById: (id) => prisma.event.findUnique({ where: { id }, include }),

    findRelations: async ({ organizerId, venueId, categoryId }) => {
        const [organizer, venue, category] = await prisma.$transaction([
            prisma.organizer.findUnique({ where: { id: organizerId ?? "" } }),
            prisma.venue.findUnique({ where: { id: venueId ?? "" } }),
            prisma.category.findUnique({ where: { id: categoryId ?? "" } }),
        ]);
        return { organizer, venue, category };
    },

    findMany: async (query) => {
        const where = buildWhere(query);

        const [data, total] = await prisma.$transaction([
            prisma.event.findMany({
                where,
                include,
                ...paginateArgs(query),
            }),
            prisma.event.count({ where }),
        ]);

        return { data, total };
    },
};
