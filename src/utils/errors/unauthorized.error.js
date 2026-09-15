import {AppError} from "./app.error.js";

export class UnauthorizedError extends AppError{
    constructor(message = "Unauthorized", details = undefined){
        super(message, 401, details)
    }
}