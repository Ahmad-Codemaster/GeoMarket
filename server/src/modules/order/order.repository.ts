import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '@geomarket/shared';
import { isValidOrderTransition } from './order.fsm';

export const orderIncludeDetails = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  addressSnapshot: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      addressLine: true,
      city: true,
      latitude: true,
      longitude: true,
      baseDeliveryFee: true,
      vendorProfileId: true,
    },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
};

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderIncludeDetails;
}>;

export interface CreateOrderCheckoutData {
  userId: string;
  storeId: string;
  addressId: string;
  cartId: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  latitude: number | Prisma.Decimal;
  longitude: number | Prisma.Decimal;
  deliveryFee: number;
}

/**
 * Atomic Checkout Transaction
 * Strictly serializes cart and product mutations, re-verifies inventory under lock,
 * creates immutable Order, OrderItem snapshots, and OrderAddressSnapshot,
 * decrements stock, and clears the cart atomically.
 */
export async function createCheckoutOrderTransaction(
  data: CreateOrderCheckoutData
): Promise<OrderWithDetails> {
  return prisma.$transaction(async (tx) => {
    // 1. Lock the customer's cart row exclusively
    const lockedCartRows = await tx.$queryRaw<Array<{ id: string; user_id: string; store_id: string | null }>>`
      SELECT id, user_id, store_id FROM carts WHERE id = ${data.cartId} FOR UPDATE
    `;

    if (!lockedCartRows || lockedCartRows.length === 0) {
      throw new Error('CART_NOT_FOUND');
    }

    const lockedCart = lockedCartRows[0];
    if (!lockedCart.store_id || lockedCart.store_id !== data.storeId) {
      throw new Error('PRODUCT_STORE_MISMATCH');
    }

    // 2. Fetch cart items for this cart
    const cartItems = await tx.cartItem.findMany({
      where: { cartId: lockedCart.id },
      orderBy: { createdAt: 'asc' },
    });

    if (cartItems.length === 0) {
      throw new Error('EMPTY_CART');
    }

    const productIds = Array.from(new Set(cartItems.map((ci) => ci.productId)));

    // 3. Exclusively lock all required product rows in deterministic order to prevent deadlocks and overselling
    const lockedProducts = await tx.$queryRaw<
      Array<{
        id: string;
        store_id: string;
        name: string;
        price: any;
        stock_quantity: number;
        is_active: boolean;
      }>
    >`
      SELECT id, store_id, name, price, stock_quantity, is_active
      FROM products
      WHERE id = ANY(${productIds})
      ORDER BY id
      FOR UPDATE
    `;

    const productMap = new Map(lockedProducts.map((p) => [p.id, p]));

    // 4. Re-verify every cart product under exclusive lock
    let subtotal = 0;
    const itemsToCreate: Array<{
      productId: string;
      productNameSnapshot: string;
      unitPriceSnapshot: Prisma.Decimal;
      quantity: number;
      lineTotal: Prisma.Decimal;
    }> = [];

    for (const item of cartItems) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      if (product.store_id !== data.storeId) {
        throw new Error('PRODUCT_STORE_MISMATCH');
      }

      if (!product.is_active) {
        throw new Error('PRODUCT_INACTIVE');
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const unitPrice = Number(product.price);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal += lineTotal;

      itemsToCreate.push({
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: new Prisma.Decimal(unitPrice),
        quantity: item.quantity,
        lineTotal: new Prisma.Decimal(lineTotal),
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // 5. Re-check store minOrderAmount under lock
    const store = await tx.store.findUnique({
      where: { id: data.storeId },
      select: { minOrderAmount: true, baseDeliveryFee: true },
    });

    if (!store) {
      throw new Error('STORE_NOT_FOUND');
    }

    if (subtotal < Number(store.minOrderAmount)) {
      throw new Error('MIN_ORDER_AMOUNT_NOT_MET');
    }

    const authoritativeDeliveryFee = Number(store.baseDeliveryFee);
    const totalAmount = Math.round((subtotal + authoritativeDeliveryFee) * 100) / 100;

    // 6. Create the Order
    const order = await tx.order.create({
      data: {
        userId: data.userId,
        storeId: data.storeId,
        status: OrderStatus.PLACED,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: new Prisma.Decimal(subtotal),
        deliveryFee: new Prisma.Decimal(authoritativeDeliveryFee),
        totalAmount: new Prisma.Decimal(totalAmount),
      },
    });

    // 7. Create OrderItems using immutable product snapshots and atomically deduct inventory
    for (const item of itemsToCreate) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          unitPriceSnapshot: item.unitPriceSnapshot,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        },
      });

      // Atomic inventory deduction
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 8. Create immutable OrderAddressSnapshot
    await tx.orderAddressSnapshot.create({
      data: {
        orderId: order.id,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        address: data.address,
        city: data.city,
        latitude: new Prisma.Decimal(data.latitude),
        longitude: new Prisma.Decimal(data.longitude),
      },
    });

    // 9. Clear the customer's cart
    await tx.cartItem.deleteMany({
      where: { cartId: lockedCart.id },
    });

    await tx.cart.update({
      where: { id: lockedCart.id },
      data: { storeId: null },
    });

    // 10. Load and return created order with all relations
    const createdOrder = await tx.order.findUnique({
      where: { id: order.id },
      include: orderIncludeDetails,
    });

    if (!createdOrder) {
      throw new Error('ORDER_NOT_FOUND');
    }

    return createdOrder;
  });
}

