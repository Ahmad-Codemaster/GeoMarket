import { prisma } from '../../lib/prisma';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StoreStatus,
  UserRole,
  OrderDto,
  OrderErrorCode,
} from '@geomarket/shared';
import * as orderRepo from './order.repository';
import { OrderWithDetails } from './order.repository';
import { isStoreCurrentlyOpen } from '../discovery/discovery.service';
import { isValidOrderTransition, canCancelOrder } from './order.fsm';

export class OrderServiceError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'OrderServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function formatOrder(order: OrderWithDetails): OrderDto {
  return {
    id: order.id,
    userId: order.userId,
    storeId: order.storeId,
    status: order.status as OrderStatus,
    paymentMethod: order.paymentMethod as PaymentMethod,
    paymentStatus: order.paymentStatus as PaymentStatus,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items?.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      unitPriceSnapshot: Number(item.unitPriceSnapshot),
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    addressSnapshot: order.addressSnapshot
      ? {
          id: order.addressSnapshot.id,
          orderId: order.addressSnapshot.orderId,
          recipientName: order.addressSnapshot.recipientName,
          recipientPhone: order.addressSnapshot.recipientPhone,
          address: order.addressSnapshot.address,
          city: order.addressSnapshot.city,
          latitude: Number(order.addressSnapshot.latitude),
          longitude: Number(order.addressSnapshot.longitude),
          createdAt: order.addressSnapshot.createdAt.toISOString(),
        }
      : null,
    store: order.store
      ? {
          id: order.store.id,
          name: order.store.name,
          slug: order.store.slug,
          addressLine: order.store.addressLine,
          city: order.store.city,
          latitude: Number(order.store.latitude),
          longitude: Number(order.store.longitude),
          baseDeliveryFee: Number(order.store.baseDeliveryFee),
        }
      : null,
    customer: order.user
      ? {
          id: order.user.id,
          firstName: order.user.firstName,
          lastName: order.user.lastName,
          email: order.user.email,
          phone: order.user.phone,
        }
      : null,
  };
}

/**
 * Authoritative Server-Side Checkout
 */
