import { StoreOperatingHoursDto } from './store';
import { ProductCategorySummaryDto } from './product';

export interface DiscoveredStoreCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface DiscoveredStoreDto {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeCategory: DiscoveredStoreCategoryDto;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  distanceKm: number;
  baseDeliveryFee: number;
  minimumOrderAmount: number;
  isAcceptingOrders: boolean;
  isOpen: boolean;
  description?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  averageRating: number;
  totalReviews: number;
  timezone?: string;
  operatingHours?: StoreOperatingHoursDto[];
}

export interface StoreDiscoveryQueryDto {
  latitude: number;
  longitude: number;
  storeCategoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DiscoveryPaginationDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DiscoveredStoresResponseDto {
  stores: DiscoveredStoreDto[];
  pagination: DiscoveryPaginationDto;
}

export interface CustomerProductDto {
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
  category?: ProductCategorySummaryDto;
}

export interface DiscoveredProductStoreSummaryDto {
  id: string;
  name: string;
  slug: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  baseDeliveryFee: number;
  minOrderAmount: number;
  averageRating: number;
  totalReviews: number;
  isOpen: boolean;
  isAcceptingOrders: boolean;
}

export interface DiscoveredProductDetailDto extends CustomerProductDto {
  store: DiscoveredProductStoreSummaryDto;
  relatedProducts: CustomerProductDto[];
}

export interface DiscoveredProductsListResponseDto {
  products: (CustomerProductDto & { store: DiscoveredProductStoreSummaryDto })[];
  pagination: DiscoveryPaginationDto;
}
