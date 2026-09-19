import { z } from 'zod';

export const createStoreCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional().nullable(),
  iconUrl: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateStoreCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  iconUrl: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createProductCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateProductCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
});

export type CreateStoreCategoryInput = z.infer<typeof createStoreCategorySchema>;
export type UpdateStoreCategoryInput = z.infer<typeof updateStoreCategorySchema>;
export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
