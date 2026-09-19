import * as productRepo from './product.repository';
import { ProductWithRelations } from './product.repository';
import * as storeRepo from '../store/store.repository';
import {
  CreateProductInput,
  UpdateProductInput,
  InventoryOperationInput,
} from './product.schemas';
import { ProductDto } from '@geomarket/shared';
import { prisma } from '../../lib/prisma';
import { generateUniqueProductSlug } from './product.slug';

export function formatProduct(product: ProductWithRelations): ProductDto {
  return {
    id: product.id,
    storeId: product.storeId,
    productCategoryId: product.productCategoryId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    stockQuantity: product.stockQuantity,
    sku: product.sku,
    imageUrl: product.imageUrl,
    unit: product.unit,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          description: product.category.description,
        }
      : undefined,
    store: product.store
      ? {
          id: product.store.id,
          name: product.store.name,
          slug: product.store.slug,
        }
      : undefined,
  };
}

// ==========================================
// Vendor Product Service
// ==========================================

export async function createProduct(
  vendorProfileId: string,
  storeId: string,
  input: CreateProductInput,
): Promise<ProductDto> {
  // Tenant isolation: verify store belongs to vendor
  const store = await storeRepo.findStoreByIdAndVendorProfileId(storeId, vendorProfileId);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  // Validate product category exists
  const category = await prisma.productCategory.findUnique({
    where: { id: input.productCategoryId },
  });
  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND');
  }

  // Generate unique product slug scoped to this store
  const slug = await generateUniqueProductSlug(prisma, storeId, input.name);

  const product = await productRepo.createProduct(storeId, {
    productCategoryId: input.productCategoryId,
    name: input.name,
    slug,
    description: input.description,
    price: input.price,
    stockQuantity: input.stockQuantity,
    sku: input.sku,
    imageUrl: input.imageUrl,
    unit: input.unit,
    isActive: input.isActive,
  });

  return formatProduct(product);
}

export async function getStoreProducts(
  vendorProfileId: string,
  storeId: string,
): Promise<ProductDto[]> {
  // Tenant isolation: verify store belongs to vendor
  const store = await storeRepo.findStoreByIdAndVendorProfileId(storeId, vendorProfileId);
  if (!store) {
    throw new Error('STORE_NOT_FOUND');
  }

  const products = await productRepo.findProductsByStoreId(storeId, vendorProfileId);
  return products.map(formatProduct);
}

export async function getVendorProducts(
  vendorProfileId: string,
  filters?: {
    storeId?: string;
    productCategoryId?: string;
    search?: string;
    isActive?: boolean;
  },
): Promise<ProductDto[]> {
  if (filters?.storeId) {
    const store = await storeRepo.findStoreByIdAndVendorProfileId(filters.storeId, vendorProfileId);
    if (!store) {
      throw new Error('STORE_NOT_FOUND');
    }
  }

  const products = await productRepo.findProductsByVendorProfileId(vendorProfileId, filters);
  return products.map(formatProduct);
}

export async function getProductById(
  vendorProfileId: string,
  productId: string,
): Promise<ProductDto> {
  const product = await productRepo.findProductByIdAndVendorProfileId(productId, vendorProfileId);
  if (!product) {
    throw new Error('PRODUCT_NOT_FOUND');
  }
  return formatProduct(product);
}

export async function updateProduct(
  vendorProfileId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<ProductDto> {
  const existing = await productRepo.findProductByIdAndVendorProfileId(productId, vendorProfileId);
  if (!existing) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  if (input.productCategoryId) {
    const category = await prisma.productCategory.findUnique({
      where: { id: input.productCategoryId },
    });
    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }
  }

  let slug: string | undefined;
  if (input.name && input.name !== existing.name) {
    slug = await generateUniqueProductSlug(prisma, existing.storeId, input.name, productId);
  }

  const updated = await productRepo.updateProduct(productId, {
    ...(input.name ? { name: input.name } : {}),
    ...(slug ? { slug } : {}),
    ...(input.productCategoryId ? { productCategoryId: input.productCategoryId } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.price !== undefined ? { price: input.price } : {}),
    ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}),
    ...(input.sku !== undefined ? { sku: input.sku } : {}),
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });

  return formatProduct(updated);
}

export async function deleteProduct(
  vendorProfileId: string,
  productId: string,
): Promise<void> {
  const existing = await productRepo.findProductByIdAndVendorProfileId(productId, vendorProfileId);
  if (!existing) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  await productRepo.deleteProduct(productId);
}

export async function toggleProductActive(
  vendorProfileId: string,
  productId: string,
  isActive?: boolean,
): Promise<ProductDto> {
  const existing = await productRepo.findProductByIdAndVendorProfileId(productId, vendorProfileId);
  if (!existing) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  const nextActive = isActive !== undefined ? isActive : !existing.isActive;

  const updated = await productRepo.updateProduct(productId, {
    isActive: nextActive,
  });

  return formatProduct(updated);
}

export async function updateStock(
  vendorProfileId: string,
  productId: string,
  input: InventoryOperationInput,
): Promise<ProductDto> {
  const updated = await productRepo.updateProductStockTransaction(
    productId,
    vendorProfileId,
    input.operation,
    input.quantity,
  );

  return formatProduct(updated);
}
