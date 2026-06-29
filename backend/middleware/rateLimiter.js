const redisClient = require('../config/redisClient');

const apiRateLimiter = (options = {}) => {
  const {
    windowSeconds = 10,
    keyPrefix = 'rateLimit',
    statusCode = 429,
    message = 'Rate limit exceeded. Try again after 10 seconds.'
  } = options;

  return async (req, res, next) => {
    // Generate a unique identifier: Use user ID if authenticated, else fallback to IP
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const redisKey = `${keyPrefix}:${identifier}:${req.originalUrl || req.path}`;

    try {
      const exists = await redisClient.exists(redisKey);

      if (exists) {
        return res.status(statusCode).json({ message });
      }

      // Set key with expiry (windowSeconds) if not exists
      await redisClient.set(redisKey, 'cooldown_active', {
        EX: windowSeconds,
        NX: true
      });

      next();
    } catch (err) {
      console.error('Rate limiting error:', err);
      // Fallback: let the request proceed to avoid breaking the application if Redis fails
      next();
    }
  };
};

module.exports = apiRateLimiter;