export async function findOrderById(orderId: string): Promise<OrderWithDetails | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderIncludeDetails,
  });
}

export async function findOrdersByUserId(
  userId: string,
  options?: { page?: number; pageSize?: number }
): Promise<{ orders: OrderWithDetails[]; total: number }> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: orderIncludeDetails,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return { orders, total };
}

export async function findOrdersByVendorProfileId(
  vendorProfileId: string,
  filters?: { storeId?: string; status?: OrderStatus; page?: number; pageSize?: number }
): Promise<{ orders: OrderWithDetails[]; total: number }> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {
    store: {
      vendorProfileId,
      ...(filters?.storeId ? { id: filters.storeId } : {}),
    },
    ...(filters?.status ? { status: filters.status } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderIncludeDetails,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

export async function findOrdersAdmin(
  filters?: { status?: OrderStatus; page?: number; pageSize?: number }
): Promise<{ orders: OrderWithDetails[]; total: number }> {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {
    ...(filters?.status ? { status: filters.status } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderIncludeDetails,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

/**
 * Concurrency-Safe Order Cancellation & Inventory Restoration Transaction
 */
export async function cancelOrderTransaction(
  orderId: string,
  actor: { userId: string; role: UserRole; vendorProfileId?: string }
): Promise<OrderWithDetails> {
  return prisma.$transaction(async (tx) => {
    // 1. Lock the order row exclusively
    const lockedOrders = await tx.$queryRaw<
      Array<{
        id: string;
        user_id: string;
        store_id: string;
        status: OrderStatus;
        payment_status: PaymentStatus;
      }>
    >`
      SELECT id, user_id, store_id, status, payment_status
      FROM orders
      WHERE id = ${orderId}
      FOR UPDATE
    `;

    if (!lockedOrders || lockedOrders.length === 0) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const order = lockedOrders[0];

    // 2. Verify actor authorization (separate concern from FSM)
    if (actor.role === UserRole.CUSTOMER) {
      if (order.user_id !== actor.userId) {
        throw new Error('ORDER_NOT_FOUND'); // Anti-enumeration
      }
    } else if (actor.role === UserRole.VENDOR) {
      const store = await tx.store.findUnique({
        where: { id: order.store_id },
        select: { vendorProfileId: true },
      });

      if (!store || store.vendorProfileId !== actor.vendorProfileId) {
        throw new Error('ORDER_NOT_FOUND'); // Anti-enumeration
      }
    }

    // 3. FSM Check: Can only cancel from PLACED or CONFIRMED
    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.CONFIRMED) {
      throw new Error('CANNOT_CANCEL_ORDER');
    }

    // 4. Load order items to restore inventory
    const items = await tx.orderItem.findMany({
      where: { orderId: order.id },
    });

    const productIdsWithStock = Array.from(
      new Set(
        items
          .filter((i) => i.productId !== null)
          .map((i) => i.productId as string)
      )
    );

    if (productIdsWithStock.length > 0) {
      // Exclusively lock product rows before restoring stock
      const lockedProductRows = await tx.$queryRaw<Array<{ id: string; stock_quantity: number }>>`
        SELECT id, stock_quantity
        FROM products
        WHERE id = ANY(${productIdsWithStock})
        ORDER BY id
        FOR UPDATE
      `;

      const existingProductIds = new Set(lockedProductRows.map((p) => p.id));

      const qtyMap = new Map<string, number>();
      for (const item of items) {
        if (item.productId && existingProductIds.has(item.productId)) {
          qtyMap.set(item.productId, (qtyMap.get(item.productId) || 0) + item.quantity);
        }
      }

      for (const [productId, quantity] of qtyMap.entries()) {
        await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: {
              increment: quantity,
            },
          },
        });
      }
    }

    // 5. Update order to CANCELLED
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      },
    });

    const updated = await tx.order.findUnique({
      where: { id: order.id },
      include: orderIncludeDetails,
    });

    return updated!;
  });
}

