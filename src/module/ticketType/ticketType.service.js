import { BadRequestError, ConflictError } from "../../utils/errors/index.js";
import { toPaginated } from "../../utils/pagination.js";
import { checkExistBy } from "../../utils/resource.js";
import { prisma } from "../../config/prisma.config.js";
import { eventRepository } from "../event/event.repository.js";
import { ticketTypeRepository } from "./ticketType.repository.js";

const checkExist = checkExistBy(ticketTypeRepository.findById, "Ticket type");
const checkPublicExist = checkExistBy(ticketTypeRepository.findByIdPublic, "Ticket type");
const checkEventExist = checkExistBy(eventRepository.findById, "Event");

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

export const ticketTypeService = {
    async getTicketTypeById(id) {
        return checkExist(id);
    },

    async getTicketTypes(query) {
        return toPaginated(await ticketTypeRepository.findMany(query), query);
    },

    async getPublicTicketTypeById(id) {
        return toPublic(await checkPublicExist(id));
    },

    async getPublicTicketTypes(query) {
        return toPaginated(await ticketTypeRepository.findManyPublic(query), query, toPublic);
    },

    async createTicketType(input) {
        await checkEventExist(input.eventId);

        return ticketTypeRepository.create(input);
    },

    async updateTicketType(id, input) {
        const ticketType = await checkExist(id);

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
        await checkExist(id);

        const orderItems = await ticketTypeRepository.countOrderItems(id);
        if (orderItems > 0) {
            throw new ConflictError(
                `Ticket type has ${orderItems} order item(s) and cannot be deleted. Set its status to INACTIVE instead.`
            );
        }

        return ticketTypeRepository.delete(id);
    },
};
