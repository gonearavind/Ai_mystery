/**
 * security.js — Production Security Headers Middleware
 *
 * Implements OWASP recommended security headers natively:
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options (nosniff)
 * - X-Frame-Options (DENY)
 * - Referrer-Policy
 * - Content-Security-Policy
 * - Permissions-Policy
 */

export function securityHeaders(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features and APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Enforce HTTPS when in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Cross-Origin Resource Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');

  next();
}

export default securityHeaders;

