import { z } from 'zod';
import { UserRole } from '@geomarket/shared';

export const registerCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().min(7).max(20).trim(),
});

export const registerVendorSchema = registerCustomerSchema.extend({
  businessLegalName: z.string().min(1).max(255).trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const guestSessionSchema = z.object({
  firstName: z.string().max(100).trim().optional(),
  lastName: z.string().max(100).trim().optional(),
  phone: z.string().max(20).trim().optional(),
  email: z.string().email().optional(),
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type RegisterVendorInput = z.infer<typeof registerVendorSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GuestSessionInput = z.infer<typeof guestSessionSchema>;
