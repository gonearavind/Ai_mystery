import rateLimit from 'express-rate-limit';

export const caseCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 mystery creations per window per IP
  standardHeaders: true, // Draft-6/Draft-7 RateLimit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Case creation limit reached (maximum 10 per hour). Please try again later.'
      }
    });
  }
});

export default caseCreationRateLimit;
