import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRateLimiter } from '../src/middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  it('should allow requests within limit and block subsequent requests with 429', async () => {
    const testApp = express();
    testApp.use(express.json());

    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
      message: 'Rate limit test exceeded',
    });

    testApp.post('/test-limit', testLimiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    // First 3 requests should succeed
    for (let i = 0; i < 3; i++) {
      const res = await request(testApp).post('/test-limit');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // 4th request must be blocked with 429
    const blockedRes = await request(testApp).post('/test-limit');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toContain('Rate limit test exceeded');
  });
});
