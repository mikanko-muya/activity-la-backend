import { sendError } from "../utils/response.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.config.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const authorization = req.headers["authorization"];
  if (!authorization) throw new UnauthorizedError("Token are require");

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token)
    throw new UnauthorizedError("Invalid token format");
  try {
    const decoded = verifyAccessToken(token);
    if (typeof(decoded) === "string") throw new err
  } catch (err) {
    next(new UnauthorizedError("Invalid or expired authentication token"));
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new UnauthorizedError("User not found");
  if (!user.isActive) throw new ForbiddenError("User account is inactive");

  req.user = {
    id: user.id,
    role: user.role,
  };
  next();
});

export const authorize = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) next(new UnauthorizedError("Token are require"))
        if (!roles.includes(req.user.role)) next(new ForbiddenError("You do not have permission") )
        next();
    }
}