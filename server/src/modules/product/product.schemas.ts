import { z } from 'zod';

function normalizeProductInput(arg: any) {
  if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
    const copy = { ...arg };
    if (copy.product_category_id !== undefined && copy.productCategoryId === undefined) {
      copy.productCategoryId = copy.product_category_id;
    }
    if (copy.store_id !== undefined && copy.storeId === undefined) {
      copy.storeId = copy.store_id;
    }
    if (copy.stock_quantity !== undefined && copy.stockQuantity === undefined) {
      copy.stockQuantity = copy.stock_quantity;
    }
    if (copy.image_url !== undefined && copy.imageUrl === undefined) {
      copy.imageUrl = copy.image_url;
    }
    if (copy.is_active !== undefined && copy.isActive === undefined) {
      copy.isActive = copy.is_active;
    }
    if (typeof copy.price === 'string' && copy.price.trim() !== '' && !isNaN(Number(copy.price))) {
      copy.price = Number(copy.price);
    }
    if (typeof copy.stockQuantity === 'string' && /^-?\d+$/.test(copy.stockQuantity.trim())) {
      copy.stockQuantity = parseInt(copy.stockQuantity.trim(), 10);
    }
    return copy;
  }
  return arg;
}

export const createProductSchema = z.preprocess(
  normalizeProductInput,
  z.object({
    name: z
      .string({ required_error: 'Product name is required' })
      .trim()
      .min(1, 'Product name cannot be empty')
      .max(255, 'Product name cannot exceed 255 characters'),
    productCategoryId: z
      .string({ required_error: 'Product category ID is required' })
      .uuid('Invalid product category ID'),
    description: z.string().trim().max(5000, 'Description cannot exceed 5000 characters').optional().nullable(),
    price: z
      .number({ required_error: 'Product price is required' })
      .min(0, 'Product price must be greater than or equal to zero'),
    stockQuantity: z
      .number()
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity cannot be negative')
      .optional()
      .default(0),
    sku: z.string().trim().max(100, 'SKU cannot exceed 100 characters').optional().nullable(),
    imageUrl: z.string().trim().max(1000, 'Image URL cannot exceed 1000 characters').optional().nullable(),
    unit: z.string().trim().max(50, 'Unit cannot exceed 50 characters').optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
);

export const updateProductSchema = z.preprocess(
  normalizeProductInput,
  z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Product name cannot be empty')
      .max(255, 'Product name cannot exceed 255 characters')
      .optional(),
    productCategoryId: z.string().uuid('Invalid product category ID').optional(),
    description: z.string().trim().max(5000, 'Description cannot exceed 5000 characters').optional().nullable(),
    price: z
      .number()
      .min(0, 'Product price must be greater than or equal to zero')
      .optional(),
    stockQuantity: z
      .number()
      .int('Stock quantity must be an integer')
      .min(0, 'Stock quantity cannot be negative')
      .optional(),
    sku: z.string().trim().max(100, 'SKU cannot exceed 100 characters').optional().nullable(),
    imageUrl: z.string().trim().max(1000, 'Image URL cannot exceed 1000 characters').optional().nullable(),
    unit: z.string().trim().max(50, 'Unit cannot exceed 50 characters').optional().nullable(),
    isActive: z.boolean().optional(),
  }),
);

export const inventoryOperationSchema = z.preprocess(
  (arg: any) => {
    if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
      const copy = { ...arg };
      if (copy.stock_quantity !== undefined && copy.quantity === undefined) {
        copy.quantity = copy.stock_quantity;
      }
      if (copy.stockQuantity !== undefined && copy.quantity === undefined) {
        copy.quantity = copy.stockQuantity;
      }
      if (copy.amount !== undefined && copy.quantity === undefined) {
        copy.quantity = copy.amount;
      }
      if (typeof copy.quantity === 'string' && /^-?\d+$/.test(copy.quantity.trim())) {
        copy.quantity = parseInt(copy.quantity.trim(), 10);
      }
      if (copy.operation) {
        let op = String(copy.operation).toUpperCase();
        if (op === 'INCREASE') op = 'INCREMENT';
        if (op === 'DECREASE') op = 'DECREMENT';
        copy.operation = op;
      }
      return copy;
    }
    return arg;
  },
  z
    .object({
      operation: z.enum(['SET', 'INCREMENT', 'DECREMENT']).default('SET'),
      quantity: z.number({ required_error: 'Quantity is required' }).int('Quantity must be an integer'),
    })
    .refine(
      (data) => {
        if (data.operation === 'SET') {
          return data.quantity >= 0;
        }
        return data.quantity > 0;
      },
      {
        message: 'Quantity must be >= 0 for SET, and > 0 for INCREMENT/DECREMENT',
        path: ['quantity'],
      },
    ),
);

export const toggleProductActiveSchema = z.preprocess(
  (arg: any) => {
    if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
      const copy = { ...arg };
      if (copy.is_active !== undefined && copy.isActive === undefined) {
        copy.isActive = copy.is_active;
      }
      return copy;
    }
    return arg;
  },
  z.object({
    isActive: z.boolean().optional(),
  }),
);

export const uuidParamSchema = z.string().uuid('Invalid ID format');

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type InventoryOperationInput = z.infer<typeof inventoryOperationSchema>;
export type ToggleProductActiveInput = z.infer<typeof toggleProductActiveSchema>;