export async function checkout(
  userId: string,
  addressInputOrId:
    | string
    | {
        addressId?: string;
        inlineAddress?: {
          recipientName: string;
          recipientPhone: string;
          addressLine: string;
          city: string;
          latitude: number;
          longitude: number;
        };
      },
  referenceDate: Date = new Date()
): Promise<OrderDto> {
  let addressId: string;
  if (typeof addressInputOrId === 'string') {
    addressId = addressInputOrId;
  } else if (addressInputOrId.addressId) {
    addressId = addressInputOrId.addressId;
  } else if (addressInputOrId.inlineAddress) {
    const inline = addressInputOrId.inlineAddress;
    const existingDefault = await prisma.customerAddress.findFirst({
      where: { userId, isDefault: true },
    });
    const createdAddress = await prisma.customerAddress.create({
      data: {
        userId,
        addressLabel: 'Delivery Address',
        recipientName: inline.recipientName,
        recipientPhone: inline.recipientPhone,
        addressLine: inline.addressLine,
        city: inline.city,
        latitude: inline.latitude,
        longitude: inline.longitude,
        isDefault: !existingDefault,
      },
    });
    addressId = createdAddress.id;
  } else {
    throw new OrderServiceError(
      'Delivery address is required',
      OrderErrorCode.ADDRESS_NOT_FOUND,
      400
    );
  }

  // 1. Authoritative Customer Address Validation
  const address = await prisma.customerAddress.findUnique({
    where: { id: addressId },
    include: { user: true },
  });

  if (!address || address.userId !== userId) {
    throw new OrderServiceError(
      'Delivery address not found or does not belong to you',
      OrderErrorCode.ADDRESS_NOT_FOUND,
      400
    );
  }

  // 2. Authoritative Cart Validation
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || !cart.storeId || cart.items.length === 0) {
    throw new OrderServiceError(
      'Your cart is empty',
      OrderErrorCode.EMPTY_CART,
      400
    );
  }

  // 3. Authoritative Store Validation
  const store = await prisma.store.findUnique({
    where: { id: cart.storeId },
    include: {
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });

  if (
    !store ||
    !store.isActive ||
    store.status !== StoreStatus.APPROVED ||
    !store.isAcceptingOrders
  ) {
    throw new OrderServiceError(
      'The store is currently inactive, suspended, or not accepting orders',
      OrderErrorCode.STORE_UNAVAILABLE,
      400
    );
  }

  // 4. Authoritative Timezone-Safe Operating Hours Check
  const isOpen = isStoreCurrentlyOpen(store.operatingHours, store.timezone, referenceDate);
  if (!isOpen) {
    throw new OrderServiceError(
      'The store is currently closed according to its operating hours',
      OrderErrorCode.STORE_CLOSED,
      400
    );
  }

  // 5. Authoritative PostGIS Geospatial Delivery Radius Validation
  const deliveryCheck = await prisma.$queryRaw<Array<{ in_radius: boolean }>>`
    SELECT ST_DWithin(
      s.location,
      ST_SetSRID(ST_MakePoint(${Number(address.longitude)}, ${Number(address.latitude)}), 4326)::geography,
      s.delivery_radius_km * 1000
    ) AS in_radius
    FROM stores s
    WHERE s.id = ${store.id}
  `;

  if (!deliveryCheck[0] || !deliveryCheck[0].in_radius) {
    throw new OrderServiceError(
      'Selected delivery address is outside the store delivery radius',
      OrderErrorCode.OUT_OF_DELIVERY_RADIUS,
      400
    );
  }

  // 6. Pre-validate Cart Items
  for (const item of cart.items) {
    if (item.product.storeId !== store.id) {
      throw new OrderServiceError(
        'Cart contains products from multiple stores',
        OrderErrorCode.PRODUCT_STORE_MISMATCH,
        400
      );
    }

    if (!item.product.isActive) {
      throw new OrderServiceError(
        `Product "${item.product.name}" is no longer active or available`,
        OrderErrorCode.PRODUCT_INACTIVE,
        400
      );
    }

    if (item.quantity < 1) {
      throw new OrderServiceError(
        'Invalid item quantity in cart',
        'INVALID_QUANTITY',
        400
      );
    }

    if (item.product.stockQuantity < item.quantity) {
      throw new OrderServiceError(
        `Insufficient stock for "${item.product.name}" (Available: ${item.product.stockQuantity})`,
        OrderErrorCode.INSUFFICIENT_STOCK,
        400,
        {
          productId: item.productId,
          availableStock: item.product.stockQuantity,
          requestedQuantity: item.quantity,
        }
      );
    }
  }

  // 7. Execute Atomic Checkout Transaction
  const recipientName =
    address.recipientName?.trim() ||
    `${address.user.firstName} ${address.user.lastName}`.trim() ||
    'Customer';
  const recipientPhone = address.recipientPhone?.trim() || address.user.phone || '';

  try {
    const createdOrder = await orderRepo.createCheckoutOrderTransaction({
      userId,
      storeId: store.id,
      addressId,
      cartId: cart.id,
      recipientName,
      recipientPhone,
      address: address.addressLine,
      city: address.city,
      latitude: address.latitude,
      longitude: address.longitude,
      deliveryFee: Number(store.baseDeliveryFee),
    });

    return formatOrder(createdOrder);
  } catch (err: any) {
    if (err.message === 'EMPTY_CART') {
      throw new OrderServiceError('Your cart is empty', OrderErrorCode.EMPTY_CART, 400);
    }
    if (err.message === 'CART_NOT_FOUND') {
      throw new OrderServiceError('Cart not found', OrderErrorCode.CART_NOT_FOUND, 400);
    }
    if (err.message === 'PRODUCT_STORE_MISMATCH') {
      throw new OrderServiceError(
        'Cart contains products from another store',
        OrderErrorCode.PRODUCT_STORE_MISMATCH,
        400
      );
    }
    if (err.message === 'PRODUCT_INACTIVE') {
      throw new OrderServiceError(
        'One or more products in your cart are no longer active',
        OrderErrorCode.PRODUCT_INACTIVE,
        400
      );
    }
    if (err.message === 'PRODUCT_NOT_FOUND') {
      throw new OrderServiceError(
        'One or more products in your cart could not be found',
        OrderErrorCode.PRODUCT_INACTIVE,
        400
      );
    }
    if (err.message === 'STORE_NOT_FOUND') {
      throw new OrderServiceError(
        'The store is no longer available',
        OrderErrorCode.STORE_UNAVAILABLE,
        400
      );
    }
    if (err.message === 'INSUFFICIENT_STOCK') {
      throw new OrderServiceError(
        'One or more products have insufficient stock',
        OrderErrorCode.INSUFFICIENT_STOCK,
        400
      );
    }
    if (err.message === 'MIN_ORDER_AMOUNT_NOT_MET') {
      throw new OrderServiceError(
        `Minimum order amount for this store is Rs. ${Number(store.minOrderAmount).toFixed(2)}`,
        OrderErrorCode.MIN_ORDER_AMOUNT_NOT_MET,
        400
      );
    }
    throw err;
  }
}

