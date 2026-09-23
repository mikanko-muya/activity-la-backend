import { randomInt } from "node:crypto";

// Crockford-style base32: uppercase, with the glyphs people misread removed.
// No I or L (confusable with 1), no O (confusable with 0), and no U - which
// also keeps the generator from spelling anything unfortunate.
// 32 symbols = 5 bits each, so the default 10 characters carry 50 bits of
// entropy: roughly 1.1e15 possible codes.
const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";

const DEFAULT_LENGTH = 10;

/**
 * Generates a random coupon code.
 *
 * Uses crypto.randomInt rather than Math.random: Math.random is not
 * cryptographically secure and its internal state can be recovered from a
 * handful of outputs, which for a coupon code means someone can predict the
 * next ones and spend them. randomInt also rejection-samples internally, so
 * there is no modulo bias even if ALPHABET stops being a power of two.
 */
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

/**
 * Normalises a user-supplied code before lookup.
 *
 * Codes are generated uppercase, but people type them in lowercase, paste them
 * with a trailing space, or hyphenate what they see. Without this, a valid
 * coupon typed as "xk4p-qr7m2n" simply reports "not found".
 */
export const normalizeCouponCode = (code) =>
  String(code ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
