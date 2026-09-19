import * as storeRepo from './store.repository';
import { StoreWithRelations } from './store.repository';
import {
  CreateStoreInput,
  UpdateStoreInput,
  BatchOperatingHoursInput,
} from './store.schemas';
import { StoreDto, StoreStatus, StoreOperatingHoursDto } from '@geomarket/shared';
import { prisma } from '../../lib/prisma';
import { generateUniqueStoreSlug } from './store.slug';

export function formatStore(store: StoreWithRelations): StoreDto {
  return {
    id: store.id,
    vendorProfileId: store.vendorProfileId,
    storeCategoryId: store.storeCategoryId,
    storeCategory: store.storeCategory
      ? {
          id: store.storeCategory.id,
          name: store.storeCategory.name,
          slug: store.storeCategory.slug,
        }
      : undefined,
    name: store.name,
    slug: store.slug,
    description: store.description,
    addressLine: store.addressLine,
    city: store.city,
    latitude: Number(store.latitude),
    longitude: Number(store.longitude),
    deliveryRadiusKm: Number(store.deliveryRadiusKm),
    baseDeliveryFee: Number(store.baseDeliveryFee),
    minOrderAmount: Number(store.minOrderAmount),
    status: store.status as StoreStatus,
    isActive: store.isActive,
    isAcceptingOrders: store.isAcceptingOrders,
    rejectionReason: store.rejectionReason,
    suspensionReason: store.suspensionReason,
    averageRating: Number(store.averageRating),
    totalReviews: store.totalReviews,
    operatingHours: store.operatingHours
      ? store.operatingHours.map((h) => ({
          id: h.id,
          storeId: h.storeId,
          dayOfWeek: h.dayOfWeek,
          openingTime: h.openingTime,
          closingTime: h.closingTime,
          isClosed: h.isClosed,
        }))
      : undefined,
    vendorProfile: store.vendorProfile
      ? {
          id: store.vendorProfile.id,
          businessLegalName: store.vendorProfile.businessLegalName,
          taxIdNumber: store.vendorProfile.taxIdNumber,
          user: store.vendorProfile.user
            ? {
                firstName: store.vendorProfile.user.firstName,
                lastName: store.vendorProfile.user.lastName,
                email: store.vendorProfile.user.email,
                phone: store.vendorProfile.user.phone,
              }
            : undefined,
        }
      : undefined,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}

// ==========================================
// Vendor Store Service
// ==========================================

export async function createStore(
  vendorProfileId: string,
  input: CreateStoreInput,
): Promise<StoreDto> {
  const category = await prisma.storeCategory.findUnique({
    where: { id: input.storeCategoryId },
  });

  if (!category) {
    throw new Error('STORE_CATEGORY_NOT_FOUND');
  }

  const slug = await generateUniqueStoreSlug(prisma, input.name);

  const store = await storeRepo.createStore(vendorProfileId, {
    name: input.name,
    slug,
    storeCategoryId: input.storeCategoryId,
    description: input.description,
    addressLine: input.addressLine,
    city: input.city,
    latitude: input.latitude,
    longitude: input.longitude,
    deliveryRadiusKm: input.deliveryRadiusKm,
    baseDeliveryFee: input.baseDeliveryFee,
    minOrderAmount: input.minOrderAmount,
    timezone: input.timezone,
    isAcceptingOrders: input.isAcceptingOrders,
  });

  return formatStore(store);
}

export async function getVendorStores(vendorProfileId: string): Promise<StoreDto[]> {
  const stores = await storeRepo.findStoresByVendorProfileId(vendorProfileId);
  return stores.map(formatStore);
}

export async function getVendorStoreById(
  id: string,
  vendorProfileId: string,
): Promise<StoreDto> {
  const store = await storeRepo.findStoreByIdAndVendorProfileId(id, vendorProfileId);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }
  return formatStore(store);
}

export async function updateVendorStore(
  id: string,
  vendorProfileId: string,
  input: UpdateStoreInput,
): Promise<StoreDto> {
  const existing = await storeRepo.findStoreByIdAndVendorProfileId(id, vendorProfileId);
  if (!existing) {
    throw new Error('STORE_NOT_FOUND');
  }

  if (input.storeCategoryId) {
    const category = await prisma.storeCategory.findUnique({
      where: { id: input.storeCategoryId },
    });
    if (!category) {
      throw new Error('STORE_CATEGORY_NOT_FOUND');
    }
  }

  let slug: string | undefined;
  if (input.name && input.name !== existing.name) {
    slug = await generateUniqueStoreSlug(prisma, input.name, id);
  }

  const updated = await storeRepo.updateStore(id, vendorProfileId, {
    ...(input.name ? { name: input.name } : {}),
    ...(slug ? { slug } : {}),
    ...(input.storeCategoryId ? { storeCategoryId: input.storeCategoryId } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.addressLine ? { addressLine: input.addressLine } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(input.deliveryRadiusKm !== undefined ? { deliveryRadiusKm: input.deliveryRadiusKm } : {}),
    ...(input.baseDeliveryFee !== undefined ? { baseDeliveryFee: input.baseDeliveryFee } : {}),
    ...(input.minOrderAmount !== undefined ? { minOrderAmount: input.minOrderAmount } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.isAcceptingOrders !== undefined ? { isAcceptingOrders: input.isAcceptingOrders } : {}),
  });

  if (!updated) {
    throw new Error('STORE_NOT_FOUND');
  }

  return formatStore(updated);
}

export async function resubmitStore(
  id: string,
  vendorProfileId: string,
): Promise<StoreDto> {
  const existing = await storeRepo.findStoreByIdAndVendorProfileId(id, vendorProfileId);
  if (!existing) {
    throw new Error('STORE_NOT_FOUND');
  }

  // STRICT INVARIANT: FSM only allows REJECTED -> PENDING_APPROVAL
  if (existing.status !== StoreStatus.REJECTED) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }

  const updated = await storeRepo.updateStore(id, vendorProfileId, {
    status: StoreStatus.PENDING_APPROVAL,
    isActive: false,
    rejectionReason: null,
  });

  return formatStore(updated!);
}