/**
 * Customer Order Operations
 */
export async function getCustomerOrders(
  userId: string,
  options?: { page?: number; pageSize?: number }
): Promise<{ orders: OrderDto[]; total: number; page: number; pageSize: number }> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;

  const { orders, total } = await orderRepo.findOrdersByUserId(userId, { page, pageSize });
  return {
    orders: orders.map(formatOrder),
    total,
    page,
    pageSize,
  };
}

export async function getCustomerOrderById(
  userId: string,
  orderId: string
): Promise<OrderDto> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order || order.userId !== userId) {
    throw new OrderServiceError('Order not found', OrderErrorCode.ORDER_NOT_FOUND, 404);
  }
  return formatOrder(order);
}

export async function cancelCustomerOrder(
  userId: string,
  orderId: string
): Promise<OrderDto> {
  const existing = await orderRepo.findOrderById(orderId);
  if (!existing || existing.userId !== userId) {
    throw new OrderServiceError('Order not found', OrderErrorCode.ORDER_NOT_FOUND, 404);
  }

  if (!canCancelOrder(existing.status as OrderStatus)) {
    throw new OrderServiceError(
      `Cannot cancel order with status ${existing.status}. Orders can only be cancelled while PLACED or CONFIRMED.`,
      OrderErrorCode.CANNOT_CANCEL_ORDER,
      400
    );
  }

  try {
    const cancelled = await orderRepo.cancelOrderTransaction(orderId, {
      userId,
      role: UserRole.CUSTOMER,
    });

    return formatOrder(cancelled);
  } catch (err: any) {
    if (err.message === 'ORDER_NOT_FOUND') {
      throw new OrderServiceError('Order not found', OrderErrorCode.ORDER_NOT_FOUND, 404);
    }
    if (err.message === 'CANNOT_CANCEL_ORDER') {
      throw new OrderServiceError(
        `Cannot cancel order in its current status. Orders can only be cancelled while PLACED or CONFIRMED.`,
        OrderErrorCode.CANNOT_CANCEL_ORDER,
        400
      );
    }
    throw err;
  }
}

/**
 * Vendor Order Operations
 */
export async function getVendorOrders(
  vendorProfileId: string,
  filters?: { storeId?: string; status?: OrderStatus; page?: number; pageSize?: number }
): Promise<{ orders: OrderDto[]; total: number; page: number; pageSize: number }> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;

  // Tenant isolation check if storeId is provided
  if (filters?.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: filters.storeId },
      select: { vendorProfileId: true },
    });

    if (!store || store.vendorProfileId !== vendorProfileId) {
      throw new OrderServiceError('Store not found', 'STORE_NOT_FOUND', 404);
    }
  }

  const { orders, total } = await orderRepo.findOrdersByVendorProfileId(vendorProfileId, {
    ...filters,
    page,
    pageSize,
  });

  return {
    orders: orders.map(formatOrder),
    total,
    page,
    pageSize,
  };
}

