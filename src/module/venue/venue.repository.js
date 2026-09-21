import { prisma } from "../../config/prisma.config.js"

export const venueRepository = {
    findById: (id) => { return prisma.venue.findUnique({ where: { id } }) },
    create: (data) => { return prisma.venue.create({ data }) },
    update: (id, data) => { return prisma.venue.update({ where: { id }, data }) },
    delete: (id) => { return prisma.venue.delete({ where: { id } }) },
    findMany: async ({ page, limit, search, sortBy, sortOrder }) => {
        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search } },
                    { address: { contains: search } },
                    { province: { contains: search } }
                ]
            })
        };

        const [data, total] = await prisma.$transaction([
            prisma.venue.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.venue.count({ where })
        ])

        return { data, total }
    },
}
