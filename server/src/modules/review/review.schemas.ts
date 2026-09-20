import { z } from 'zod';

export const uuidParamSchema = z.string().uuid('Invalid UUID');

export const createReviewSchema = z.object({
  orderId: z.string().uuid('Valid order ID is required'),
  storeId: z.string().uuid('Valid store ID is required').optional(),
  rating: z.coerce
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .trim()
    .max(1000, 'Comment cannot exceed 1000 characters')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export const updateReviewSchema = z
  .object({
    rating: z.coerce
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional(),
    comment: z
      .string()
      .trim()
      .max(1000, 'Comment cannot exceed 1000 characters')
      .optional()
      .nullable()
      .transform((val) => (val !== undefined ? (val && val.length > 0 ? val : null) : undefined)),
  })
  .refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: 'At least one field (rating or comment) must be provided for update',
  });

export const storeReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const vendorReviewsQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type StoreReviewsQueryInput = z.infer<typeof storeReviewsQuerySchema>;
export type VendorReviewsQueryInput = z.infer<typeof vendorReviewsQuerySchema>;
