import { prisma } from "../../config/prisma.config.js";

const include = {
  event: { select: { id: true, title: true } },
};

export const couponRepository = {
  create: (data) => prisma.coupon.create({ data, include }),
  update: (id, data) => prisma.coupon.update({ where: { id }, data, include }),
  delete: (id) => prisma.coupon.delete({ where: { id } }),

  findById: (id) => prisma.coupon.findUnique({ where: { id }, include }),

  findByCode: (code) => prisma.coupon.findUnique({ where: { code }, include }),

  existsByCode: async (code) =>
    (await prisma.coupon.count({ where: { code } })) > 0,

  findMany: async ({
    page,
    limit,
    search,
    eventId,
    discountType,
    isActive,
    sortBy,
    sortOrder,
  }) => {
    const where = {
      ...(eventId && { eventId }),
      ...(discountType && { discountType }),
      ...(isActive !== undefined && { isActive }),
      ...(search && { code: { contains: search.toUpperCase() } }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.coupon.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
