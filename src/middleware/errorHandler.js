import { AppError } from "../utils/errors/app.error.js"
import { sendError } from "../utils/response.js"

export const errorHandler = (err, _req, res, _next) => {

    if (err?.name === "PrismaClientKnownRequestError") {
        if (err.code === "P2002") {
            return sendError(res, {
                statusCode: 409,
                message: `Duplicate value for field: ${err.meta?.target ?? "unknown"}`,
            });
        }
        if (err.code === "P2025") {
            return sendError(res, {
                statusCode: 404,
                message: "Record not found",
            });
        }
        if (err.code === "P2003") {
            return sendError(res, {
                statusCode: 400,
                message: `Invalid reference for field: ${err.meta?.field_name ?? "unknown"}`,
            });
        }
    }

    if (err instanceof AppError) {
        return sendError(res, { statusCode: err.statusCode, message: err.message, detail: err.detail })
    }

    console.error("[Unhandle error]", err)
    return sendError(res, { statusCode: 500, message: "Internal server error", })
}
