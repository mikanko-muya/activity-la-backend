import {BadRequestError,ConflictError,UnauthorizedError,} from "../../utils/errors/index.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { authRepository } from "./auth.repository.js";

const toSafeData = (user) => {
  const { password, profilePublicId, ...safeData } = user;
  return safeData;
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

    const accessToken = generateAccessToken({ id: user.id });
    const refreshToken = generateRefreshToken({ id: user.id });

    return { user: toSafeData(user), accessToken, refreshToken };
  },

  async forgotPassword(input) {
    const user = await authRepository.findByPhone(input.phone);
    if (!user) throw new BadRequestError("Invalid phone");

    const hashedPassword = hashPassword(input.password);
    const update = await authRepository.updateById(user.id, { password: hashedPassword });
    return toSafeData(update);
  },
};
