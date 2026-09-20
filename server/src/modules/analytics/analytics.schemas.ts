import { z } from 'zod';

export const vendorAnalyticsQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  period: z
    .enum(['today', 'last_7_days', 'last_30_days', 'all_time'])
    .default('all_time'),
  timezone: z.string().optional(),
});

export type VendorAnalyticsQueryInput = z.infer<typeof vendorAnalyticsQuerySchema>;
