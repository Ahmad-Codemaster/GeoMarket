import { z } from 'zod';

function normalizeCartInput(arg: any) {
  if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
    const copy = { ...arg };
    if (copy.product_id !== undefined && copy.productId === undefined) {
      copy.productId = copy.product_id;
    }
    if (typeof copy.quantity === 'string' && /^-?\d+$/.test(copy.quantity.trim())) {
      copy.quantity = parseInt(copy.quantity.trim(), 10);
    }
    return copy;
  }
  return arg;
}

export const addToCartSchema = z.preprocess(
  normalizeCartInput,
  z.object({
    productId: z
      .string({ required_error: 'Product ID is required' })
      .uuid('Invalid product ID'),
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be an integer')
      .finite('Quantity must be finite')
      .min(1, 'Quantity must be at least 1'),
  })
);

export const updateCartItemSchema = z.preprocess(
  normalizeCartInput,
  z.object({
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be an integer')
      .finite('Quantity must be finite')
      .min(1, 'Quantity must be at least 1'),
  })
);

export const uuidParamSchema = z.string().uuid('Invalid UUID parameter');

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
