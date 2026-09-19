import { z } from 'zod';

export const createAddressSchema = z.object({
  addressLabel: z.string().min(1, 'Label is required').max(50, 'Label is too long').trim(),
  recipientName: z.string().min(1).max(100).trim().optional().nullable(),
  recipientPhone: z.string().min(7).max(20).trim().optional().nullable(),
  addressLine: z.string().min(3, 'Address line must be at least 3 characters').max(500).trim(),
  city: z.string().min(2, 'City is required').max(100).trim(),
  latitude: z.coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
