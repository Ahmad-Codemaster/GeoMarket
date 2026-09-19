import * as categoryRepo from './category.repository';
import {
  CreateStoreCategoryInput,
  UpdateStoreCategoryInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from './category.schemas';
import { StoreCategoryDto, ProductCategoryDto } from '@geomarket/shared';
import { StoreCategory, ProductCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateUniqueStoreCategorySlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name) || 'category';
  let candidateSlug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.storeCategory.findFirst({
      where: {
        slug: candidateSlug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function generateUniqueProductCategorySlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name) || 'category';
  let candidateSlug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.productCategory.findFirst({
      where: {
        slug: candidateSlug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export function formatStoreCategory(cat: StoreCategory): StoreCategoryDto {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    iconUrl: cat.iconUrl,
    isActive: cat.isActive,
    createdAt: cat.createdAt.toISOString(),
  };
}

export function formatProductCategory(cat: ProductCategory): ProductCategoryDto {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    createdAt: cat.createdAt.toISOString(),
  };
}

// ==========================================
// Store Categories
// ==========================================

export async function getActiveStoreCategories(): Promise<StoreCategoryDto[]> {
  const categories = await categoryRepo.findActiveStoreCategories();
  return categories.map(formatStoreCategory);
}

export async function getAllStoreCategories(): Promise<StoreCategoryDto[]> {
  const categories = await categoryRepo.findAllStoreCategories();
  return categories.map(formatStoreCategory);
}

export async function getStoreCategoryById(id: string): Promise<StoreCategoryDto> {
  const category = await categoryRepo.findStoreCategoryById(id);
  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND');
  }
  return formatStoreCategory(category);
}

export async function createStoreCategory(input: CreateStoreCategoryInput): Promise<StoreCategoryDto> {
  const existingName = await categoryRepo.findStoreCategoryByName(input.name);
  if (existingName) {
    throw new Error('CATEGORY_NAME_EXISTS');
  }

  const slug = await generateUniqueStoreCategorySlug(input.name);
  const created = await categoryRepo.createStoreCategory({
    name: input.name,
    slug,
    description: input.description,
    iconUrl: input.iconUrl,
    isActive: input.isActive ?? true,
  });

  return formatStoreCategory(created);
}

export async function updateStoreCategory(
  id: string,
  input: UpdateStoreCategoryInput,
): Promise<StoreCategoryDto> {
  const existing = await categoryRepo.findStoreCategoryById(id);
  if (!existing) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  let slug: string | undefined;
  if (input.name && input.name !== existing.name) {
    const nameTaken = await prisma.storeCategory.findFirst({
      where: {
        name: input.name,
        NOT: { id },
      },
    });
    if (nameTaken) {
      throw new Error('CATEGORY_NAME_EXISTS');
    }
    slug = await generateUniqueStoreCategorySlug(input.name, id);
  }

  const updated = await categoryRepo.updateStoreCategory(id, {
    ...(input.name ? { name: input.name } : {}),
    ...(slug ? { slug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.iconUrl !== undefined ? { iconUrl: input.iconUrl } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });

  return formatStoreCategory(updated!);
}

export async function deleteStoreCategory(id: string): Promise<void> {
  const existing = await categoryRepo.findStoreCategoryById(id);
  if (!existing) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  const storeCount = await categoryRepo.countStoresByCategoryId(id);
  if (storeCount > 0) {
    throw new Error('CATEGORY_IN_USE');
  }

  await categoryRepo.deleteStoreCategory(id);
}

// ==========================================
// Product Categories
// ==========================================

export async function getProductCategories(): Promise<ProductCategoryDto[]> {
  const categories = await categoryRepo.findAllProductCategories();
  return categories.map(formatProductCategory);
}

export async function getProductCategoryById(id: string): Promise<ProductCategoryDto> {
  const category = await categoryRepo.findProductCategoryById(id);
  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND');
  }
  return formatProductCategory(category);
}

export async function createProductCategory(input: CreateProductCategoryInput): Promise<ProductCategoryDto> {
  const existingName = await categoryRepo.findProductCategoryByName(input.name);
  if (existingName) {
    throw new Error('CATEGORY_NAME_EXISTS');
  }

  const slug = await generateUniqueProductCategorySlug(input.name);
  const created = await categoryRepo.createProductCategory({
    name: input.name,
    slug,
    description: input.description,
  });

  return formatProductCategory(created);
}

export async function updateProductCategory(
  id: string,
  input: UpdateProductCategoryInput,
): Promise<ProductCategoryDto> {
  const existing = await categoryRepo.findProductCategoryById(id);
  if (!existing) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  let slug: string | undefined;
  if (input.name && input.name !== existing.name) {
    const nameTaken = await prisma.productCategory.findFirst({
      where: {
        name: input.name,
        NOT: { id },
      },
    });
    if (nameTaken) {
      throw new Error('CATEGORY_NAME_EXISTS');
    }
    slug = await generateUniqueProductCategorySlug(input.name, id);
  }

  const updated = await categoryRepo.updateProductCategory(id, {
    ...(input.name ? { name: input.name } : {}),
    ...(slug ? { slug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  });

  return formatProductCategory(updated!);
}

export async function deleteProductCategory(id: string): Promise<void> {
  const existing = await categoryRepo.findProductCategoryById(id);
  if (!existing) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  const productCount = await prisma.product.count({
    where: { productCategoryId: id },
  });
  if (productCount > 0) {
    throw new Error('CATEGORY_IN_USE');
  }

  await categoryRepo.deleteProductCategory(id);
}

