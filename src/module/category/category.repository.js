import { prisma } from "../../config/prisma.config.js";

export const categoryRepository = {
    create: (data) => { return prisma.category.create({ data }) },
    update: (id, data) => { return prisma.category.update({ where: { id }, data }) },
    delete: (id) => { return prisma.category.delete({ where: { id } }) },
    findById: (id) => { return prisma.category.findUnique({ where: { id } }) },
    findByName: (name) => { return prisma.category.findFirst({ where: { name } }) },

    // FIX: this used to be a plain arrow destructuring prisma.$transaction(...)
    // directly. A Promise is not iterable, so `const [data, total] = promise`
    // threw "prisma.$transaction(...) is not iterable" on every list request.
    // Now async + awaited.
    findMany: async ({ page, limit, search, sortBy, sortOrder }) => {
        const where = { ...(search && { name: { contains: search } }) };

        const [data, total] = await prisma.$transaction([
            prisma.category.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                // FIX: sortBy/sortOrder were accepted as arguments but never used.
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.category.count({
                where
            })
        ])

        return { data, total }
    }

}
