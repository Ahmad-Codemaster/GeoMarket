import { z } from 'zod';
import { OrderStatus } from '@geomarket/shared';

export const inlineAddressSchema = z.object({
  recipientName: z.string().trim().min(2, 'Recipient name must be at least 2 characters').max(100),
  recipientPhone: z.string().trim().min(7, 'Recipient phone must be at least 7 characters').max(20),
  addressLine: z.string().trim().min(5, 'Address line must be at least 5 characters').max(500),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const checkoutSchema = z.object({
  addressId: z.string().uuid('Invalid address ID').optional(),
  inlineAddress: inlineAddressSchema.optional(),
}).refine((data) => data.addressId || data.inlineAddress, {
  message: 'Either addressId or inlineAddress must be provided',
});

export const orderLookupSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  phone: z.string().trim().min(7, 'Phone number must be at least 7 characters'),
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
export type InlineAddressInput = z.infer<typeof inlineAddressSchema>;
export type OrderLookupInput = z.infer<typeof orderLookupSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
