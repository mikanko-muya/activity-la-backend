import { Prisma } from "@prisma/client";

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors/index.js";
import { toPaginated } from "../../utils/pagination.js";
import { checkExistBy } from "../../utils/resource.js";
import { prisma } from "../../config/prisma.config.js";
import { normalizeCouponCode } from "../../utils/couponCode.js";
import { notificationService } from "../notification/notification.service.js";
import { orderRepository } from "./order.repository.js";

const checkExist = checkExistBy(orderRepository.findById, "Order");

const assertRelationsExist = async (input) => {
    const wanted = {
        userId: input.userId,
        eventId: input.eventId,
        couponCode: input.couponCode ? normalizeCouponCode(input.couponCode) : undefined,
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

    const discount =
        coupon.discountType === "PERCENTAGE" ? subtotal.mul(discountValue).div(100) : discountValue;

    return Prisma.Decimal.min(discount, subtotal).toDecimalPlaces(2);
};

const assertCouponUsable = async (coupon, userId) => {
    if (!coupon) throw new NotFoundError("Coupon not found");

    if (!coupon.isActive) throw new BadRequestError("Coupon is no longer active");

    const now = new Date();
    if (now < coupon.validFrom) throw new BadRequestError("Coupon is not valid yet");
    if (now > coupon.validTo) throw new BadRequestError("Coupon has expired");

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestError("Coupon has been fully redeemed");
    }

    if (await orderRepository.isRedeemedByUser(coupon.id, userId)) {
        throw new BadRequestError("You have already used this coupon");
    }
};

const assertEventValid = (event) => {
    if (!event) throw new NotFoundError("Event not found");

    if (event.eventStatus !== "PUBLISHED") {
        throw new BadRequestError("Event is not available");
    }
};

const assertTicketTypeValid = async (eventId, ticketTypeId) => {
    const ticketType = await orderRepository.findTicketTypeById(ticketTypeId);
    if (!ticketType) throw new NotFoundError("Ticket type not found");

    if (ticketType.eventId !== eventId) {
        throw new BadRequestError("Ticket type does not belong to this event");
    }

    if (ticketType.status !== "ACTIVE") {
        throw new BadRequestError(`${ticketType.name} is not available`);
    }

    const now = new Date();
    if (ticketType.saleStart && now < ticketType.saleStart) {
        throw new BadRequestError(`${ticketType.name} is not on sale yet`);
    }
    if (ticketType.saleEnd && now > ticketType.saleEnd) {
        throw new BadRequestError(`${ticketType.name} is no longer on sale`);
    }

    return ticketType;
};

const RESERVATION_MINUTES = 15;

export const orderService = {
    async getOrderById(id, { actingUserId } = {}) {
        const order = await checkExist(id);

        if (actingUserId && order.userId !== actingUserId) {
            throw new ForbiddenError("You do not have permission");
        }

        return order;
    },

    async getOrdersByUserId(userId) {
        return orderRepository.findByUserId(userId);
    },

    async getOrders(query) {
        return toPaginated(await orderRepository.findMany(query), query);
    },

    async createOrder(userId, input) {
        const { event, coupon } = await assertRelationsExist({ ...input, userId });

        assertEventValid(event);
        if (input.couponCode) await assertCouponUsable(coupon, userId);

        const ticketType = await assertTicketTypeValid(input.eventId, input.ticketTypeId);

        const { unitPrice, subtotalAmount } = calculateSubtotal(ticketType, input.quantity);
        const discountTotalAmount = calculateDiscount(coupon, subtotalAmount);
        const totalAmount = subtotalAmount.sub(discountTotalAmount).toDecimalPlaces(2);

        const order = await prisma.$transaction(async (tx) => {
            const reserved = await orderRepository.reserveTicketQuantity(
                tx,
                input.ticketTypeId,
                input.quantity
            );
            if (!reserved) throw new BadRequestError("Not enough tickets available");

            const createdOrder = await orderRepository.create(tx, {
                userId,
                eventId: input.eventId,
                couponId: coupon?.id ?? null,
                subtotalAmount,
                discountTotalAmount,
                totalAmount,
                status: "PENDING",
                expiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
            });

            await orderRepository.createOrderItem(tx, {
                orderId: createdOrder.id,
                ticketId: ticketType.id,
                quantity: input.quantity,
                unitPrice,
                subtotal: subtotalAmount,
            });

            if (coupon) {
                try {
                    await orderRepository.createRedemption(tx, {
                        couponId: coupon.id,
                        userId,
                        orderId: createdOrder.id,
                    });
                } catch (error) {
                    if (error?.code === "P2002") {
                        throw new ConflictError("You have already used this coupon");
                    }
                    throw error;
                }

                await orderRepository.incrementCouponUsage(tx, coupon.id);
            }

            return createdOrder;
        });

        await notificationService.notifyUserSafely({
            userId,
            orderId: order.id,
            notifType: "PAYMENT",
            title: "Order placed",
            message:
                `Your order for "${event.title}" is reserved for ${RESERVATION_MINUTES} minutes. ` +
                `Pay ${totalAmount.toFixed(2)} to confirm your tickets.`,
        });

        return orderRepository.findById(order.id);
    },

    async cancelOrder(id, { actingUserId } = {}) {
        const order = await checkExist(id);

        if (actingUserId && order.userId !== actingUserId) {
            throw new ForbiddenError("You do not have permission");
        }

        if (order.status !== "PENDING") throw new BadRequestError("Order cannot be cancelled");

        await prisma.$transaction(async (tx) => {
            const updated = await orderRepository.cancelOrder(tx, id);
            if (updated.count !== 1) throw new BadRequestError("Order cannot be cancelled");

            for (const item of order.orderItems) {
                await orderRepository.releaseTicketQuantity(tx, item.ticketId, item.quantity);
            }

            if (order.couponId) {
                await orderRepository.deleteRedemptionByOrderId(tx, id);
                await orderRepository.decrementCouponUsage(tx, order.couponId);
            }
        });

        await notificationService.notifyUserSafely({
            userId: order.userId,
            orderId: order.id,
            notifType: "PAYMENT",
            title: "Order cancelled",
            message:
                `Your order for "${order.event.title}" has been cancelled and the tickets released.` +
                (order.couponId ? " Your coupon is available to use again." : ""),
        });

        return orderRepository.findById(id);
    },

    async deleteOrder(id) {
        const order = await checkExist(id);

        if (order.status === "PENDING") {
            throw new BadRequestError("Pending order cannot be deleted");
        }

        const payments = await orderRepository.countPayments(id);
        if (payments > 0) {
            throw new ConflictError(
                `Order has ${payments} payment record(s) and cannot be deleted`
            );
        }

        return orderRepository.delete(id);
    },
};
