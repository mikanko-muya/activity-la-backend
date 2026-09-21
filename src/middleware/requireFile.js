import { BadRequestError } from "../utils/errors.js"
import { sendError } from "../utils/response.js"

export const requireFile = (fieldName = "file") => {
    return (req, _res, next) => {
        if (!req.file) return next(new BadRequestError(`${fieldName} are required`));
        next()
    }
}