import { prisma } from '../../lib/prisma';
import { StoreCategory, ProductCategory } from '@prisma/client';

// ==========================================
// Store Category Repository
// ==========================================

export async function findActiveStoreCategories(): Promise<StoreCategory[]> {
  return prisma.storeCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function findAllStoreCategories(): Promise<StoreCategory[]> {
  return prisma.storeCategory.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function findStoreCategoryById(id: string): Promise<StoreCategory | null> {
  return prisma.storeCategory.findUnique({
    where: { id },
  });
}

export async function findStoreCategoryBySlug(slug: string): Promise<StoreCategory | null> {
  return prisma.storeCategory.findUnique({
    where: { slug },
  });
}

export async function findStoreCategoryByName(name: string): Promise<StoreCategory | null> {
  return prisma.storeCategory.findUnique({
    where: { name },
  });
}

export async function createStoreCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
}): Promise<StoreCategory> {
  return prisma.storeCategory.create({
    data,
  });
}

export async function updateStoreCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    isActive: boolean;
  }>,
): Promise<StoreCategory | null> {
  return prisma.storeCategory.update({
    where: { id },
    data,
  });
}

export async function countStoresByCategoryId(storeCategoryId: string): Promise<number> {
  return prisma.store.count({
    where: { storeCategoryId },
  });
}

export async function deleteStoreCategory(id: string): Promise<StoreCategory | null> {
  return prisma.storeCategory.delete({
    where: { id },
  });
}

// ==========================================
// Product Category Repository
// ==========================================

export async function findAllProductCategories(): Promise<ProductCategory[]> {
  return prisma.productCategory.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function findProductCategoryById(id: string): Promise<ProductCategory | null> {
  return prisma.productCategory.findUnique({
    where: { id },
  });
}

export async function findProductCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  return prisma.productCategory.findUnique({
    where: { slug },
  });
}

export async function findProductCategoryByName(name: string): Promise<ProductCategory | null> {
  return prisma.productCategory.findUnique({
    where: { name },
  });
}

export async function createProductCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
}): Promise<ProductCategory> {
  return prisma.productCategory.create({
    data,
  });
}

export async function updateProductCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string | null;
  }>,
): Promise<ProductCategory | null> {
  return prisma.productCategory.update({
    where: { id },
    data,
  });
}

export async function deleteProductCategory(id: string): Promise<ProductCategory | null> {
  return prisma.productCategory.delete({
    where: { id },
  });
}
