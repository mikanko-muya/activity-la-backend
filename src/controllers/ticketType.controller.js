import { prisma } from "../config/prisma.js";
import { SendError, SendSuccess, SendCreate } from "../utils/response.js";
import { validateData } from "../services/validate.js";


export default class TicketTypeControllers {

    static async getAllTicketTypes(req, res) {
        try {
            const ticketTypes = await prisma.ticketType.findMany();
            return SendSuccess(res, 'Ticket types retrieved successfully', ticketTypes);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    static async getTicketTypeById(req, res) {
        try {
            const { id } = req.params.id;
            const ticketType = await prisma.ticketType.findUnique({ where: { id } });
            if (!ticketType) return SendError(res, 404, 'Ticket type not found');
            return SendSuccess(res, 'Ticket type retrieved successfully', ticketType);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    static async getTicketTypesByEventId(req, res){
        try {
            const { eventId } = req.params.eventId;
            const tickettypes = await prisma.ticketType.findMany({ where: { eventId } });
            return SendSuccess(res, 'Ticket types retrieved successfully', tickettypes);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    static async createTicketType(req, res) {
        try {
            const { name, description, price, quantity, eventId, saleStart, saleEnd } = req.body;
            const validate = await validateData({ name, description, price, quantity, eventId, saleStart, saleEnd });
            if (validate.length > 0) return SendError(res, 400, 'Bad request', `${validate.join(', ')} are required`);

            if (price < 0 || quantity < 0) return SendError(res, 400, 'Bad request', 'Invalid price or quantity');
            const event = await prisma.event.findUnique({ where: { id: eventId } });
            if (!event) return SendError(res, 404, 'Event not found');

            const ticketType = await prisma.ticketType.create({
                data: {
                    name,
                    description,
                    price: Number(price),
                    quantity: Number(quantity),
                    eventId,
                    saleStart: new Date(saleStart),
                    saleEnd: new Date(saleEnd),
                }
            });
            return SendCreate(res, 'Ticket type created successfully', ticketType);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    static async updateTicketType(req, res) {
        try {
            const id = req.params.id;
            const ticketType = await prisma.ticketType.findUnique({ where: { id } });
            if (!ticketType) return SendError(res, 404, 'Ticket type not found');

            const { name, description, price, quantity, eventId, saleStart, saleEnd } = req.body;
            const validate = await validateData({ name, description, price, quantity, eventId, saleStart, saleEnd });
            if (validate.length > 0) return SendError(res, 400, 'Bad request', `${validate.join(', ')} are required`);

            if (price < 0 || quantity < 0) return SendError(res, 400, 'Bad request', 'Invalid price or quantity');
            if (Number(quantity) < ticketType.saleQuantity) return SendError(res, 400, 'Bad request', 'Quantity cannot be less than sale quantity');

            const event = await prisma.event.findUnique({ where: { id: eventId } });
            if (!event) return SendError(res, 404, 'Event not found');

            const data = await prisma.ticketType.update({
                where: { id: req.params.id },
                data: {
                    name,
                    description,
                    price: Number(price),
                    quantity: Number(quantity),
                    eventId,
                    saleStart: new Date(saleStart),
                    saleEnd: new Date(saleEnd),
                }
            });
            return SendSuccess(res, 'Ticket type updated successfully', data);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }

    static async deleteTicketType(req, res) {
        try {
            const id = req.params.id;
            const ticketType = await prisma.ticketType.findUnique({ where: { id } });
            if (!ticketType) return SendError(res, 404, 'Ticket type not found');

            if (ticketType.saleQuantity > 0) return SendError(res, 400, 'Bad request', 'Cannot delete a ticket type that has already been sold');

            const data = await prisma.ticketType.delete({ where: { id } });

            return SendSuccess(res, 'Ticket type deleted successfully', data);
        } catch (error) {
            return SendError(res, 500, 'Server Internal', error);
        }
    }
}