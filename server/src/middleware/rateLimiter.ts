import rateLimit from 'express-rate-limit';

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: options.message || 'Too many requests, please try again later.',
    },
  });
}

// 10 attempts per 15 minutes on auth routes (login, register)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});

// 15 guest sessions per 15 minutes
export const guestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many guest session creations, please try again after 15 minutes.',
});

// 20 order tracking lookups per 15 minutes
export const orderLookupLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many order tracking attempts, please try again after 15 minutes.',
});
