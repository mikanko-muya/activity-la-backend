import {BadRequestError} from "../utils/errors/index.js"

export const validate = (schema, target = "body") => (req, res, next) => {
    const payload = req[target] ?? {};
    const result = schema.safeParse(payload)

    if(!result.success) {
        const details = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
        }))

        return next(new BadRequestError("Bad request", details))
    }

    if (target === "query") {
        Object.defineProperty(req, "query", {
            value: result.data,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    } else {
        req[target] = result.data;
    }

    next()
}
