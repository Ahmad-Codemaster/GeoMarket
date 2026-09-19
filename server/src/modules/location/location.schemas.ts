import { z } from 'zod';

export const reverseGeocodeSchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

export const forwardGeocodeSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(255).trim(),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type ReverseGeocodeInput = z.infer<typeof reverseGeocodeSchema>;
export type ForwardGeocodeInput = z.infer<typeof forwardGeocodeSchema>;
