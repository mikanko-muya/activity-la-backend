import { SendError } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";
export const authenticate = async (req, res, next) => {
    try {
        const authorization = req.headers['authorization'];
        if (!authorization) return SendError(res, 401, 'Unauthorized', 'No token provided');

        const [scheme, token] = authorization.split(' ');
        if (scheme !== 'Bearer' || !token) return SendError(res, 401, 'Unauthorized', 'Invalid token format');

        const decoded = verifyAccessToken(token);

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return SendError(res, 401, 'Unauthorized', 'User not found');
        if (!user.isActive) return SendError(res, 403, 'Forbidden', 'User account is inactive');

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        }

        next();
    } catch (error) {
        return SendError(res, 401, 'Unauthorized', 'Invalid or expired token');
    }
}