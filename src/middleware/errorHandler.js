import { AppError } from "../utils/errors/app.error.js"
import { sendError } from "../utils/response.js"

const constraintCause = (err) => err.meta?.driverAdapterError?.cause ?? {};

const constraintFields = (err) => {
    if (err.meta?.target) {
        return [].concat(err.meta.target);
    }

    const constraint = constraintCause(err).constraint ?? {};
    if (constraint.fields?.length) return constraint.fields;

    if (constraint.index && err.meta?.modelName) {
        return constraint.index
            .replace(new RegExp(`^${err.meta.modelName}_`), "")
            .replace(/_key$/, "")
            .split("_");
    }

    return [];
};

const referencingTable = (err) =>
    constraintCause(err).originalMessage?.match(/fails \(`[^`]+`\.`([^`]+)`/)?.[1];

const prismaError = (err) => {
    const fields = constraintFields(err);
    const fieldList = fields.length ? fields.join(", ") : "a unique field";

    if (err.code === "P2002") {
        return { statusCode: 409, message: `A record with this ${fieldList} already exists` };
    }

    if (err.code === "P2025") {
        return { statusCode: 404, message: "Record not found" };
    }

    if (err.code === "P2003") {
        if (constraintCause(err).originalCode === "1451") {
            const table = referencingTable(err);
            return {
                statusCode: 409,
                message: `${err.meta?.modelName ?? "This record"} is still referenced${table ? ` by ${table}` : ""} and cannot be deleted`,
            };
        }

        return {
            statusCode: 400,
            message: `${fields.length ? fields.join(", ") : "A reference"} points to a record that does not exist`,
        };
    }

    return null;
};

export const errorHandler = (err, _req, res, _next) => {
    if (err?.name === "PrismaClientKnownRequestError") {
        const mapped = prismaError(err);
        if (mapped) return sendError(res, mapped);
    }

    if (err?.type === "entity.parse.failed") {
        return sendError(res, { statusCode: 400, message: "Request body is not valid JSON" });
    }

    if (err?.type === "entity.too.large") {
        return sendError(res, { statusCode: 413, message: "Request body is too large" });
    }

    if (err?.expose && err.status >= 400 && err.status < 500) {
        return sendError(res, { statusCode: err.status, message: err.message });
    }

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
