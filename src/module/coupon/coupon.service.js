import { input } from "zod";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/errors/index.js";
import { couponRepository } from "./coupon.repository.js"

assertReferencesExist = async (eventId) => {
    const exists = await couponRepository.eventExists(eventId);
    if (!exists) throw new NotFoundError(`Event with id "${eventId}" not found`);
};

export const CouponService = {
    async getCouponById(id) {
        const coupon = await couponRepository.findById(id);
        if (!coupon) throw new NotFoundError("Coupon not found");
        return coupon;
    },

    async getCouponByCode(input) {
        const coupon = await couponRepository.findByCode(input);
        if (!coupon) throw new NotFoundError("Coupon not found");
        return coupon;
    },

    async getCoupons(query) {
        const result = await couponRepository.findMany(query);
        return {
            data: result.data,
            meta: {
                total: result.total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(result.total / query.limit),
            },
        };
    },

    async createCoupon(input) {
        await assertReferencesExist;
        const coupon = await couponRepository.create(input);
        return coupon;
    },

    async updateCoupon(id, input) {
        const coupon = await couponRepository.findById(id);
        if (!coupon) throw new NotFoundError("Coupon not found");

        if (input.eventId) await assertReferencesExist(input.eventId);

        if( input.validFrom || input.validTo) {
            const validFrom = input.validFrom ?? coupon.validFrom;
            const validTo = input.validTo ?? coupon.validTo;

            if ( validFrom && validTo && validTo <= validFrom ) {
                throw new BadRequestError( "validTo must be later than validFrom" );
            }
        }
        const updatedCoupon = await couponRepository.update(id, input);
        return updatedCoupon;
    },

    async deleteCoupon(id) {
        const Coupon = await couponRepository.findById(id);
        if (!Coupon) throw new NotFoundError("Coupon not found");

        const deletedCoupon = await couponRepository.delete(id);

        return deletedCoupon;
    },

};
