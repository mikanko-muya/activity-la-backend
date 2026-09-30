import { Prisma } from "@prisma/client";

import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { buildMeta } from "../../utils/pagination.js";
import { prisma } from "../../config/prisma.config.js";
import { normalizeCouponCode } from "../../utils/couponCode.js";
import { orderRepository } from "./order.repository.js";

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

    // Never discount more than the order is worth.
    return Prisma.Decimal.min(discount, subtotal).toDecimalPlaces(2);
};

// Mirrors couponService.assertCouponUsable: every reason a coupon cannot be used,
// each with its own message. The previous version checked only isActive and
// per-user use, so an expired or fully-redeemed coupon still applied.
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

    // The column is eventStatus. This read `event.status`, which is always
    // undefined, so the comparison never matched and every event was rejected.
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

    return ticketType;
};

// A PENDING order holds ticket stock and a coupon redemption. Both are released
// when it is cancelled, so the window cannot be indefinite.
const RESERVATION_MINUTES = 15;

export const orderService = {
    async getOrderById(id) {
        const order = await orderRepository.findById(id);
        if (!order) throw new NotFoundError("Order not found");
        return order;
    },

    async getOrdersByUserId(userId) {
        return orderRepository.findByUserId(userId);
    },

    async getOrders(query) {
        const result = await orderRepository.findMany(query);
        return {
            data: result.data,
            meta: buildMeta({ total: result.total, page: query.page, limit: query.limit }),
        };
    },

    async createOrder(userId, input) {
        const { event, coupon } = await assertRelationsExist({ ...input, userId });

        assertEventValid(event);
        if (input.couponCode) await assertCouponUsable(coupon, userId);

        const ticketType = await assertTicketTypeValid(input.eventId, input.ticketTypeId);

        const { unitPrice, subtotalAmount } = calculateSubtotal(ticketType, input.quantity);
        const discountTotalAmount = calculateDiscount(coupon, subtotalAmount);
        const totalAmount = subtotalAmount.sub(discountTotalAmount).toDecimalPlaces(2);

        // One transaction: stock, order, items and the coupon redemption either all
        // happen or none do. A crash between any two of them would otherwise leave
        // stock held by no order, or a coupon consumed for an order that failed.
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

            // The redemption row was never written before, so the per-user unique
            // constraint had nothing to act on and a coupon could be reused.
            if (coupon) {
                try {
                    await orderRepository.createRedemption(tx, {
                        couponId: coupon.id,
                        userId,
                        orderId: createdOrder.id,
                    });
                } catch (error) {
                    // P2002 means another checkout redeemed it between our check and
                    // this insert. The constraint is the real guard; translate it.
                    if (error?.code === "P2002") {
                        throw new ConflictError("You have already used this coupon");
                    }
                    throw error;
                }

                await orderRepository.incrementCouponUsage(tx, coupon.id);
            }

            return createdOrder;
        });

        return orderRepository.findById(order.id);
    },

    // Releases everything the order was holding. `id` was named `orderId`
    // throughout this body while the parameter was `id`, so every reference threw
    // a ReferenceError and cancelling was impossible.
    async cancelOrder(id) {
        const order = await orderRepository.findById(id);
        if (!order) throw new NotFoundError("Order not found");

        if (order.status !== "PENDING") throw new BadRequestError("Order cannot be cancelled");

        return prisma.$transaction(async (tx) => {
            const updated = await orderRepository.cancelOrder(tx, id);
            if (updated.count !== 1) throw new BadRequestError("Order cannot be cancelled");

            for (const item of order.orderItems) {
                await orderRepository.releaseTicketQuantity(tx, item.ticketId, item.quantity);
            }

            // Deleting the redemption hands the coupon back to the user. This is
            // why the ledger is a separate table: release is one DELETE, and the
            // order record itself is untouched.
            if (order.couponId) {
                await orderRepository.deleteRedemptionByOrderId(tx, id);
                await orderRepository.decrementCouponUsage(tx, order.couponId);
            }

            return orderRepository.findById(id);
        });
    },

    async deleteOrder(id) {
        const order = await orderRepository.findById(id);
        if (!order) throw new NotFoundError("Order not found");

        if (order.status === "PENDING") {
            throw new BadRequestError("Pending order cannot be deleted");
        }

        return orderRepository.delete(id);
    },
};
