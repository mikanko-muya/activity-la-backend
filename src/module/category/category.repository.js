import { prisma } from "../../config/prisma.config.js";

export const categoryRepository = {
    create: (data) => { return prisma.category.create({ data }) },
    update: (id, data) => { return prisma.category.update({ where: { id }, data }) },
    delete: (id) => { return prisma.category.delete({ where: { id } }) },
    findById: (id) => { return prisma.category.findUnique({ where: { id } }) },
    findByName: (name) => { return prisma.category.findFirst({ where: { name } }) },
    findMany: ({ page, limit, search, sortBy, sortOrder }) => {
        const where = { ...(search && { name: { contains: search } }) };

        const [data, total] = await prisma.$transaction([
            prisma.category.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.category.count({
                where
            })
        ])

        return { data, total }
    }

}