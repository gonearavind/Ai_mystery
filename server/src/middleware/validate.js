import { AppError } from './errorHandler.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      if (schema && typeof schema.parse === 'function') {
        if (schema.shape && (schema.shape.body || schema.shape.params || schema.shape.query)) {
          const parsed = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query
          });
          if (parsed.body) req.body = parsed.body;
          if (parsed.params) req.params = parsed.params;
          if (parsed.query) req.query = parsed.query;
        } else {
          req.body = schema.parse(req.body);
        }
      }
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const message = err.errors.map((e) => e.message).join('; ');
        return next(new AppError(400, 'VALIDATION_ERROR', message));
      }
      next(err);
    }
  };
}

export default validate;
