import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    store: {
      select: {
        id: true;
        name: true;
        slug: true;
        vendorProfileId: true;
      };
    };
  };
}>;

export async function findProductById(id: string): Promise<ProductWithRelations | null> {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          vendorProfileId: true,
        },
      },
    },
  });
}

export async function findProductByIdAndVendorProfileId(
  id: string,
  vendorProfileId: string,
): Promise<ProductWithRelations | null> {
  return prisma.product.findFirst({
    where: {
      id,
      store: {
        vendorProfileId,
      },
    },
    include: {
      category: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          vendorProfileId: true,
        },
      },
    },
  });
}

export async function findProductsByStoreId(
  storeId: string,
  vendorProfileId?: string,
): Promise<ProductWithRelations[]> {
  return prisma.product.findMany({
    where: {
      storeId,
      ...(vendorProfileId
        ? {
            store: {
              vendorProfileId,
            },
          }
        : {}),
    },
    include: {
      category: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          vendorProfileId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findProductsByVendorProfileId(
  vendorProfileId: string,
  filters?: {
    storeId?: string;
    productCategoryId?: string;
    search?: string;
    isActive?: boolean;
  },
): Promise<ProductWithRelations[]> {
  const where: Prisma.ProductWhereInput = {
    store: {
      vendorProfileId,
    },
    ...(filters?.storeId ? { storeId: filters.storeId } : {}),
    ...(filters?.productCategoryId ? { productCategoryId: filters.productCategoryId } : {}),
    ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
    ...(filters?.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return prisma.product.findMany({
    where,
    include: {
      category: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          vendorProfileId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProduct(
  storeId: string,
  data: {
    productCategoryId: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number | Prisma.Decimal;
    stockQuantity?: number;
    sku?: string | null;
    imageUrl?: string | null;
    unit?: string | null;
    isActive?: boolean;
  },
): Promise<ProductWithRelations> {
  return prisma.product.create({
    data: {
      storeId,
      productCategoryId: data.productCategoryId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      price: data.price,
      stockQuantity: data.stockQuantity ?? 0,
      sku: data.sku ?? null,
      imageUrl: data.imageUrl ?? null,
      unit: data.unit ?? null,
      isActive: data.isActive ?? true,
    },
    include: {
      category: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          vendorProfileId: true,
        },
      },
    },
  });
}

export async function updateProduct(
  id: string,
  data: {
    productCategoryId?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    price?: number | Prisma.Decimal;
    stockQuantity?: number;
    sku?: string | null;
    imageUrl?: string | null;
    unit?: string | null;
    isActive?: boolean;
  },
): Promise<ProductWithRelations> {
  return prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          vendorProfileId: true,
        },
      },
    },
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({
    where: { id },
  });
}

/**
 * Concurrency-safe atomic inventory modification with row-level locking (SELECT ... FOR UPDATE).
 * Enforces non-negative stock invariants within a PostgreSQL transaction.
 */
export async function updateProductStockTransaction(
  productId: string,
  vendorProfileId: string | null,
  operation: 'SET' | 'INCREMENT' | 'DECREMENT',
  quantity: number,
): Promise<ProductWithRelations> {
  return prisma.$transaction(async (tx) => {
    // 1. Lock the product row exclusively with SELECT ... FOR UPDATE
    const rows = await tx.$queryRaw<Array<{
      id: string;
      store_id: string;
      stock_quantity: number;
    }>>`
      SELECT id, store_id, stock_quantity
      FROM products
      WHERE id = ${productId}
      FOR UPDATE
    `;

    if (!rows || rows.length === 0) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    const row = rows[0];

    // 2. If vendorProfileId is provided, verify store ownership
    if (vendorProfileId) {
      const store = await tx.store.findUnique({
        where: { id: row.store_id },
        select: { vendorProfileId: true },
      });

      if (!store || store.vendorProfileId !== vendorProfileId) {
        throw new Error('PRODUCT_NOT_FOUND');
      }
    }

    const currentStock = row.stock_quantity;
    let newStock: number;

    if (operation === 'SET') {
      newStock = quantity;
    } else if (operation === 'INCREMENT') {
      newStock = currentStock + quantity;
    } else if (operation === 'DECREMENT') {
      newStock = currentStock - quantity;
    } else {
      throw new Error('INVALID_OPERATION');
    }

    if (newStock < 0) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newStock },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            vendorProfileId: true,
          },
        },
      },
    });

    return updated;
  });
}
