import {BadRequestError,ConflictError,UnauthorizedError,} from "../../utils/errors/index.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { hashToken } from "../../utils/tokenHash.js";
import { authRepository } from "./auth.repository.js";

const toSafeData = (user) => {
  const { password, profilePublicId, ...safeData } = user;
  return safeData;
};

const REFRESH_TOKEN_DAYS = 7;

// Issues the pair and records the refresh token's digest, so logout and reuse
// detection have a row to act on. The access token stays stateless: it is short
// enough that revoking it is not worth a lookup on every request.
const issueSession = async (user) => {
  const accessToken = generateAccessToken({ id: user.id });
  const refreshToken = generateRefreshToken({ id: user.id });

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};

export const authService = {
  async register(input) {
    const existingPhone = await authRepository.findByPhone(input.phone);
    if (existingPhone) throw new ConflictError("Phone is already registered");

    const hashedPassword = await hashPassword(input.password);
    const user = await authRepository.create({
      ...input,
      password: hashedPassword,
    });
    return toSafeData(user);
  },

  async login(input) {
    const user = await authRepository.findByPhone(input.phone);
    if (!user) throw new UnauthorizedError("Invalid phone or password");

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedError("Invalid phone or password");

    if (!user.isActive) throw new UnauthorizedError("User account is inactive");

    const session = await issueSession(user);

    return { user: toSafeData(user), ...session };
  },

  // Rotation: the presented token is revoked and a new pair issued, so a
  // refresh token is good for exactly one use. That is what makes the reuse
  // check below meaningful.
  async refreshSession(input) {
    let payload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const tokenHash = hashToken(input.refreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);

    // A signature can be valid while the row is gone: logout deleted it, or the
    // token was issued before a password reset wiped the user's sessions.
    if (!stored) throw new UnauthorizedError("Refresh token is no longer valid");

    // Already used. Either the token was stolen and replayed, or a client
    // retried; neither is safe to serve, so every session for that user ends
    // and they log in again.
    if (stored.revokedAt) {
      await authRepository.revokeAllRefreshTokensForUser(stored.userId);
      throw new UnauthorizedError("Refresh token has already been used");
    }

    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedError("Refresh token has expired");
    }

    if (stored.userId !== payload.id) {
      throw new UnauthorizedError("Refresh token does not match its user");
    }

    if (!stored.user.isActive) throw new UnauthorizedError("User account is inactive");

    const revoked = await authRepository.revokeRefreshToken(tokenHash);
    if (revoked.count !== 1) {
      // Another request rotated this token between the read above and here.
      throw new UnauthorizedError("Refresh token has already been used");
    }

    const session = await issueSession(stored.user);

    return { user: toSafeData(stored.user), ...session };
  },

  // Logout is the reason the digests are stored at all: without a row there is
  // nothing to revoke and a stolen refresh token stays good for a week.
  async logout(input) {
    await authRepository.revokeRefreshToken(hashToken(input.refreshToken));
    return { message: "Signed out" };
  },

  async forgotPassword(input) {
    const user = await authRepository.findByPhone(input.phone);
    if (!user) throw new BadRequestError("Invalid phone");

    const hashedPassword = await hashPassword(input.newPassword);
    const update = await authRepository.updateById(user.id, { password: hashedPassword });

    // Changing the password ends every session, which is the point of changing
    // it when an account may be compromised.
    await authRepository.revokeAllRefreshTokensForUser(user.id);

    return toSafeData(update);
  },
};
