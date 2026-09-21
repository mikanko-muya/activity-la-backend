import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.config.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers["authorization"];
  if (!authorization) throw new UnauthorizedError("Token are require");

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token)
    throw new UnauthorizedError("Invalid token format");

  // FIX: verifyAccessToken was called bare, so jsonwebtoken's TokenExpiredError /
  // JsonWebTokenError reached errorHandler unrecognised and came back as a 500.
  // An expired or forged token is a 401, not a server fault.
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired authentication token");
  }

  // A token signed with a string payload decodes to a string and has no .id.
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

export const authorize = (...roles) => {
    return (req, _res, next) => {
        // FIX: neither branch returned, so a rejected request called next() with
        // an error AND then next() again - Express tried to respond twice
        // ("Cannot set headers after they are sent").
        if (!req.user) return next(new UnauthorizedError("Token are require"));
        if (!roles.includes(req.user.role)) return next(new ForbiddenError("You do not have permission"));
        return next();
    }
}
