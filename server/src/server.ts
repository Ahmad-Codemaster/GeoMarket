import 'dotenv/config';
import './config/env'; // Validate env first
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[GeoMarket Server] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

process.on('SIGTERM', async () => {
  console.log('[GeoMarket Server] SIGTERM received. Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});
