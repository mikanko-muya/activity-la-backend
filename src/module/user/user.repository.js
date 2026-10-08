import { prisma } from "../../config/prisma.config.js";
import { paginateArgs } from "../../utils/pagination.js";
import { OrderHistoryRepository } from "../orderHistory/orderHistory.repository.js";

const buildWhere = (query) => ({
  ...(query.role && { role: query.role }),
  ...(query.isActive !== undefined && { isActive: query.isActive }),
  ...(query.search && {
    OR: [
      { name: { contains: query.search } },
      { email: { contains: query.search } },
      { phone: { contains: query.search } },
    ],
  }),
});

export const userRepository = {
  create: (data) => {
    return prisma.user.create({ data });
  },

  findByEmail: (email) => {
    return prisma.user.findFirst({ where: { email } });
  },

  findByPhone: (phone) => {
    return prisma.user.findFirst({ where: { phone } });
  },

  findById: (id) => {
    return prisma.user.findUnique({ where: { id } });
  },

  update: (id, data) => {
    return prisma.user.update({ where: { id }, data });
  },

  delete: (id) => {
    return prisma.user.delete({ where: { id } })
  },

  findOrderHistory: (id) => {
    return OrderHistoryRepository.findOrderHistoryByUserId(id)
  },

  findMany: async (query) => {
    const where = buildWhere(query);
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        ...paginateArgs(query),
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total };
  },
};
