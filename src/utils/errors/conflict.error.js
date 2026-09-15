import {AppError} from "./app.error.js";

export class ConflictError extends AppError{
    constructor(message = "Conflict", details = undefined){
        super(message, 409, details )
    }
}