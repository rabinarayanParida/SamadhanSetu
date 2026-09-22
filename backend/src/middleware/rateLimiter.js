/**
 * Rate Limiter Middleware
 * Prevents abuse of challenge submission endpoints
 */

const rateLimitStore = new Map();

/**
 * Create a rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message
 * @returns {Function} Express middleware
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 50, message = 'Too many requests. Please try again later.' } = {}) {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const key = `${req.user?.id || req.ip}:${req.baseUrl}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const entry = rateLimitStore.get(key);

    if (now > entry.resetAt) {
      // Window expired, reset
      entry.count = 1;
      entry.resetAt = now + windowMs;
      return next();
    }

    entry.count++;

    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  };
}

// Predefined limiters
const challengeSubmitLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'You can create a maximum of 10 challenges per 15 minutes.',
});

const mediaUploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many file uploads. Please wait before uploading more.',
});

module.exports = { createRateLimiter, challengeSubmitLimiter, mediaUploadLimiter };
