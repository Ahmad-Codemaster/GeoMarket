import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import apiRouter from './routes/index';

export function createApp() {
  const app = express();

  // CORS: allow configured origin, or dynamic origin in development for live tunnels (ngrok, cloudflare)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.NODE_ENV !== 'production' || origin === env.CLIENT_ORIGIN) {
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

  // Root status endpoint
  app.get('/', (_req, res) => {
    return res.json({
      name: 'GeoMarket API',
      status: 'running',
      version: '1.0.0',
      frontendUrl: env.CLIENT_ORIGIN,
      healthCheck: '/api/v1/health',
      message: 'GeoMarket Backend API is running. Visit the frontend application at ' + env.CLIENT_ORIGIN,
    });
  });

  // Mount all API routes under /api/v1
  app.use('/api/v1', apiRouter);

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Error]', err.message);
    return res.status(500).json({ error: 'An internal server error occurred' });
  });

  return app;
}