export async function toggleVendorStoreOrders(
  id: string,
  vendorProfileId: string,
): Promise<StoreDto> {
  const updated = await storeRepo.toggleOrders(id, vendorProfileId);
  if (!updated) {
    throw new Error('STORE_NOT_FOUND');
  }
  return formatStore(updated);
}

export async function setOperatingHours(
  id: string,
  vendorProfileId: string,
  input: BatchOperatingHoursInput,
): Promise<StoreOperatingHoursDto[]> {
  const existing = await storeRepo.findStoreByIdAndVendorProfileId(id, vendorProfileId);
  if (!existing) {
    throw new Error('STORE_NOT_FOUND');
  }

  const hours = await storeRepo.upsertOperatingHours(id, input.hours);
  return hours.map((h) => ({
    id: h.id,
    storeId: h.storeId,
    dayOfWeek: h.dayOfWeek,
    openingTime: h.openingTime,
    closingTime: h.closingTime,
    isClosed: h.isClosed,
  }));
}

export async function getOperatingHours(
  id: string,
  vendorProfileId: string,
): Promise<StoreOperatingHoursDto[]> {
  const existing = await storeRepo.findStoreByIdAndVendorProfileId(id, vendorProfileId);
  if (!existing) {
    throw new Error('STORE_NOT_FOUND');
  }

  return existing.operatingHours.map((h) => ({
    id: h.id,
    storeId: h.storeId,
    dayOfWeek: h.dayOfWeek,
    openingTime: h.openingTime,
    closingTime: h.closingTime,
    isClosed: h.isClosed,
  }));
}

// ==========================================
// Admin Store Service
// ==========================================

export async function getStoresAdmin(filters: {
  status?: StoreStatus;
  categoryId?: string;
  city?: string;
}): Promise<StoreDto[]> {
  const stores = await storeRepo.findStoresAdmin(filters);
  return stores.map(formatStore);
}

export async function getStoreByIdAdmin(id: string): Promise<StoreDto> {
  const store = await storeRepo.findStoreByIdAdmin(id);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }
  return formatStore(store);
}

export async function approveStoreAdmin(id: string): Promise<StoreDto> {
  const store = await storeRepo.findStoreByIdAdmin(id);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  // FSM: PENDING_APPROVAL -> APPROVED, or SUSPENDED -> APPROVED
  if (
    store.status !== StoreStatus.PENDING_APPROVAL &&
    store.status !== StoreStatus.SUSPENDED
  ) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }

  const updated = await storeRepo.updateStoreStatusAdmin(
    id,
    StoreStatus.APPROVED,
    true,
    {
      rejectionReason: null,
      suspensionReason: null,
    },
  );

  return formatStore(updated);
}

export async function rejectStoreAdmin(id: string, reason: string): Promise<StoreDto> {
  if (!reason || reason.trim().length < 5) {
    throw new Error('REASON_REQUIRED');
  }

  const store = await storeRepo.findStoreByIdAdmin(id);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  // FSM: PENDING_APPROVAL -> REJECTED, or SUSPENDED -> REJECTED
  if (
    store.status !== StoreStatus.PENDING_APPROVAL &&
    store.status !== StoreStatus.SUSPENDED
  ) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }

  const updated = await storeRepo.updateStoreStatusAdmin(
    id,
    StoreStatus.REJECTED,
    false,
    {
      rejectionReason: reason.trim(),
    },
  );

  return formatStore(updated);
}

export async function suspendStoreAdmin(id: string, reason: string): Promise<StoreDto> {
  if (!reason || reason.trim().length < 5) {
    throw new Error('REASON_REQUIRED');
  }

  const store = await storeRepo.findStoreByIdAdmin(id);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  // FSM: APPROVED -> SUSPENDED
  if (store.status !== StoreStatus.APPROVED) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }

  const updated = await storeRepo.updateStoreStatusAdmin(
    id,
    StoreStatus.SUSPENDED,
    false,
    {
      suspensionReason: reason.trim(),
    },
  );

  return formatStore(updated);
}

export async function restoreStoreAdmin(id: string): Promise<StoreDto> {
  const store = await storeRepo.findStoreByIdAdmin(id);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  // FSM: SUSPENDED -> APPROVED
  if (store.status !== StoreStatus.SUSPENDED) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }

  const updated = await storeRepo.updateStoreStatusAdmin(
    id,
    StoreStatus.APPROVED,
    true,
    {
      suspensionReason: null,
    },
  );

  return formatStore(updated);
}
