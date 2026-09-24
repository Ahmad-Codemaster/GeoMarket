import { prisma } from '../../lib/prisma';
import { Store, StoreOperatingHours, StoreStatus, Prisma } from '@prisma/client';

export type StoreWithRelations = Prisma.StoreGetPayload<{
  include: {
    storeCategory: true;
    operatingHours: true;
    vendorProfile: {
      include: {
        user: true;
      };
    };
  };
}>;

export async function createStore(
  vendorProfileId: string,
  data: {
    name: string;
    slug: string;
    storeCategoryId: string;
    description?: string | null;
    imageUrl?: string | null;
    logoUrl?: string | null;
    addressLine: string;
    city: string;
    latitude: number;
    longitude: number;
    deliveryRadiusKm: number;
    baseDeliveryFee?: number;
    minOrderAmount?: number;
    timezone?: string;
    isAcceptingOrders?: boolean;
  },
): Promise<StoreWithRelations> {
  // STRICT INVARIANT 1: PENDING_APPROVAL -> is_active = false
  return prisma.store.create({
    data: {
      vendorProfileId,
      storeCategoryId: data.storeCategoryId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      logoUrl: data.logoUrl ?? null,
      addressLine: data.addressLine,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      deliveryRadiusKm: data.deliveryRadiusKm,
      baseDeliveryFee: data.baseDeliveryFee ?? 0,
      minOrderAmount: data.minOrderAmount ?? 0,
      timezone: data.timezone ?? 'Asia/Karachi',
      status: StoreStatus.PENDING_APPROVAL,
      isActive: false,
      isAcceptingOrders: data.isAcceptingOrders ?? true,
    },
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function findStoresByVendorProfileId(vendorProfileId: string): Promise<StoreWithRelations[]> {
  return prisma.store.findMany({
    where: { vendorProfileId },
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findStoreByIdAndVendorProfileId(
  id: string,
  vendorProfileId: string,
): Promise<StoreWithRelations | null> {
  return prisma.store.findFirst({
    where: { id, vendorProfileId },
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function updateStore(
  id: string,
  vendorProfileId: string,
  data: Partial<{
    name: string;
    slug: string;
    storeCategoryId: string;
    description: string | null;
    imageUrl: string | null;
    logoUrl: string | null;
    addressLine: string;
    city: string;
    latitude: number;
    longitude: number;
    deliveryRadiusKm: number;
    baseDeliveryFee: number;
    minOrderAmount: number;
    timezone: string;
    isAcceptingOrders: boolean;
    status: StoreStatus;
    isActive: boolean;
    rejectionReason: string | null;
  }>,
): Promise<StoreWithRelations | null> {
  const existing = await findStoreByIdAndVendorProfileId(id, vendorProfileId);
  if (!existing) return null;

  // STRICT INVARIANT 2: If a store was REJECTED, vendor updating the store transitions it back to PENDING_APPROVAL
  const updateData: Prisma.StoreUpdateInput = { ...data };
  if (existing.status === StoreStatus.REJECTED) {
    updateData.status = StoreStatus.PENDING_APPROVAL;
    updateData.isActive = false;
    updateData.rejectionReason = null;
  }

  return prisma.store.update({
    where: { id },
    data: updateData,
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function toggleOrders(
  id: string,
  vendorProfileId: string,
): Promise<StoreWithRelations | null> {
  const existing = await findStoreByIdAndVendorProfileId(id, vendorProfileId);
  if (!existing) return null;

  return prisma.store.update({
    where: { id },
    data: {
      isAcceptingOrders: !existing.isAcceptingOrders,
    },
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function upsertOperatingHours(
  storeId: string,
  hours: Array<{
    dayOfWeek: number;
    openingTime: string;
    closingTime: string;
    isClosed?: boolean;
  }>,
): Promise<StoreOperatingHours[]> {
  await prisma.$transaction(
    hours.map((h) =>
      prisma.storeOperatingHours.upsert({
        where: {
          storeId_dayOfWeek: {
            storeId,
            dayOfWeek: h.dayOfWeek,
          },
        },
        update: {
          openingTime: h.openingTime,
          closingTime: h.closingTime,
          isClosed: h.isClosed ?? false,
        },
        create: {
          storeId,
          dayOfWeek: h.dayOfWeek,
          openingTime: h.openingTime,
          closingTime: h.closingTime,
          isClosed: h.isClosed ?? false,
        },
      }),
    ),
  );

  return prisma.storeOperatingHours.findMany({
    where: { storeId },
    orderBy: { dayOfWeek: 'asc' },
  });
}

export async function findStoresAdmin(filters: {
  status?: StoreStatus;
  categoryId?: string;
  city?: string;
}): Promise<StoreWithRelations[]> {
  const where: Prisma.StoreWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.categoryId) {
    where.storeCategoryId = filters.categoryId;
  }
  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' };
  }

  return prisma.store.findMany({
    where,
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findStoreByIdAdmin(id: string): Promise<StoreWithRelations | null> {
  return prisma.store.findUnique({
    where: { id },
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function updateStoreStatusAdmin(
  id: string,
  status: StoreStatus,
  isActive: boolean,
  reasonField?: {
    rejectionReason?: string | null;
    suspensionReason?: string | null;
  },
): Promise<StoreWithRelations> {
  return prisma.store.update({
    where: { id },
    data: {
      status,
      isActive,
      ...(reasonField?.rejectionReason !== undefined ? { rejectionReason: reasonField.rejectionReason } : {}),
      ...(reasonField?.suspensionReason !== undefined ? { suspensionReason: reasonField.suspensionReason } : {}),
    },
    include: {
      storeCategory: true,
      operatingHours: true,
      vendorProfile: {
        include: {
          user: true,
        },
      },
    },
  });
}
