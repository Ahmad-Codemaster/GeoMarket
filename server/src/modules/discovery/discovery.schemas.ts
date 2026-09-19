import { z } from 'zod';

export const storeDiscoveryQuerySchema = z.object({
  latitude: z.coerce
    .number({ required_error: 'Latitude is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number({ required_error: 'Longitude is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  storeCategoryId: z
    .string()
    .uuid('Invalid storeCategoryId format (UUID expected)')
    .optional(),
  search: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query is too long')
    .optional(),
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  pageSize: z.coerce
    .number()
    .int('Page size must be an integer')
    .min(1, 'Page size must be at least 1')
    .max(50, 'Page size cannot exceed 50')
    .default(10),
  referenceTime: z.string().datetime({ message: 'Invalid referenceTime ISO timestamp' }).optional(),
});

export const storeProductsQuerySchema = z.object({
  productCategoryId: z
    .string()
    .uuid('Invalid productCategoryId format (UUID expected)')
    .optional(),
  search: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type StoreDiscoveryQueryInput = z.infer<typeof storeDiscoveryQuerySchema>;
export type StoreProductsQueryInput = z.infer<typeof storeProductsQuerySchema>;
