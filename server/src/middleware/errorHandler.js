import logger from '../utils/logger.js';

export class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  // Operational errors (AppError)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError] ${err.statusCode} - ${err.code}: ${err.message}`, { error: err });
    } else {
      logger.warn(`[AppError] ${err.statusCode} - ${err.code}: ${err.message}`);
    }

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const message = err.errors?.map((e) => e.message).join('; ') || 'Validation error';
    logger.warn(`[ZodError] 400 - VALIDATION_ERROR: ${message}`);
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message
      }
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    logger.warn(`[CastError] 404 - NOT_FOUND: ${err.message}`);
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Case not found'
      }
    });
  }

  // JSON syntax errors from body-parser
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    logger.warn(`[SyntaxError] 400 - Invalid JSON payload: ${err.message}`);
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON payload received in request body.'
      }
    });
  }

  // Log unhandled unexpected errors
  logger.error(`[UnhandledError] ${err.message}`, { error: err });

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500
    ? 'An unexpected internal error occurred. Please try again later.'
    : (err.message || 'An error occurred.');

  return res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
}

export default errorHandler;
