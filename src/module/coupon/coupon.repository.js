import { prisma } from "../../config/prisma.config.js";
import { paginateArgs } from "../../utils/pagination.js";

const include = {
  event: { select: { id: true, title: true } },
};

const buildWhere = (query) => ({
  ...(query.eventId && { eventId: query.eventId }),
  ...(query.discountType && { discountType: query.discountType }),
  ...(query.isActive !== undefined && { isActive: query.isActive }),
  ...(query.search && { code: { contains: query.search.toUpperCase() } }),
});

export const couponRepository = {
  create: (data) => prisma.coupon.create({ data, include }),
  update: (id, data) => prisma.coupon.update({ where: { id }, data, include }),
  delete: (id) => prisma.coupon.delete({ where: { id } }),

  findById: (id) => prisma.coupon.findUnique({ where: { id }, include }),

  findByCode: (code) => prisma.coupon.findUnique({ where: { code }, include }),

  existsByCode: async (code) =>
    (await prisma.coupon.count({ where: { code } })) > 0,

  findMany: async (query) => {
    const where = buildWhere(query);

    const [data, total] = await prisma.$transaction([
      prisma.coupon.findMany({
        where,
        include,
        ...paginateArgs(query),
      }),
      prisma.coupon.count({ where }),
    ]);

    return { data, total };
  },

  findRedemptionByUser: (couponId, userId) =>
    prisma.couponRedemption.findUnique({
      where: { couponId_userId: { couponId, userId } },
    }),

  countRedemptions: (couponId) =>
    prisma.couponRedemption.count({ where: { couponId } }),
};
