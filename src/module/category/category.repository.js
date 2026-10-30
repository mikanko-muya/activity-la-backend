import { prisma } from "../../config/prisma.config.js";
import { paginateArgs } from "../../utils/pagination.js";

const buildWhere = (query) => ({
    ...(query.search && {
        OR: [{ name: { contains: query.search } }, { nameEn: { contains: query.search } }],
    }),
});

export const categoryRepository = {
    create: (data) => { return prisma.category.create({ data }) },
    update: (id, data) => { return prisma.category.update({ where: { id }, data }) },
    delete: (id) => { return prisma.category.delete({ where: { id } }) },
    findById: (id) => { return prisma.category.findUnique({ where: { id } }) },
    findByName: (name) => { return prisma.category.findFirst({ where: { name } }) },
    findByNameEn: (nameEn) => { return prisma.category.findFirst({ where: { nameEn } }) },

    findMany: async (query) => {
        const where = buildWhere(query);

        const [data, total] = await prisma.$transaction([
            prisma.category.findMany({
                where,
                ...paginateArgs(query),
            }),
            prisma.category.count({
                where
            })
        ])

        return { data, total }
    }

}
