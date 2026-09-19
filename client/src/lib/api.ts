import type {
  AuthUser,
  CustomerAddressDto,
  CreateAddressDto,
  UpdateAddressDto,
  GeocodingResultDto,
  ReverseGeocodeDto,
  ForwardGeocodeDto,
  StoreDto,
  CreateStoreDto,
  UpdateStoreDto,
  StoreCategoryDto,
  CreateStoreCategoryDto,
  UpdateStoreCategoryDto,
  ProductCategoryDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  OperatingHourItemDto,
  StoreOperatingHoursDto,
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
  DiscoveredStoreDto,
  DiscoveredStoresResponseDto,
  CustomerProductDto,
} from '@geomarket/shared';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // Always send HttpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(res.status, body.error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterCustomerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface RegisterVendorInput extends RegisterCustomerInput {
  businessLegalName: string;
}

export const authApi = {
  me: () => apiFetch<{ user: AuthUser }>('/auth/me'),

  login: (data: LoginInput) =>
    apiFetch<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerCustomer: (data: RegisterCustomerInput) =>
    apiFetch<{ user: AuthUser }>('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerVendor: (data: RegisterVendorInput) =>
    apiFetch<{ user: AuthUser }>('/auth/register/vendor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// ─── Customer Addresses ───────────────────────────────────────────────────────

export const addressApi = {
  list: () => apiFetch<{ addresses: CustomerAddressDto[] }>('/addresses'),

  get: (id: string) => apiFetch<{ address: CustomerAddressDto }>(`/addresses/${id}`),

  create: (data: CreateAddressDto) =>
    apiFetch<{ address: CustomerAddressDto }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateAddressDto) =>
    apiFetch<{ address: CustomerAddressDto }>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setDefault: (id: string) =>
    apiFetch<{ address: CustomerAddressDto }>(`/addresses/${id}/default`, {
      method: 'PATCH',
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/addresses/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Location / Geocoding ─────────────────────────────────────────────────────

export const locationApi = {
  reverse: (data: ReverseGeocodeDto) =>
    apiFetch<{ location: GeocodingResultDto }>('/location/reverse', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forward: (data: ForwardGeocodeDto) =>
    apiFetch<{ locations: GeocodingResultDto[] }>('/location/forward', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoryApi = {
  getStoreCategories: () =>
    apiFetch<{ categories: StoreCategoryDto[] }>('/categories/stores'),

  getProductCategories: () =>
    apiFetch<{ categories: ProductCategoryDto[] }>('/categories/products'),

  adminCreateStoreCategory: (data: CreateStoreCategoryDto) =>
    apiFetch<{ category: StoreCategoryDto }>('/admin/categories/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateStoreCategory: (id: string, data: UpdateStoreCategoryDto) =>
    apiFetch<{ category: StoreCategoryDto }>(`/admin/categories/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteStoreCategory: (id: string) =>
    apiFetch<{ message: string }>(`/admin/categories/stores/${id}`, {
      method: 'DELETE',
    }),

  adminCreateProductCategory: (data: CreateProductCategoryDto) =>
    apiFetch<{ category: ProductCategoryDto }>('/admin/categories/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateProductCategory: (id: string, data: UpdateProductCategoryDto) =>
    apiFetch<{ category: ProductCategoryDto }>(`/admin/categories/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteProductCategory: (id: string) =>
    apiFetch<{ message: string }>(`/admin/categories/products/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Vendor Stores ────────────────────────────────────────────────────────────

export const vendorStoreApi = {
  list: () =>
    apiFetch<{ stores: StoreDto[] }>('/vendor/stores'),

  get: (id: string) =>
    apiFetch<{ store: StoreDto }>(`/vendor/stores/${id}`),

  create: (data: CreateStoreDto) =>
    apiFetch<{ store: StoreDto }>('/vendor/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateStoreDto) =>
    apiFetch<{ store: StoreDto }>(`/vendor/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleOrders: (id: string) =>
    apiFetch<{ store: StoreDto }>(`/vendor/stores/${id}/toggle-orders`, {
      method: 'PATCH',
    }),

  updateOperatingHours: (id: string, hours: OperatingHourItemDto[]) =>
    apiFetch<{ operatingHours: StoreOperatingHoursDto[] }>(`/vendor/stores/${id}/operating-hours`, {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    }),

  resubmit: (id: string) =>
    apiFetch<{ store: StoreDto }>(`/vendor/stores/${id}/resubmit`, {
      method: 'POST',
    }),
};

// ─── Admin Stores ─────────────────────────────────────────────────────────────

export interface AdminStoreFilters {
  status?: string;
  categoryId?: string;
  city?: string;
}

export const adminStoreApi = {
  list: (filters?: AdminStoreFilters) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.city) params.append('city', filters.city);
    const queryString = params.toString();
    return apiFetch<{ stores: StoreDto[] }>(`/admin/stores${queryString ? `?${queryString}` : ''}`);
  },

  get: (id: string) =>
    apiFetch<{ store: StoreDto }>(`/admin/stores/${id}`),

  approve: (id: string) =>
    apiFetch<{ store: StoreDto }>(`/admin/stores/${id}/approve`, {
      method: 'PATCH',
    }),

  reject: (id: string, reason: string) =>
    apiFetch<{ store: StoreDto }>(`/admin/stores/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  suspend: (id: string, reason: string) =>
    apiFetch<{ store: StoreDto }>(`/admin/stores/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  restore: (id: string) =>
    apiFetch<{ store: StoreDto }>(`/admin/stores/${id}/approve`, {
      method: 'PATCH',
    }),
};

// ─── Vendor Products & Inventory ──────────────────────────────────────────────

export interface VendorProductFilters {
  storeId?: string;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
}

export const vendorProductApi = {
  list: (filters?: VendorProductFilters) => {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    const qs = params.toString();
    return apiFetch<{ products: ProductDto[] }>(`/vendor/products${qs ? `?${qs}` : ''}`);
  },

  listByStore: (storeId: string) =>
    apiFetch<{ products: ProductDto[] }>(`/vendor/stores/${storeId}/products`),

  get: (productId: string) =>
    apiFetch<{ product: ProductDto }>(`/vendor/products/${productId}`),

  create: (storeId: string, data: CreateProductDto) =>
    apiFetch<{ product: ProductDto }>(`/vendor/stores/${storeId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (productId: string, data: UpdateProductDto) =>
    apiFetch<{ product: ProductDto }>(`/vendor/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (productId: string) =>
    apiFetch<{ message: string }>(`/vendor/products/${productId}`, {
      method: 'DELETE',
    }),

  toggleActive: (productId: string, isActive?: boolean) =>
    apiFetch<{ product: ProductDto }>(`/vendor/products/${productId}/active`, {
      method: 'PATCH',
      body: JSON.stringify(isActive !== undefined ? { isActive } : {}),
    }),

  updateStock: (productId: string, data: UpdateStockDto) =>
    apiFetch<{ product: ProductDto }>(`/vendor/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── Customer Store Discovery & Browsing ──────────────────────────────────────

export interface DiscoveryStoresParams {
  latitude: number;
  longitude: number;
  storeCategoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StoreProductsParams {
  productCategoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const discoveryApi = {
  getStores: (params: DiscoveryStoresParams) => {
    const sp = new URLSearchParams();
    sp.append('latitude', String(params.latitude));
    sp.append('longitude', String(params.longitude));
    if (params.storeCategoryId) sp.append('storeCategoryId', params.storeCategoryId);
    if (params.search && params.search.trim()) sp.append('search', params.search.trim());
    if (params.page) sp.append('page', String(params.page));
    if (params.pageSize) sp.append('pageSize', String(params.pageSize));
    return apiFetch<DiscoveredStoresResponseDto>(`/discovery/stores?${sp.toString()}`);
  },

  getStore: (idOrSlug: string, coords?: { latitude: number; longitude: number }) => {
    const sp = new URLSearchParams();
    if (coords) {
      sp.append('latitude', String(coords.latitude));
      sp.append('longitude', String(coords.longitude));
    }
    const qs = sp.toString();
    return apiFetch<{ store: DiscoveredStoreDto }>(`/discovery/stores/${idOrSlug}${qs ? `?${qs}` : ''}`);
  },

  getStoreProducts: (idOrSlug: string, params?: StoreProductsParams) => {
    const sp = new URLSearchParams();
    if (params?.productCategoryId) sp.append('productCategoryId', params.productCategoryId);
    if (params?.search && params.search.trim()) sp.append('search', params.search.trim());
    if (params?.page) sp.append('page', String(params.page));
    if (params?.pageSize) sp.append('pageSize', String(params.pageSize));
    const qs = sp.toString();
    return apiFetch<{
      products: CustomerProductDto[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>(`/discovery/stores/${idOrSlug}/products${qs ? `?${qs}` : ''}`);
  },
};


