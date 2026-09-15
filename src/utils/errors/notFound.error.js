import {AppError} from "./app.error.js";

export class NotFoundError extends AppError{
    constructor(message= "Not found", details = undefined){
        super(message, 404, details);
    }
}