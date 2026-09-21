const defaultInclude = {
    event: true
}

export const ticketTypeRepository = {
    findById: (id) => { return prisma.ticketTypes.findUnique({ where: { id }, include: defaultInclude }) },
    create: (data) => { return prisma.ticketTypes.create({ data, include: defaultInclude }) },
    update: (id, data) => { return prisma.ticketTypes.update({ where: { id }, data, include: defaultInclude }) },
    delete: (id) => { return prisma.ticketTypes.delete({ where: { id } }) },
    findMany: async ({ page, limit, search, status, eventId, sortBy, sortOrder }) => {
        const where = {
            ...(status && { status }),
            ...(eventId && { eventId }),
            ...(search && { name: { contains: search } })
        };

        const [data, total] = await prisma.$transaction([
            prisma.ticketTypes.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: defaultInclude,
            }),
            prisma.ticketTypes.count({ where })
        ])

        return { data, total }
    },

    eventExists: async (eventId) => {
        return await prisma.event.count({ where: { id: organizerId } }) > 0
    }
}