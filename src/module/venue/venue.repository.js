import { prisma } from "../../config/prisma.config.js"
import { paginateArgs } from "../../utils/pagination.js";

const buildWhere = (query) => ({
    ...(query.search && {
        OR: [
            { name: { contains: query.search } },
            { address: { contains: query.search } },
            { province: { contains: query.search } },
        ],
    }),
});

export const venueRepository = {
    findById: (id) => { return prisma.venue.findUnique({ where: { id } }) },
    create: (data) => { return prisma.venue.create({ data }) },
    update: (id, data) => { return prisma.venue.update({ where: { id }, data }) },
    delete: (id) => { return prisma.venue.delete({ where: { id } }) },
    findMany: async (query) => {
        const where = buildWhere(query);

        const [data, total] = await prisma.$transaction([
            prisma.venue.findMany({
                where,
                ...paginateArgs(query),
            }),
            prisma.venue.count({ where })
        ])

        return { data, total }
    },
}
