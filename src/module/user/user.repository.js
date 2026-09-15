import { prisma } from "../../config/prisma.config.js";
import { getPagination } from "../../utils/pagination.js";
import { OrderHistoryRepository } from "../orderHistory/oderHistory.repository.js";
import { getOrderHistory } from "./user.controller.js";

export const userRepository = {
  create: (data) => {
    return prisma.user.create({ data });
  },

  findByEmail: (email) => {
    return prisma.user.findFirst({ where: { email } });
  },

  findByEmail: (phone) => {
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

  findMany: async ({ page, limit, search, role, isActive, sortBy, sortOrder }) => {
    const where = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);
    return { data, total };
  },
};
