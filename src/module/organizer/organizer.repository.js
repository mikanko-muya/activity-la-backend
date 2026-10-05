import { prisma } from "../../config/prisma.config.js";

const publicFields = {
    id: true,
    name: true,
    description: true,
    logoUrl: true,
};

const buildWhere = (search, fields) =>
    search ? { OR: fields.map((field) => ({ [field]: { contains: search } })) } : {};

const paginate = ({ page, limit, sortBy, sortOrder }) => ({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
});

export const organizerRepository = {
    create: (data) => prisma.organizer.create({ data }),
    update: (id, data) => prisma.organizer.update({ where: { id }, data }),
    delete: (id) => prisma.organizer.delete({ where: { id } }),

    findById: (id) => prisma.organizer.findUnique({ where: { id } }),
    findByEmail: (email) => prisma.organizer.findUnique({ where: { email } }),

    countEvents: (id) => prisma.event.count({ where: { organizerId: id } }),

    findMany: async (query) => {
        const where = buildWhere(query.search, ["name", "email", "phone"]);

        const [data, total] = await prisma.$transaction([
            prisma.organizer.findMany({ where, ...paginate(query) }),
            prisma.organizer.count({ where }),
        ]);

        return { data, total };
    },

    findByIdPublic: (id) =>
        prisma.organizer.findUnique({ where: { id }, select: publicFields }),

    findManyPublic: async (query) => {
        const where = buildWhere(query.search, ["name", "description"]);

        const [data, total] = await prisma.$transaction([
            prisma.organizer.findMany({ where, select: publicFields, ...paginate(query) }),
            prisma.organizer.count({ where }),
        ]);

        return { data, total };
    },
};
