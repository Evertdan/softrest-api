export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  static badRequest(message: string, code?: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, code || "BAD_REQUEST", details);
  }

  static unauthorized(message: string = "No autorizado", code?: string): AppError {
    return new AppError(message, 401, code || "UNAUTHORIZED");
  }

  static forbidden(message: string = "Acceso denegado", code?: string): AppError {
    return new AppError(message, 403, code || "FORBIDDEN");
  }

  static notFound(message: string, code?: string): AppError {
    return new AppError(message, 404, code || "NOT_FOUND");
  }

  static conflict(message: string, code?: string): AppError {
    return new AppError(message, 409, code || "CONFLICT");
  }
}
