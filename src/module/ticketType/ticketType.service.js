import { NotFoundError } from "../../utils/errors/index.js";
import { ticketTypeRepository } from "./ticketType.repository.js";

const assertReferencesExist = async (eventId) => {
    const exists = await ticketTypeRepository.eventExists(eventId);
    if (!exists) throw new NotFoundError(`Event with id "${eventId}" not found`);
};

export const ticketTypeService = {
    async getTicketTypeById(id) {
        const ticketType = await ticketTypeRepository.findById(id);
        if (!ticketType) throw new NotFoundError("Ticket type not found");
        return ticketType;
    },

    async getTicketTypes(query) {
        const result = await ticketTypeRepository.findMany(query);
        return {
            data: result.data,
            meta: {
                total: result.total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(result.total / query.limit),
            }
        }
    },

    async createTicketType(input) {
        await assertReferencesExist(input.eventId);

        const ticketType = await ticketTypeRepository.create(input);
        return ticketType;
    },

    async updateTicketType(id, input) {
        const ticketType = await ticketTypeRepository.findById(id);
        if (!ticketType) throw new NotFoundError("Ticket type not found");

        if (input.eventId) {
            await assertEventExists(input.eventId);
        }

        if (input.saleStart || input.saleEnd) {
            const saleStart = input.saleStart ?? ticketType.saleStart;
            const saleEnd = input.saleEnd ?? ticketType.saleEnd;

            if (saleStart && saleEnd && saleEnd <= saleStart) {
                throw new BadRequestError("saleEnd must be later than saleStart");
            }
        }

        const updatedTicketType = await ticketTypeRepository.update(id, input)
        return updatedTicketType;
    },

    async deleteTicketType(id) {
        const ticketType = await ticketTypeRepository.findById(id);
        if (!ticketType) throw new NotFoundError("Ticket type not found");

        const deletedTicketType = await ticketTypeRepository.delete(id);
        return deletedTicketType;

    }

}