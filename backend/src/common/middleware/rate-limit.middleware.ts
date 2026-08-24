import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

// Expired entries cleanup — memory leak rokne ke liye
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000); // every 5 minutes

export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetAt < now) {
      store[key] = { count: 1, resetAt: now + windowMs };
      next();
      return;
    }

    store[key].count++;

    // Rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - store[key].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetAt / 1000));

    if (store[key].count > max) {
      res.status(429).json({
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    next();
  };
}

// ─── Presets ──────────────────────────────────────────────────────────────────

// Auth routes — strict
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 10,
  message: 'Too many login attempts. Try again in 15 minutes.',
});

// API routes — standard
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,        // 1 min
  max: 100,
});

// Webhook routes — lenient (Retell/Twilio frequent events)
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
});