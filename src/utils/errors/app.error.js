export class AppError extends Error{
    constructor(message = "Server internal", statusCode = 500, details = undefined){
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
        this.detail = details;

        Error.captureStackTrace(this, this.constructor)
    }
    
}
