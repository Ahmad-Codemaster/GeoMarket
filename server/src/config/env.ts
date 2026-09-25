import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.coerce.number().default(3600),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z
    .string()
    .default('https://geomarket.onrender.com')
    .transform((val) => {
      return val
        .split(',')
        .map((item) => {
          let trimmed = item.trim();
          if (trimmed === '*') return trimmed;
          if (!/^https?:\/\//i.test(trimmed)) {
            trimmed = `https://${trimmed}`;
          }
          return trimmed.replace(/\/+$/, '');
        })
        .join(',');
    })
    .refine(
      (val) => {
        const parts = val.split(',');
        return parts.every((p) => {
          if (p === '*') return true;
          try {
            new URL(p);
            return true;
          } catch {
            return false;
          }
        });
      },
      { message: 'CLIENT_ORIGIN must contain valid URL(s) (e.g. https://your-frontend.onrender.com)' }
    ),
  PORT: z.coerce.number().default(3001),
  COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),
  MAX_DELIVERY_RADIUS_KM: z.coerce.number().default(500),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
