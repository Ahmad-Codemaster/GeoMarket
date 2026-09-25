import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Security Headers & CORS Hardening', () => {
  const app = createApp();

  it('should include Helmet security headers on HTTP responses', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    // Helmet standard headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    // X-Powered-By must be disabled
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('should not leak X-Powered-By on API endpoints', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('should allow requests with matching trusted origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
