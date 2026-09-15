import {BadRequestError} from "../utils/errors/index.js"

export const validate = (schema, target = "body") => (req, res, next) => {
    const result = schema.safeParse(req[target])
    
    if(!result.success) {
        const details = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
        }))

        return next(new BadRequestError("Bad request", details))
    }

    req[target] = result.data;
    next()
}