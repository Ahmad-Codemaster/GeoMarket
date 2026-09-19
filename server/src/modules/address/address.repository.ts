import { prisma } from '../../lib/prisma';
import { CustomerAddress } from '@prisma/client';

export async function countUserAddresses(userId: string): Promise<number> {
  return prisma.customerAddress.count({
    where: { userId },
  });
}

export async function findAddressesByUserId(userId: string): Promise<CustomerAddress[]> {
  return prisma.customerAddress.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function findAddressByIdAndUserId(
  id: string,
  userId: string,
): Promise<CustomerAddress | null> {
  return prisma.customerAddress.findFirst({
    where: { id, userId },
  });
}

export async function createAddress(
  userId: string,
  data: {
    addressLabel: string;
    recipientName?: string | null;
    recipientPhone?: string | null;
    addressLine: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  },
): Promise<CustomerAddress> {
  if (data.isDefault) {
    // Transactionally demote existing defaults and create new default
    return prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.customerAddress.create({
        data: {
          userId,
          addressLabel: data.addressLabel,
          recipientName: data.recipientName || null,
          recipientPhone: data.recipientPhone || null,
          addressLine: data.addressLine,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: true,
        },
      });
    });
  }

  return prisma.customerAddress.create({
    data: {
      userId,
      addressLabel: data.addressLabel,
      recipientName: data.recipientName || null,
      recipientPhone: data.recipientPhone || null,
      addressLine: data.addressLine,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: false,
    },
  });
}

export async function updateAddress(
  id: string,
  userId: string,
  data: Partial<{
    addressLabel: string;
    recipientName: string | null;
    recipientPhone: string | null;
    addressLine: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  }>,
): Promise<CustomerAddress | null> {
  // First verify existence and ownership
  const existing = await findAddressByIdAndUserId(id, userId);
  if (!existing) return null;

  if (data.isDefault) {
    return prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.customerAddress.update({
        where: { id },
        data,
      });
    });
  }

  return prisma.customerAddress.update({
    where: { id },
    data,
  });
}

export async function setDefaultAddress(
  id: string,
  userId: string,
): Promise<CustomerAddress | null> {
  const existing = await findAddressByIdAndUserId(id, userId);
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    await tx.customerAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return tx.customerAddress.update({
      where: { id },
      data: { isDefault: true },
    });
  });
}

export async function deleteAddress(
  id: string,
  userId: string,
): Promise<CustomerAddress | null> {
  const existing = await findAddressByIdAndUserId(id, userId);
  if (!existing) return null;

  return prisma.customerAddress.delete({
    where: { id },
  });
}
