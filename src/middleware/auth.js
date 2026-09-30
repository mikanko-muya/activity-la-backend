import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.config.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors/index.js";
import { hasPermission } from "../config/permissions.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers["authorization"];
  if (!authorization) throw new UnauthorizedError("Token are require");

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token)
    throw new UnauthorizedError("Invalid token format");

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired authentication token");
  }

  if (typeof decoded === "string" || !decoded?.id)
    throw new UnauthorizedError("Invalid token payload");

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new UnauthorizedError("User not found");
  if (!user.isActive) throw new ForbiddenError("User account is inactive");

  req.user = {
    id: user.id,
    role: user.role,
  };
  next();
});

export const requirePermission = (permission) => {
    return (req, _res, next) => {
        if (!req.user) return next(new UnauthorizedError("Token are require"));
        if (!hasPermission(req.user.role, permission)) {
            return next(new ForbiddenError("You do not have permission"));
        }
        return next();
    };
};
