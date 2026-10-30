import { prisma } from "../../config/prisma.config.js";
import { paginateArgs } from "../../utils/pagination.js";

const publicFields = {
    id: true,
    name: true,
    nameEn: true,
    description: true,
    descriptionEn: true,
    logoUrl: true,
};

const buildWhere = (query, fields) =>
    query.search ? { OR: fields.map((field) => ({ [field]: { contains: query.search } })) } : {};

export const organizerRepository = {
    create: (data) => prisma.organizer.create({ data }),
    update: (id, data) => prisma.organizer.update({ where: { id }, data }),
    delete: (id) => prisma.organizer.delete({ where: { id } }),

    findById: (id) => prisma.organizer.findUnique({ where: { id } }),
    findByEmail: (email) => prisma.organizer.findUnique({ where: { email } }),

    countEvents: (id) => prisma.event.count({ where: { organizerId: id } }),

    findMany: async (query) => {
        const where = buildWhere(query, ["name", "nameEn", "email", "phone"]);

        const [data, total] = await prisma.$transaction([
            prisma.organizer.findMany({ where, ...paginateArgs(query) }),
            prisma.organizer.count({ where }),
        ]);

        return { data, total };
    },

    findByIdPublic: (id) =>
        prisma.organizer.findUnique({ where: { id }, select: publicFields }),

    findManyPublic: async (query) => {
        const where = buildWhere(query, ["name", "nameEn", "description", "descriptionEn"]);

        const [data, total] = await prisma.$transaction([
            prisma.organizer.findMany({ where, select: publicFields, ...paginateArgs(query) }),
            prisma.organizer.count({ where }),
        ]);

        return { data, total };
    },
};
