import { prisma } from "../../config/prisma.config.js";

const include = {
    event: {
        select: {
            id: true,
            title: true,
            eventStatus: true,
            startAt: true,
            endAt: true,
        },
    },
};

const publicFields = {
    id: true,
    eventId: true,
    name: true,
    description: true,
    price: true,
    quantity: true,
    saleQuantity: true,
    saleStart: true,
    saleEnd: true,
    status: true,
};

const publicWhere = (query) => ({
    status: "ACTIVE",
    event: { eventStatus: "PUBLISHED" },
    ...(query.eventId && { eventId: query.eventId }),
    ...(query.search && { name: { contains: query.search } }),
});

const paginate = ({ page, limit, sortBy, sortOrder }) => ({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
});

export const ticketTypeRepository = {
    create: (data) => prisma.ticketType.create({ data, include }),
    update: (id, data, client = prisma) =>
        client.ticketType.update({ where: { id }, data, include }),
    delete: (id) => prisma.ticketType.delete({ where: { id } }),
    findById: (id) => prisma.ticketType.findUnique({ where: { id }, include }),

    findMany: async (query) => {
        const where = {
            ...(query.status && { status: query.status }),
            ...(query.eventId && { eventId: query.eventId }),
            ...(query.search && { name: { contains: query.search } }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.ticketType.findMany({ where, include, ...paginate(query) }),
            prisma.ticketType.count({ where }),
        ]);

        return { data, total };
    },

    findByIdPublic: (id) =>
        prisma.ticketType.findFirst({
            where: { id, status: "ACTIVE", event: { eventStatus: "PUBLISHED" } },
            select: publicFields,
        }),

    findManyPublic: async (query) => {
        const where = publicWhere(query);

        const [data, total] = await prisma.$transaction([
            prisma.ticketType.findMany({ where, select: publicFields, ...paginate(query) }),
            prisma.ticketType.count({ where }),
        ]);

        return { data, total };
    },

    eventExists: async (eventId) =>
        (await prisma.event.count({ where: { id: eventId } })) > 0,

    countOrderItems: (id) => prisma.orderItem.count({ where: { ticketId: id } }),

    setQuantity: async (id, quantity, client = prisma) => {
        const affected = await client.$executeRaw`
            UPDATE \`TicketType\`
               SET \`quantity\` = ${quantity}
             WHERE \`id\` = ${id}
               AND ${quantity} >= \`saleQuantity\``;

        return affected === 1;
    },
};
