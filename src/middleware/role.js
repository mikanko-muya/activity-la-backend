import { SendError } from "../utils/response.js";

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return SendError(res, 401, 'Unauthorized', 'Authentication required');
        if (!roles.includes(req.user.role)) return SendError(res, 403, 'Forbidden', 'You do not have permission to access this resource');
        next();
    }
}

