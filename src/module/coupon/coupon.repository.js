import { prisma } from "../../config/prisma.config.js"

export const couponRepository = {
    findById: (id) => { return prisma.coupon.findUnique({ where: { id }, include: { event: true } }) },
    create: (data) => { return prisma.coupon.create({ data, include: { event: true } }) },
    update: (id, data) => { return prisma.coupon.update({ where: { id }, data, include: { event: true } }) },
    delete: (id) => { return prisma.coupon.delete({ where: { id } }) },
    findMany: async ({ page, limit, search, isUsed, eventId, sortBy, sortOrder }) => {
        const where = {
            ...(isUsed !== undefined && { isUsed }),
            ...(eventId && { eventId }),
            ...(search && {
                OR: [
                    { code: { contains: search } },
                    { event: { name: { contains: search } } }
                ]
            })
        };

        const [data, total] = await prisma.$transaction([
            prisma.coupon.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: { event: true },
            }),
            prisma.coupon.count({ where })
        ])

        return { data, total }
    },

    eventExists: async (eventId) => { return await prisma.event.count({ where: { id: eventId } }) > 0 },
}
