export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  COD = 'COD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string | null;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderAddressSnapshotDto {
  id: string;
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface OrderStoreSummaryDto {
  id: string;
  name: string;
  slug: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  baseDeliveryFee?: number;
}

export interface OrderCustomerSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface OrderDto {
  id: string;
  userId: string;
  storeId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemDto[];
  addressSnapshot?: OrderAddressSnapshotDto | null;
  store?: OrderStoreSummaryDto | null;
  customer?: OrderCustomerSummaryDto | null;
}

export interface CheckoutInputDto {
  addressId: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface OrderQueryDto {
  storeId?: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}

export enum OrderErrorCode {
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  CANNOT_CANCEL_ORDER = 'CANNOT_CANCEL_ORDER',
  STORE_CLOSED = 'STORE_CLOSED',
  STORE_UNAVAILABLE = 'STORE_UNAVAILABLE',
  OUT_OF_DELIVERY_RADIUS = 'OUT_OF_DELIVERY_RADIUS',
  EMPTY_CART = 'EMPTY_CART',
  CART_NOT_FOUND = 'CART_NOT_FOUND',
  ADDRESS_NOT_FOUND = 'ADDRESS_NOT_FOUND',
  MIN_ORDER_AMOUNT_NOT_MET = 'MIN_ORDER_AMOUNT_NOT_MET',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRODUCT_INACTIVE = 'PRODUCT_INACTIVE',
  PRODUCT_STORE_MISMATCH = 'PRODUCT_STORE_MISMATCH',
}
