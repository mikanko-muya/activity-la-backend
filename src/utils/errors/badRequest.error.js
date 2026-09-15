import {AppError} from "./app.error.js";

export class BadRequestError extends AppError {
    constructor(message = "Bad request", details = undefined) {
        super(message, 400, details)
    }
}