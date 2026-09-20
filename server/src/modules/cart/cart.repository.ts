import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export const cartIncludeDetails = {
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      baseDeliveryFee: true,
      minOrderAmount: true,
      isActive: true,
      status: true,
      isAcceptingOrders: true,
    },
  },
  items: {
    include: {
      product: {
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              status: true,
              isAcceptingOrders: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export type CartWithDetails = Prisma.CartGetPayload<{
  include: typeof cartIncludeDetails;
}>;

export async function findCartByUserId(userId: string): Promise<CartWithDetails | null> {
  return prisma.cart.findUnique({
    where: { userId },
    include: cartIncludeDetails,
  });
}

export async function findCartById(id: string): Promise<CartWithDetails | null> {
  return prisma.cart.findUnique({
    where: { id },
    include: cartIncludeDetails,
  });
}
