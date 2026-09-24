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
  DiscoveredProductDetailDto,
  DiscoveredProductsListResponseDto,
  CartDto,
  AddToCartDto,
  UpdateCartItemDto,
  CartConflictErrorDetails,
  OrderDto,
  OrderItemDto,
  OrderStatus,
  CheckoutInputDto,
  UpdateOrderStatusDto,
  ReviewDto,
  CreateReviewDto,
  UpdateReviewDto,
  StoreReviewsResponseDto,
  VendorAnalyticsDto,
  AnalyticsPeriod,
} from '@geomarket/shared';

function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // Automatically connect to the backend service on Render
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://geomarket.onrender.com';
  }
  return '';
}

const BASE = `${getApiBaseUrl()}/api/v1`;

const TOKEN_STORAGE_KEY = 'geomarket_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include', // Always send HttpOnly cookies
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Clear token if unauthorized on a protected call
      if (!path.startsWith('/auth/me') && !path.startsWith('/auth/login')) {
        setStoredToken(null);
      }
    }
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(res.status, body.error ?? 'Request failed', body.code, body);
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

  login: async (data: LoginInput) => {
    const res = await apiFetch<{ user: AuthUser; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  registerCustomer: async (data: RegisterCustomerInput) => {
    const res = await apiFetch<{ user: AuthUser; token?: string }>('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  registerVendor: async (data: RegisterVendorInput) => {
    const res = await apiFetch<{ user: AuthUser; token?: string }>('/auth/register/vendor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  guestSession: async (data?: { firstName?: string; lastName?: string; phone?: string; email?: string }) => {
    const res = await apiFetch<{ user: AuthUser; token?: string }>('/auth/guest-session', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  logout: async () => {
    setStoredToken(null);
    return apiFetch<{ message: string }>('/auth/logout', { method: 'POST' });
  },
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

  getProduct: (idOrSlug: string) =>
    apiFetch<DiscoveredProductDetailDto>(`/discovery/products/${idOrSlug}`),

  getProducts: (params?: {
    search?: string;
    productCategoryId?: string;
    storeId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
    page?: number;
    pageSize?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.search && params.search.trim()) sp.append('search', params.search.trim());
    if (params?.productCategoryId) sp.append('productCategoryId', params.productCategoryId);
    if (params?.storeId) sp.append('storeId', params.storeId);
    if (params?.minPrice !== undefined) sp.append('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) sp.append('maxPrice', String(params.maxPrice));
    if (params?.inStockOnly) sp.append('inStockOnly', 'true');
    if (params?.sortBy) sp.append('sortBy', params.sortBy);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.pageSize) sp.append('pageSize', String(params.pageSize));
    const qs = sp.toString();
    return apiFetch<DiscoveredProductsListResponseDto>(`/discovery/products${qs ? `?${qs}` : ''}`);
  },
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartApi = {
  getCart: () => apiFetch<{ cart: CartDto | null }>('/cart'),

  addToCart: (data: AddToCartDto) =>
    apiFetch<{ cart: CartDto }>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCartItem: (itemId: string, data: UpdateCartItemDto) =>
    apiFetch<{ cart: CartDto }>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  removeCartItem: (itemId: string) =>
    apiFetch<{ cart: CartDto }>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    apiFetch<{ cart: CartDto }>('/cart', {
      method: 'DELETE',
    }),
};

// ─── Checkout & Orders ────────────────────────────────────────────────────────

export const checkoutApi = {
  checkout: (data: CheckoutInputDto) =>
    apiFetch<{ order: OrderDto }>('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const orderApi = {
  getCustomerOrders: (page = 1, pageSize = 20) =>
    apiFetch<{ orders: OrderDto[]; total: number; page: number; pageSize: number }>(
      `/orders?page=${page}&pageSize=${pageSize}`
    ),

  getCustomerOrder: (orderId: string) =>
    apiFetch<{ order: OrderDto }>(`/orders/${orderId}`),

  lookupOrder: (orderId: string, phone: string) =>
    apiFetch<{ order: OrderDto }>('/orders/lookup', {
      method: 'POST',
      body: JSON.stringify({ orderId, phone }),
    }),

  cancelOrder: (orderId: string) =>
    apiFetch<{ order: OrderDto }>(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
    }),

  getVendorOrders: (params?: {
    storeId?: string;
    status?: OrderStatus;
    page?: number;
    pageSize?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.storeId) sp.append('storeId', params.storeId);
    if (params?.status) sp.append('status', params.status);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.pageSize) sp.append('pageSize', String(params.pageSize));
    const qs = sp.toString();
    return apiFetch<{ orders: OrderDto[]; total: number; page: number; pageSize: number }>(
      `/vendor/orders${qs ? `?${qs}` : ''}`
    );
  },

  getVendorOrder: (orderId: string) =>
    apiFetch<{ order: OrderDto }>(`/vendor/orders/${orderId}`),

  updateVendorOrderStatus: (orderId: string, status: OrderStatus) =>
    apiFetch<{ order: OrderDto }>(`/vendor/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ─── Reviews & Ratings ────────────────────────────────────────────────────────

export const reviewApi = {
  createReview: (data: CreateReviewDto) =>
    apiFetch<{ review: ReviewDto }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrderReview: (orderId: string) =>
    apiFetch<{ review: ReviewDto }>(`/reviews/order/${orderId}`),

  getStoreReviews: (storeId: string, page = 1, pageSize = 10) =>
    apiFetch<StoreReviewsResponseDto>(
      `/reviews/store/${storeId}?page=${page}&pageSize=${pageSize}`
    ),

  updateReview: (reviewId: string, data: UpdateReviewDto) =>
    apiFetch<{ review: ReviewDto }>(`/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteReview: (reviewId: string) =>
    apiFetch<{ success: boolean }>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    }),

  getVendorReviews: (params?: { storeId?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.storeId) sp.append('storeId', params.storeId);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.pageSize) sp.append('pageSize', String(params.pageSize));
    const qs = sp.toString();
    return apiFetch<{ reviews: ReviewDto[]; total: number; page: number; pageSize: number }>(
      `/vendor/reviews${qs ? `?${qs}` : ''}`
    );
  },
};

// ─── Vendor Operational Analytics ─────────────────────────────────────────────

export const analyticsApi = {
  getVendorAnalytics: (params?: { storeId?: string; period?: AnalyticsPeriod }) => {
    const sp = new URLSearchParams();
    if (params?.storeId) sp.append('storeId', params.storeId);
    if (params?.period) sp.append('period', params.period);
    const qs = sp.toString();
    return apiFetch<{ analytics: VendorAnalyticsDto }>(
      `/vendor/analytics${qs ? `?${qs}` : ''}`
    );
  },
};

// ─── Media & Image Uploads ───────────────────────────────────────────────────

export const uploadApi = {
  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await apiFetch<{ url: string; filename: string }>('/upload', {
            method: 'POST',
            body: JSON.stringify({
              image: base64,
              filename: file.name,
            }),
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },
};

// ─── Admin Platform ───────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () =>
    apiFetch<{
      stats: {
        orders: { total: number; today: number; week: number; month: number };
        users: { total: number; customers: number; vendors: number };
        stores: { total: number; active: number };
        revenue: { total: number; today: number; week: number; month: number };
      };
      recentOrders: Array<{
        id: string;
        status: string;
        totalAmount: number;
        createdAt: string;
        customerName: string;
        customerEmail: string;
        storeName: string;
      }>;
      topStores: Array<{
        storeId: string;
        storeName: string;
        orderCount: number;
        revenue: number;
      }>;
    }>('/admin/stats'),

  getUsers: (params?: { role?: string; search?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.role) sp.append('role', params.role);
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.pageSize) sp.append('pageSize', String(params.pageSize));
    const qs = sp.toString();
    return apiFetch<{
      users: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        role: string;
        createdAt: string;
        vendorProfile: {
          id: string;
          businessLegalName: string;
          stores: Array<{ id: string; name: string; slug: string; isActive: boolean }>;
        } | null;
      }>;
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  updateUserRole: (userId: string, role: string) =>
    apiFetch<{ user: { id: string; role: string } }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (userId: string) =>
    apiFetch<{ success: boolean }>(`/admin/users/${userId}`, { method: 'DELETE' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ success: boolean; message: string }>('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

