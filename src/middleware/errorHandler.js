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

    // FIX: multer's own errors (file too large, unexpected field) are plain
    // MulterErrors, not AppErrors, so they fell through to a generic 500 and the
    // client never learned the upload was simply too big.
    if (err?.name === "MulterError") {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "Image is too large (max 5MB)"
            : `Upload failed: ${err.message}`;
        return sendError(res, { statusCode: 400, message });
    }

    if (err instanceof AppError) {
        return sendError(res, { statusCode: err.statusCode, message: err.message, detail: err.detail })
    }

    console.error("[Unhandle error]", err)
    return sendError(res, { statusCode: 500, message: "Internal server error", })
}
