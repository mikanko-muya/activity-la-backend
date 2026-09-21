import { prisma } from "../../config/prisma.config.js"

const defaultInclude = {
    organizer: true,
    venue: true,
    category: true,
}

export const eventRepository = {
    findById: (id) => { return prisma.event.findUnique({ where: { id }, include: { ...defaultInclude, ticketTypes: true } }) },
    create: (data) => { return prisma.event.create({ data, include: defaultInclude }) },
    update: (id, data) => { return prisma.event.update({ where: { id }, data, include: defaultInclude }) },
    delete: (id) => { return prisma.event.delete({ where: { id } }) },
    findMany: async ({ page, limit, search, status, organizerId, venueId, categoryId, sortBy, sortOrder }) => {
        const where = {
            ...(status && { status }),
            ...(organizerId && { organizerId }),
            ...(venueId && { venueId }),
            ...(categoryId && { categoryId }),
            ...(search && { title: { contains: search } })
        };

        const [data, total] = await prisma.$transaction([
            prisma.event.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: defaultInclude,
            }),
            prisma.event.count({ where })
        ])

        return { data, total }
    },

    organizerExists: async (organizerId) => { return await prisma.organizer.count({ where: { id: organizerId } }) > 0 },
    venueExists: async (venueId) => { return await prisma.venue.count({ where: { id: venueId } }) > 0 },
    categoryExists: async (categoryId) => { return await prisma.category.count({ where: { id: categoryId } }) > 0 },
}