/**
 * Concurrency-Safe Order Status Transition Transaction
 */
export async function updateOrderStatusTransaction(
  orderId: string,
  targetStatus: OrderStatus,
  vendorProfileId?: string
): Promise<OrderWithDetails> {
  return prisma.$transaction(async (tx) => {
    // 1. Lock the order row exclusively
    const lockedOrders = await tx.$queryRaw<
      Array<{
        id: string;
        user_id: string;
        store_id: string;
        status: OrderStatus;
        payment_status: PaymentStatus;
      }>
    >`
      SELECT id, user_id, store_id, status, payment_status
      FROM orders
      WHERE id = ${orderId}
      FOR UPDATE
    `;

    if (!lockedOrders || lockedOrders.length === 0) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const order = lockedOrders[0];

    // 2. Verify vendor tenant isolation if vendorProfileId is provided
    if (vendorProfileId) {
      const store = await tx.store.findUnique({
        where: { id: order.store_id },
        select: { vendorProfileId: true },
      });

      if (!store || store.vendorProfileId !== vendorProfileId) {
        throw new Error('ORDER_NOT_FOUND'); // Anti-enumeration
      }
    }

    // 3. FSM Check under transaction lock
    if (!isValidOrderTransition(order.status as OrderStatus, targetStatus)) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    // 4. If targetStatus is CANCELLED, invoke cancellation logic with stock restoration
    if (targetStatus === OrderStatus.CANCELLED) {
      if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.CONFIRMED) {
        throw new Error('CANNOT_CANCEL_ORDER');
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: order.id },
      });

      const productIdsWithStock = Array.from(
        new Set(
          items
            .filter((i) => i.productId !== null)
            .map((i) => i.productId as string)
        )
      );

      if (productIdsWithStock.length > 0) {
        const lockedProductRows = await tx.$queryRaw<Array<{ id: string; stock_quantity: number }>>`
          SELECT id, stock_quantity
          FROM products
          WHERE id = ANY(${productIdsWithStock})
          ORDER BY id
          FOR UPDATE
        `;

        const existingProductIds = new Set(lockedProductRows.map((p) => p.id));

        const qtyMap = new Map<string, number>();
        for (const item of items) {
          if (item.productId && existingProductIds.has(item.productId)) {
            qtyMap.set(item.productId, (qtyMap.get(item.productId) || 0) + item.quantity);
          }
        }

        for (const [productId, quantity] of qtyMap.entries()) {
          await tx.product.update({
            where: { id: productId },
            data: {
              stockQuantity: {
                increment: quantity,
              },
            },
          });
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
        },
      });

      const updated = await tx.order.findUnique({
        where: { id: order.id },
        include: orderIncludeDetails,
      });

      return updated!;
    }

    // 4. Update status (if targetStatus is DELIVERED, COD paymentStatus becomes PAID)
    const newPaymentStatus =
      targetStatus === OrderStatus.DELIVERED
        ? PaymentStatus.PAID
        : order.payment_status;

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: targetStatus,
        paymentStatus: newPaymentStatus,
      },
    });

    const updated = await tx.order.findUnique({
      where: { id: order.id },
      include: orderIncludeDetails,
    });

    return updated!;
  });
}
