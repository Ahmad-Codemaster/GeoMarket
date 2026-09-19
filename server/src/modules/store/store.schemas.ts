import { z } from 'zod';
import { env } from '../../config/env';

// Helper to preprocess snake_case field aliases to camelCase
function normalizeStoreInput(arg: any) {
  if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
    const copy = { ...arg };
    if (copy.store_category_id !== undefined && copy.storeCategoryId === undefined) {
      copy.storeCategoryId = copy.store_category_id;
    }
    if (copy.address_line !== undefined && copy.addressLine === undefined) {
      copy.addressLine = copy.address_line;
    }
    if (copy.delivery_radius_km !== undefined && copy.deliveryRadiusKm === undefined) {
      copy.deliveryRadiusKm = copy.delivery_radius_km;
    }
    if (copy.base_delivery_fee !== undefined && copy.baseDeliveryFee === undefined) {
      copy.baseDeliveryFee = copy.base_delivery_fee;
    }
    if (copy.min_order_amount !== undefined && copy.minOrderAmount === undefined) {
      copy.minOrderAmount = copy.min_order_amount;
    }
    if (copy.is_accepting_orders !== undefined && copy.isAcceptingOrders === undefined) {
      copy.isAcceptingOrders = copy.is_accepting_orders;
    }
    // Strictly strip vendor attempts to set status or is_active
    delete copy.status;
    delete copy.isActive;
    delete copy.is_active;
    return copy;
  }
  return arg;
}

export const createStoreSchema = z.preprocess(
  normalizeStoreInput,
  z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
    storeCategoryId: z.string().uuid('Invalid store category ID'),
    description: z.string().trim().optional().nullable(),
    addressLine: z.string().trim().min(5, 'Address line must be at least 5 characters').max(500),
    city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    deliveryRadiusKm: z
      .number({ required_error: 'delivery_radius_km is required' })
      .gt(0, 'delivery_radius_km must be greater than 0')
      .refine((val) => val <= env.MAX_DELIVERY_RADIUS_KM, {
        message: `delivery_radius_km cannot exceed ${env.MAX_DELIVERY_RADIUS_KM} km`,
      }),
    baseDeliveryFee: z.number().min(0).default(0),
    minOrderAmount: z.number().min(0).default(0),
    timezone: z.string().trim().default('Asia/Karachi'),
    isAcceptingOrders: z.boolean().optional().default(true),
  }),
);

export const updateStoreSchema = z.preprocess(
  normalizeStoreInput,
  z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255).optional(),
    storeCategoryId: z.string().uuid('Invalid store category ID').optional(),
    description: z.string().trim().optional().nullable(),
    addressLine: z.string().trim().min(5, 'Address line must be at least 5 characters').max(500).optional(),
    city: z.string().trim().min(2, 'City must be at least 2 characters').max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    deliveryRadiusKm: z
      .number()
      .gt(0, 'delivery_radius_km must be greater than 0')
      .refine((val) => val <= env.MAX_DELIVERY_RADIUS_KM, {
        message: `delivery_radius_km cannot exceed ${env.MAX_DELIVERY_RADIUS_KM} km`,
      })
      .optional(),
    baseDeliveryFee: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).optional(),
    timezone: z.string().trim().optional(),
    isAcceptingOrders: z.boolean().optional(),
  }),
);

const timeFormatRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeOperatingHourItem(arg: any) {
  if (arg && typeof arg === 'object') {
    const copy = { ...arg };
    if (copy.day_of_week !== undefined && copy.dayOfWeek === undefined) {
      copy.dayOfWeek = copy.day_of_week;
    }
    if (copy.opening_time !== undefined && copy.openingTime === undefined) {
      copy.openingTime = copy.opening_time;
    }
    if (copy.closing_time !== undefined && copy.closingTime === undefined) {
      copy.closingTime = copy.closing_time;
    }
    if (copy.is_closed !== undefined && copy.isClosed === undefined) {
      copy.isClosed = copy.is_closed;
    }
    return copy;
  }
  return arg;
}

export const operatingHourItemSchema = z.preprocess(
  normalizeOperatingHourItem,
  z
    .object({
      dayOfWeek: z.number().int().min(0).max(6),
      openingTime: z.string().regex(timeFormatRegex, 'Invalid opening_time format (HH:MM)'),
      closingTime: z.string().regex(timeFormatRegex, 'Invalid closing_time format (HH:MM)'),
      isClosed: z.boolean().default(false),
    })
    .refine(
      (data) => data.isClosed || data.openingTime < data.closingTime,
      {
        message: 'opening_time must be earlier than closing_time when store is not closed (no overnight schedules)',
        path: ['closingTime'],
      },
    ),
);

export const batchOperatingHoursSchema = z.preprocess(
  (arg: any) => {
    if (Array.isArray(arg)) {
      return { hours: arg };
    }
    return arg;
  },
  z
    .object({
      hours: z.array(operatingHourItemSchema).min(1, 'At least one operating hour record is required'),
    })
    .refine(
      (data) => {
        const days = data.hours.map((item) => item.dayOfWeek);
        return new Set(days).size === days.length;
      },
      {
        message: 'Duplicate day_of_week found in operating hours schedule',
        path: ['hours'],
      },
    ),
);

export const reasonActionSchema = z.object({
  reason: z
    .string({ required_error: 'Reason is required' })
    .trim()
    .min(5, 'Reason must be at least 5 characters'),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type OperatingHourItemInput = z.infer<typeof operatingHourItemSchema>;
export type BatchOperatingHoursInput = z.infer<typeof batchOperatingHoursSchema>;
export type ReasonActionInput = z.infer<typeof reasonActionSchema>;
