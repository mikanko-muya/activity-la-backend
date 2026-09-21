import {BadRequestError} from "../utils/errors/index.js"

export const validate = (schema, target = "body") => (req, res, next) => {
    // FIX: on Express 5 req.body is `undefined` (not `{}`) when no JSON body was
    // sent, so safeParse(undefined) reported "expected object, received
    // undefined" instead of naming the fields that were missing.
    const payload = req[target] ?? {};
    const result = schema.safeParse(payload)

    if(!result.success) {
        const details = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
        }))

        return next(new BadRequestError("Bad request", details))
    }

    // FIX: `req.query = result.data` throws on Express 5 - query is a
    // getter-only accessor on the request prototype, and this file is an ES
    // module (strict mode), so the assignment is a TypeError rather than a
    // silent no-op. Every route using validate(schema, "query") 500'd.
    // defineProperty shadows the getter with the parsed value, so controllers
    // can keep reading req.query and still get coerced page/limit/booleans.
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
