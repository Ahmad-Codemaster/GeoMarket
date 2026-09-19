export enum InventoryOperation {
  SET = 'SET',
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
}

export interface ProductCategorySummaryDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface StoreSummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDto {
  id: string;
  storeId: string;
  productCategoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  sku: string | null;
  imageUrl: string | null;
  unit: string | null;
  isActive: boolean;
  category?: ProductCategorySummaryDto;
  store?: StoreSummaryDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  productCategoryId: string;
  name: string;
  description?: string | null;
  price: number;
  stockQuantity?: number;
  sku?: string | null;
  imageUrl?: string | null;
  unit?: string | null;
  isActive?: boolean;
}

export interface UpdateProductDto {
  productCategoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  stockQuantity?: number;
  sku?: string | null;
  imageUrl?: string | null;
  unit?: string | null;
  isActive?: boolean;
}

export interface UpdateStockDto {
  operation?: 'SET' | 'INCREMENT' | 'DECREMENT' | 'INCREASE' | 'DECREASE' | 'set' | 'increment' | 'decrement' | 'increase' | 'decrease';
  quantity: number;
}