export async function getVendorOrderById(
  vendorProfileId: string,
  orderId: string
): Promise<OrderDto> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order || !order.store || order.store.vendorProfileId !== vendorProfileId) {
    throw new OrderServiceError('Order not found', OrderErrorCode.ORDER_NOT_FOUND, 404);
  }
  return formatOrder(order);
}

export async function updateVendorOrderStatus(
  vendorProfileId: string,
  orderId: string,
  targetStatus: OrderStatus
): Promise<OrderDto> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order || !order.store || order.store.vendorProfileId !== vendorProfileId) {
    throw new OrderServiceError('Order not found', OrderErrorCode.ORDER_NOT_FOUND, 404);
  }

  const currentStatus = order.status as OrderStatus;

  // Validate FSM transition
  if (!isValidOrderTransition(currentStatus, targetStatus)) {
    throw new OrderServiceError(
      `Invalid order status transition from ${currentStatus} to ${targetStatus}`,
      OrderErrorCode.INVALID_STATUS_TRANSITION,
      400
    );
  }

  // If cancellation, verify cancellation policy
  if (targetStatus === OrderStatus.CANCELLED && !canCancelOrder(currentStatus)) {
    throw new OrderServiceError(
      `Cannot cancel order with status ${currentStatus}`,
      OrderErrorCode.CANNOT_CANCEL_ORDER,
      400
    );
  }

  try {
    const updated = await orderRepo.updateOrderStatusTransaction(
      orderId,
      targetStatus,
      vendorProfileId
    );

    return formatOrder(updated);
  } catch (err: any) {
    if (err.message === 'ORDER_NOT_FOUND') {
      throw new OrderServiceError('Order not found', OrderErrorCode.ORDER_NOT_FOUND, 404);
    }
    if (err.message === 'INVALID_STATUS_TRANSITION') {
      throw new OrderServiceError(
        `Invalid order status transition to ${targetStatus}`,
        OrderErrorCode.INVALID_STATUS_TRANSITION,
        400
      );
    }
    if (err.message === 'CANNOT_CANCEL_ORDER') {
      throw new OrderServiceError(
        `Cannot cancel order in its current status`,
        OrderErrorCode.CANNOT_CANCEL_ORDER,
        400
      );
    }
    throw err;
  }
}

/**
 * Admin Order Operations
 */
export async function getAdminOrders(
  filters?: { status?: OrderStatus; page?: number; pageSize?: number }
): Promise<{ orders: OrderDto[]; total: number; page: number; pageSize: number }> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;

  const { orders, total } = await orderRepo.findOrdersAdmin({
    ...filters,
    page,
    pageSize,
  });

  return {
    orders: orders.map(formatOrder),
    total,
    page,
    pageSize,
  };
}

export async function getAdminOrderById(orderId: string): Promise<OrderDto> {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw new OrderServiceError('Order not found', OrderErrorCode.ORDER_NOT_FOUND, 404);
  }
  return formatOrder(order);
}

export async function lookupGuestOrder(orderId: string, phone: string): Promise<OrderDto> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      addressSnapshot: true,
      store: true,
      user: true,
    },
  });

  if (!order) {
    throw new OrderServiceError('Order not found with provided ID and phone number', OrderErrorCode.ORDER_NOT_FOUND, 404);
  }

  const clean = (p?: string | null) => (p || '').replace(/[\s\-\(\)\+]/g, '');
  const targetPhone = clean(phone);
  const snapshotPhone = clean(order.addressSnapshot?.recipientPhone);
  const userPhone = clean(order.user?.phone);

  const phoneMatches =
    (snapshotPhone && (snapshotPhone.endsWith(targetPhone) || targetPhone.endsWith(snapshotPhone))) ||
    (userPhone && (userPhone.endsWith(targetPhone) || targetPhone.endsWith(userPhone)));

  if (!phoneMatches) {
    throw new OrderServiceError('Order not found with provided ID and phone number', OrderErrorCode.ORDER_NOT_FOUND, 404);
  }

  return formatOrder(order as any);
}
