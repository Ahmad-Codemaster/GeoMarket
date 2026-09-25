import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import apiRouter from './routes/index';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS: allow configured origin, or dynamic origin in development for live tunnels (ngrok, cloudflare)
  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin or non-browser tools (no origin header)
        if (!origin) {
          return callback(null, true);
        }
        // Development and test modes: permit local dev tools and tunnels
        if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
          return callback(null, true);
        }
        // Production: strict origin check against allowed origins
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // Serve uploaded images statically
  const uploadsDir = path.resolve(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Instant health check for hosting platforms (Render, Railway, etc.)
  app.get(['/health', '/api/v1/health'], (_req, res) => {
    return res.status(200).send('OK');
  });

  // Mount all API routes under /api/v1
  app.use('/api/v1', apiRouter);

  // Catch 404s for API routes so they return JSON rather than SPA index.html
  app.use('/api/v1', (_req, res) => {
    return res.status(404).json({ error: 'API route not found' });
  });

  // Serve React build (populated during Docker multi-stage build)
  const clientDistDir = path.resolve(__dirname, '../public/client');
  if (fs.existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));

    // SPA catch-all: any non-API, non-file route → React's index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDistDir, 'index.html'));
    });
  } else {
    // Development fallback: no built client present
    app.get('/', (_req, res) => {
      res.json({
        name: 'GeoMarket API',
        status: 'running',
        version: '1.0.0',
        note: 'Run client separately with `pnpm dev:client` in development.',
        healthCheck: '/api/v1/health',
      });
    });
  }

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Error]', err.message);
    return res.status(500).json({ error: 'An internal server error occurred' });
  });

  return app;
}
