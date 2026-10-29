// @ts-nocheck
import { randomUUID } from "node:crypto";

import jwt from "jsonwebtoken";

import { JWT_SECRET, JWT_REFRESH_SECRET } from "../config/globalkey.js";
import { UnauthorizedError } from "./errors/index.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = "7d";

const ACCESS = "access";
const REFRESH = "refresh";

const MIN_SECRET_LENGTH = 32;

const assertUsableSecret = (name, secret) => {
    if (!secret) {
        throw new Error(`${name} is not set - add it to .env before starting the server. Generate one with: npm run secret`);
    }
    if (secret.length < MIN_SECRET_LENGTH) {
        throw new Error(
            `${name} is only ${secret.length} characters - it must be at least ${MIN_SECRET_LENGTH}. ` +
            `Generate one with: npm run secret`
        );
    }
};

assertUsableSecret("JWT_SECRET", JWT_SECRET);
assertUsableSecret("JWT_REFRESH_SECRET", JWT_REFRESH_SECRET);

if (JWT_SECRET === JWT_REFRESH_SECRET) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different values");
}

const sign = (payload, secret, typ, expiresIn) =>
    jwt.sign({ ...payload, typ }, secret, { expiresIn });

const verify = (token, secret, typ) => {
    let decoded;

    try {
        decoded = jwt.verify(token, secret);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError(`The ${typ} token has expired`);
        }
        throw new UnauthorizedError(`Invalid ${typ} token`);
    }

    if (typeof decoded !== "object" || decoded === null || decoded.typ !== typ) {
        throw new UnauthorizedError(`Invalid ${typ} token`);
    }

    return decoded;
};

// jti on both kinds, for the reason spelled out below: two tokens minted in the
// same second with the same payload would otherwise be the same string.
export const generateAccessToken = (payload) =>
    sign({ ...payload, jti: randomUUID() }, JWT_SECRET, ACCESS, ACCESS_TOKEN_TTL);

// A JWT is a pure function of its payload and secret, and iat/exp only have
// second resolution, so logging in and refreshing within the same second
// produced byte-identical tokens - and storing the second refresh token hit the
// tokenHash unique constraint.
export const generateRefreshToken = (payload) =>
    sign({ ...payload, jti: randomUUID() }, JWT_REFRESH_SECRET, REFRESH, REFRESH_TOKEN_TTL);

export const verifyAccessToken = (token) => verify(token, JWT_SECRET, ACCESS);

export const verifyRefreshToken = (token) => verify(token, JWT_REFRESH_SECRET, REFRESH);

export const generateTokens = (payload) => ({
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
});
