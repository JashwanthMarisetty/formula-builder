const { RateLimiterRedis } = require('rate-limiter-flexible');
const { client: redisClient, connectRedis } = require('../config/redis');

// Beginner-friendly, per-IP+Form limiter
// Defaults: 5 submissions per minute per IP per Form
const POINTS = Number(process.env.SUBMIT_RATE_POINTS || 5);
const DURATION = Number(process.env.SUBMIT_RATE_DURATION || 60); // seconds
const KEY_PREFIX = 'rl:submit';

// Create a single limiter instance using the shared Redis client
const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: KEY_PREFIX,
  points: POINTS,
  duration: DURATION,
});

async function ensureRedis() {
  if (!redisClient.isOpen) {
    await connectRedis();
  }
}

// Middleware: limits POST /api/forms/:id/submit
async function submitRateLimit(req, res, next) {
  try {
    await ensureRedis();

    // Rate limit key: IP + Form ID (so users submitting different forms are not blocked globally)
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const formId = req.params?.id || 'unknown';
    const key = `${ip}:${formId}`;

    await limiter.consume(key);
    return next();
  } catch (rejRes) {
    return res.status(429).json({
      success: false,
      message: 'Too many submissions. Please wait and try again.',
    });
  }
}

module.exports = { submitRateLimit };
