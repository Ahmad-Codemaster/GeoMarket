import { z } from 'zod';
import { OrderStatus } from '@geomarket/shared';

export const checkoutSchema = z.object({
  addressId: z
    .string({ required_error: 'Address ID is required' })
    .uuid('Invalid address ID'),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
});

export const uuidParamSchema = z.string().uuid('Invalid UUID parameter');

export const orderQuerySchema = z.object({
  storeId: z.string().uuid().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
