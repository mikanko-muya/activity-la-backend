import { BadRequestError, NotFoundError } from "../../utils/errors/index.js";
import { buildMeta } from "../../utils/pagination.js";
import { orderRepository } from "./order.repository.js";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.config.js";

const assertRelationsExist = async (input) => {
    const wanted = {
        userId: input.userId,
        eventId: input.eventId,
        couponCode: input.couponCode,
    };

    const { user, event, coupon } = await orderRepository.findRelations(wanted);

    if (!user) throw new NotFoundError("User not found");
    if (!event) throw new NotFoundError("Event not found");
    if (wanted.couponCode && !coupon) throw new NotFoundError("Coupon not found");

    return { user, event, coupon };
};

const calculateSubtotal = (ticketType, quantity) => {
    const unitPrice = new Prisma.Decimal(ticketType.price);
    const subtotalAmount = unitPrice.mul(quantity);

    return {
        unitPrice: unitPrice.toDecimalPlaces(2),
        subtotalAmount: subtotalAmount.toDecimalPlaces(2),
    };
};

const calculateDiscount = (coupon, subtotalAmount) => {
    if (!coupon) return new Prisma.Decimal(0);

    const subtotal = new Prisma.Decimal(subtotalAmount);

    const discountValue = new Prisma.Decimal(coupon.discountValue);

    let discount;

    if (coupon.discountType === "PERCENTAGE") {
        discount = subtotal.mul(discountValue).div(100);
    }

    if (coupon.discountType === "FIXED") {
        discount = discountValue;
    }


    discount = Prisma.Decimal.min(discount, subtotal);

    return discount.toDecimalPlaces(2);
};

const assertCouponValid = async (coupon, userId) => {

    if (!coupon) throw new NotFoundError("Coupon not found");

    if (await orderRepository.isUsedCoupon(coupon.id, userId)) throw new BadRequestError("Coupon has already been used");

    if (!coupon.isActive) throw new BadRequestError("Coupon has expired");

};

const assertEventValid = (event) => {
    if (!event) {
        throw new NotFoundError("Event not found");
    }

    if (event.status !== "PUBLISHED") {
        throw new BadRequestError("Event is not available");
    }
}

const assertTicketTypesValid = async (eventId, ticketTypeId, quantity) => {
    const ticketType = await orderRepository.findTicketTypeByid(ticketTypeId);
    if (!ticketType) throw new NotFoundError("Ticket type not found");

    if (ticketType.eventId !== eventId) throw new BadRequestError("Ticket type does not belong to this event");

    if (ticketType.status !== "ACTIVE") throw new BadRequestError(`${ticketType.name} is not available`);

    return ticketType;
};

export const orderService = {
    async getOrderById(id) {
        const order = await orderRepository.findById(id);
        if (!order) throw new NotFoundError("Order not found");
        return order;
    },

    async getOrdersByUserId(userId) {
        return await orderRepository.findByUserId(userId);
    },

    async getOrders(query) {
        const result = await orderRepository.findMany(query);
        return { data: result.data, meta: buildMeta({ total: result.total, page: query.page, limit: query.limit }) };
    },

    async createOrder(userId, input) {
        const { event, coupon } = await assertRelationsExist({ ...input, userId });

        assertEventValid(event);

        if (input.couponCode) await assertCouponValid(coupon, userId);

        const ticketType = await assertTicketTypesValid(input.eventId, input.ticketTypeId, input.quantity);

        const { unitPrice, subtotalAmount } = calculateSubtotal(ticketType, input.quantity);

        const discountTotalAmount = calculateDiscount(coupon, subtotalAmount);

        const totalAmount = subtotalAmount.sub(discountTotalAmount).toDecimalPlaces(2);

        const order = await prisma.$transaction(
            async (tx) => {
                const reserved = await orderRepository.reserveTicketQuantity(tx, input.ticketTypeId, input.quantity)
                if (!reserved) throw new BadRequestError("Not enough tickets available");

                const createdOrder = await orderRepository.create(
                    tx,
                    {
                        userId,
                        eventId: input.eventId,
                        couponId: coupon?.id ?? null,
                        subtotalAmount,
                        discountTotalAmount,
                        totalAmount,
                        status: "PENDING",
                        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                    }
                );

                await orderRepository.createOrderItems(
                    tx,
                    {
                        orderId: createdOrder.id,
                        ticketTypeId: ticketType.id,
                        quantity: input.quantity,
                        unitPrice,
                        subtotalAmount,
                    }
                );
                return createdOrder;
            }
        );

        return orderRepository.findById(order.id);
    },

    async cancelOrder(id) {
        const order = await orderRepository.findById(orderId);

        if (!order) throw new NotFoundError("Order not found");

        if (order.status !== "PENDING") throw new BadRequestError("Order cannot be cancelled")

        return await prisma.$transaction(
            async (tx) => {

                const updated = await orderRepository.cancelOrder(tx, orderId);
                if (updated.count !== 1) throw new BadRequestError("Order cannot be cancelled")

                const item = order.orderItems[0];
                if (!item) throw new BadRequestError("Order items not found")

                await orderRepository.releaseTicketQuantity(
                    tx,
                    item.ticketTypeId,
                    item.quantity
                );

                return orderRepository.findById(orderId);
            });
    },

    async deleteOrder(id) {
        const order = await orderRepository.findById(id);
        if (!order) throw new NotFoundError("Order not found");

        if(order.status === "PENDING") throw new BadRequestError("Pending order cannot be deleted")

        return orderRepository.delete(id);
    },
};
