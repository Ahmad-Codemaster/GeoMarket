export type CartItemAvailability = 'available' | 'unavailable' | 'out_of_stock';

export interface CartStoreDto {
  id: string;
  name: string;
  slug: string;
  baseDeliveryFee: number;
  deliveryFee: number;
  minOrderAmount: number;
  minimumOrderAmount: number;
  isActive: boolean;
  status: string;
  isAcceptingOrders: boolean;
}

export interface CartItemDto {
  id: string;
  cartId: string;
  productId: string;
  productName: string;
  productSlug?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
  isAvailable: boolean;
  status: CartItemAvailability;
  imageUrl?: string | null;
  image?: string | null;
  unit?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartDto {
  id: string | null;
  cartId?: string | null;
  userId: string;
  storeId: string | null;
  store: CartStoreDto | null;
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
  isValid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartConflictErrorDetails {
  currentStoreId: string;
  currentStoreName?: string;
  attemptedStoreId: string;
  attemptedStoreName?: string;
}

export enum CartErrorCode {
  CART_STORE_CONFLICT = 'CART_STORE_CONFLICT',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRODUCT_INACTIVE = 'PRODUCT_INACTIVE',
  STORE_UNAVAILABLE = 'STORE_UNAVAILABLE',
  CART_NOT_FOUND = 'CART_NOT_FOUND',
  CART_ITEM_NOT_FOUND = 'CART_ITEM_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
}
