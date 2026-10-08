import { prisma } from "../../config/prisma.config.js";
import { userRepository } from "../user/user.repository.js"

export const authRepository = {
    create: (data) => { return userRepository.create(data) },
    findByPhone: (phone) => { return userRepository.findByPhone(phone) },
    findById: (id) => { return userRepository.findById(id) },
    updateById: (id, data) => { return userRepository.update(id, data) },

    createRefreshToken: (data) => prisma.refreshToken.create({ data }),

    findRefreshToken: (tokenHash) =>
        prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } }),

    // Guarded like every other state change in the project: the WHERE carries
    // the condition, so two requests racing to rotate the same token cannot both
    // succeed - the loser gets count 0 and is treated as a reuse.
    revokeRefreshToken: (tokenHash) =>
        prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        }),

    revokeAllRefreshTokensForUser: (userId) =>
        prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        }),

    deleteExpiredRefreshTokens: () =>
        prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
}
