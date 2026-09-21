import { prisma } from "../../config/prisma.config.js";


export const organizerRepository = {
  create: (data) => {
    return prisma.organizer.create({ data });
  },

  findById: (id) => {
    return prisma.organizer.findUnique({ where: { id } });
  },

  update: (id, data) => {
    return prisma.organizer.update({ where: { id }, data });
  },

  delete: (id) => {
    return prisma.organizer.delete({ where: { id } })
  },

  findMany: async ({ page, limit, search, sortBy, sortOrder }) => {
    const where = {
      OR: [
        ...(search && { title: { contains: search } }),
        ...(search && { email: { contains: search } }),
        ...(search && { phone: { contains: search } }),
      ]
    };
    const [data, total] = await prisma.$transaction([
      prisma.organizer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.organizer.count({ where }),
    ]);
    return { data, total };
  },
};
