import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";

const DEFAULT_LENGTH = 10;

export const generateCouponCode = (length = DEFAULT_LENGTH) => {
  if (!Number.isInteger(length) || length < 4 || length > 32) {
    throw new RangeError("Coupon code length must be an integer between 4 and 32");
  }

  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
};

export const normalizeCouponCode = (code) =>
  String(code ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
