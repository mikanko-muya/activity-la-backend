import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../utils/errors/index.js";
import { buildMeta } from "../../utils/pagination.js";
import {
  generateCouponCode,
  normalizeCouponCode,
} from "../../utils/couponCode.js";
import { eventRepository } from "../event/event.repository.js";
import { couponRepository } from "./coupon.repository.js";

const toNumber = (value) =>
  value === null || value === undefined ? value : Number(value);

const toPublic = (coupon) => ({
  ...coupon,
  discountValue: toNumber(coupon.discountValue),
});

export const calculateDiscount = (coupon, amount) => {
  const value = toNumber(coupon.discountValue);
  const raw =
    coupon.discountType === "PERCENTAGE" ? (amount * value) / 100 : value;
  return Math.min(Math.floor(raw), amount);
};

const assertCouponUsable = async (coupon, { eventId, userId } = {}) => {
  if (!coupon.isActive) throw new BadRequestError("Coupon is no longer active");

  const now = new Date();
  if (now < coupon.validFrom)
    throw new BadRequestError("Coupon is not valid yet");
  if (now > coupon.validTo) throw new BadRequestError("Coupon has expired");

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new BadRequestError("Coupon has been fully redeemed");
  }

  if (eventId && coupon.eventId !== eventId) {
    throw new BadRequestError("Coupon is not valid for this event");
  }

  if (userId) {
    const existing = await couponRepository.findRedemptionByUser(
      coupon.id,
      userId,
    );
    if (existing)
      throw new BadRequestError("You have already used this coupon");
  }
};

const CODE_GENERATION_ATTEMPTS = 5;

export const couponService = {
  async getCouponById(id) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) throw new NotFoundError("Coupon not found");
    return toPublic(coupon);
  },

  async getCoupons(query) {
    const result = await couponRepository.findMany(query);
    return {
      data: result.data.map(toPublic),
      meta: buildMeta({
        total: result.total,
        page: query.page,
        limit: query.limit,
      }),
    };
  },

  async getUsableCouponByCode(code, { eventId, userId } = {}) {
    const coupon = await couponRepository.findByCode(normalizeCouponCode(code));
    if (!coupon) throw new NotFoundError("Coupon not found");

    await assertCouponUsable(coupon, { eventId, userId });
    return toPublic(coupon);
  },

  async createCoupon(input) {
    const event = await eventRepository.findById(input.eventId);
    if (!event) throw new NotFoundError("Event not found");

    if (input.code) {
      const code = normalizeCouponCode(input.code);
      if (await couponRepository.existsByCode(code)) {
        throw new ConflictError(`Coupon code "${code}" already exists`);
      }
      return toPublic(await couponRepository.create({ ...input, code }));
    }

    for (let attempt = 0; attempt < CODE_GENERATION_ATTEMPTS; attempt += 1) {
      try {
        return toPublic(
          await couponRepository.create({
            ...input,
            code: generateCouponCode(),
          }),
        );
      } catch (error) {
        if (error?.code !== "P2002") throw error;
      }
    }

    throw new ConflictError(
      "Could not generate a unique coupon code, please try again",
    );
  },

  async updateCoupon(id, input) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) throw new NotFoundError("Coupon not found");

    if (!input || Object.keys(input).length === 0) {
      throw new BadRequestError("At least one change is required to update");
    }

    const dataToUpdate = { ...input };

    if (input.code) {
      const code = normalizeCouponCode(input.code);
      if (code !== coupon.code && (await couponRepository.existsByCode(code))) {
        throw new ConflictError(`Coupon code "${code}" already exists`);
      }
      dataToUpdate.code = code;
    }

    if (input.eventId && input.eventId !== coupon.eventId) {
      const event = await eventRepository.findById(input.eventId);
      if (!event) throw new NotFoundError("Event not found");
    }

    const discountType = input.discountType ?? coupon.discountType;
    const discountValue = toNumber(input.discountValue ?? coupon.discountValue);
    if (discountType === "PERCENTAGE" && discountValue > 100) {
      throw new BadRequestError(
        "Discount value must be less than or equal to 100 for percentage discount type",
      );
    }

    const validFrom = input.validFrom ?? coupon.validFrom;
    const validTo = input.validTo ?? coupon.validTo;
    if (validTo <= validFrom) {
      throw new BadRequestError("validTo must be greater than validFrom");
    }

    if (
      input.usageLimit !== undefined &&
      input.usageLimit !== null &&
      input.usageLimit < coupon.usedCount
    ) {
      throw new BadRequestError(
        `Usage limit cannot be lower than the ${coupon.usedCount} redemption(s) already made`,
      );
    }

    return toPublic(await couponRepository.update(id, dataToUpdate));
  },

  async deleteCoupon(id) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) throw new NotFoundError("Coupon not found");

    const redemptions = await couponRepository.countRedemptions(id);
    if (redemptions > 0) {
      throw new ConflictError(
        `Coupon has ${redemptions} redemption(s) and cannot be deleted. Set isActive to false instead.`,
      );
    }

    return toPublic(await couponRepository.delete(id));
  },

  generateCode() {
    return { code: generateCouponCode() };
  },
};
