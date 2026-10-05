import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { buildMeta } from "../../utils/pagination.js";
import { prisma } from "../../config/prisma.config.js";
import { ticketTypeRepository } from "./ticketType.repository.js";

const assertEventExists = async (eventId) => {
    const exists = await ticketTypeRepository.eventExists(eventId);
    if (!exists) throw new NotFoundError("Event not found");
};

const assertSaleWindowOrdered = (saleStart, saleEnd) => {
    if (saleStart && saleEnd && saleEnd <= saleStart) {
        throw new BadRequestError("saleEnd must be later than saleStart");
    }
};

const toPublic = ({ quantity, saleQuantity, price, ...rest }) => ({
    ...rest,
    price: Number(price),
    remaining: Math.max(quantity - saleQuantity, 0),
    isSoldOut: saleQuantity >= quantity,
});

const paginated = (result, query, map = (row) => row) => ({
    data: result.data.map(map),
    meta: buildMeta({ total: result.total, page: query.page, limit: query.limit }),
});

export const ticketTypeService = {
    async getTicketTypeById(id) {
        const ticketType = await ticketTypeRepository.findById(id);
        if (!ticketType) throw new NotFoundError("Ticket type not found");

        return ticketType;
    },

    async getTicketTypes(query) {
        return paginated(await ticketTypeRepository.findMany(query), query);
    },

    async getPublicTicketTypeById(id) {
        const ticketType = await ticketTypeRepository.findByIdPublic(id);
        if (!ticketType) throw new NotFoundError("Ticket type not found");

        return toPublic(ticketType);
    },

    async getPublicTicketTypes(query) {
        return paginated(await ticketTypeRepository.findManyPublic(query), query, toPublic);
    },

    async createTicketType(input) {
        await assertEventExists(input.eventId);

        return ticketTypeRepository.create(input);
    },

    async updateTicketType(id, input) {
        const ticketType = await ticketTypeRepository.findById(id);
        if (!ticketType) throw new NotFoundError("Ticket type not found");

        const { quantity, ...fields } = input;

        assertSaleWindowOrdered(
            input.saleStart ?? ticketType.saleStart,
            input.saleEnd ?? ticketType.saleEnd
        );

        await prisma.$transaction(async (tx) => {
            if (quantity !== undefined) {
                const applied = await ticketTypeRepository.setQuantity(id, quantity, tx);

                if (!applied) {
                    throw new ConflictError(
                        `Cannot set quantity to ${quantity}: ${ticketType.saleQuantity} already sold`
                    );
                }
            }

            if (Object.keys(fields).length > 0) {
                await ticketTypeRepository.update(id, fields, tx);
            }
        });

        return ticketTypeRepository.findById(id);
    },

    async deleteTicketType(id) {
        const ticketType = await ticketTypeRepository.findById(id);
        if (!ticketType) throw new NotFoundError("Ticket type not found");

        const orderItems = await ticketTypeRepository.countOrderItems(id);
        if (orderItems > 0) {
            throw new ConflictError(
                `Ticket type has ${orderItems} order item(s) and cannot be deleted. Set its status to INACTIVE instead.`
            );
        }

        return ticketTypeRepository.delete(id);
    },
};
