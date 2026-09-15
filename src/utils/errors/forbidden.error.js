import { AppError } from "./app.error.js";

export class ForbiddenError extends AppError {
  constructor(message = "forbidden", details = undefined) {
    super(message, 403, details);
  }
}
