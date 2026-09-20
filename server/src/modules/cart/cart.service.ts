import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { StoreStatus } from '@geomarket/shared';
import { CartDto, CartItemAvailability, CartConflictErrorDetails } from '@geomarket/shared';
import * as cartRepo from './cart.repository';
import { CartWithDetails, cartIncludeDetails } from './cart.repository';

export class CartServiceError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'CartServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function formatCart(cart: CartWithDetails): CartDto {
  let subtotal = 0;
  let itemCount = 0;
  let allAvailable = true;

  const items = cart.items.map((item) => {
    const unitPrice = Number(item.product.price);
    const lineTotal = unitPrice * item.quantity;
    const availableStock = item.product.stockQuantity;

    // Requirement 21: CartItem.Product.storeId == Cart.storeId check during cart loading
    const isStoreMatch = !cart.storeId || item.product.storeId === cart.storeId;
    const isStoreActive =
      item.product.store.isActive &&
      item.product.store.status === StoreStatus.APPROVED;
    const isProductActive = item.product.isActive;
    const hasStock = availableStock >= item.quantity;

    let status: CartItemAvailability = 'available';
    if (!isStoreActive || !isProductActive || !isStoreMatch) {
      status = 'unavailable';
    } else if (!hasStock) {
      status = 'out_of_stock';
    }

    const isAvailable = status === 'available';
    if (!isAvailable) {
      allAvailable = false;
    }

    subtotal += lineTotal;
    itemCount += item.quantity;

    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      imageUrl: item.product.imageUrl,
      image: item.product.imageUrl,
      unit: item.product.unit,
      unitPrice,
      quantity: item.quantity,
      lineTotal: Math.round(lineTotal * 100) / 100,
      availableStock,
      isAvailable,
      status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  });

  const store = cart.store
    ? {
        id: cart.store.id,
        name: cart.store.name,
        slug: cart.store.slug,
        baseDeliveryFee: Number(cart.store.baseDeliveryFee),
        deliveryFee: Number(cart.store.baseDeliveryFee),
        minOrderAmount: Number(cart.store.minOrderAmount),
        minimumOrderAmount: Number(cart.store.minOrderAmount),
        isActive: cart.store.isActive,
        status: cart.store.status,
        isAcceptingOrders: cart.store.isAcceptingOrders,
      }
    : null;

  const isStoreAccepting = store
    ? (store.isActive && store.status === StoreStatus.APPROVED && store.isAcceptingOrders)
    : false;

  const isValid =
    items.length > 0
      ? allAvailable && isStoreAccepting
      : true;

  return {
    id: cart.id,
    cartId: cart.id,
    userId: cart.userId,
    storeId: cart.storeId,
    store,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount,
    isValid,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

export function createEmptyCartResponse(userId: string): CartDto {
  return {
    id: null,
    cartId: null,
    userId,
    storeId: null,
    store: null,
    items: [],
    subtotal: 0,
    itemCount: 0,
    isValid: true,
  };
}

/**
 * Retrieve the customer's cart. Returns null if customer has never created a cart,
 * or the formatted cart if it exists.
 */
export async function getCart(userId: string): Promise<CartDto | null> {
  const cart = await cartRepo.findCartByUserId(userId);
  if (!cart) {
    return null;
  }
  return formatCart(cart);
}

/**
 * Add a product to the authenticated customer's cart.
 * Strict Single-Store Invariant & Concurrency Protected.
 */
export async function addToCart(
  userId: string,
  productId: string,
  requestedQuantity: number,
): Promise<CartDto> {
  return prisma.$transaction(async (tx) => {
    // 1. Validate product exists and belongs to active store
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: {
        store: true,
      },
    });

    if (!product) {
      throw new CartServiceError('Product not found', 'PRODUCT_NOT_FOUND', 404);
    }

    if (!product.isActive) {
      throw new CartServiceError('Product is inactive or unavailable', 'PRODUCT_INACTIVE', 400);
    }

    if (
      !product.store ||
      !product.store.isActive ||
      product.store.status !== StoreStatus.APPROVED ||
      !product.store.isAcceptingOrders
    ) {
      throw new CartServiceError(
        'Store is currently unavailable or not accepting orders',
        'STORE_UNAVAILABLE',
        400,
      );
    }

    if (product.stockQuantity < 1) {
      throw new CartServiceError('Product is out of stock', 'INSUFFICIENT_STOCK', 400, {
        availableStock: 0,
        requestedQuantity,
      });
    }

    // 2. Load or create the customer's cart atomically via PostgreSQL ON CONFLICT DO NOTHING
    const generatedId = crypto.randomUUID();
    await tx.$executeRaw`
      INSERT INTO carts (id, user_id, store_id, created_at, updated_at)
      VALUES (${generatedId}, ${userId}, ${product.storeId}, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING
    `;

    // 3. Exclusively lock the cart row to serialize concurrent cart mutations for this user
    const lockedRows = await tx.$queryRaw<Array<{ id: string; user_id: string; store_id: string | null }>>`
      SELECT id, user_id, store_id FROM carts WHERE user_id = ${userId} FOR UPDATE
    `;

    if (!lockedRows || lockedRows.length === 0) {
      throw new CartServiceError('Cart not found', 'CART_NOT_FOUND', 404);
    }

    const cart = lockedRows[0];

    // 4. Fetch the authoritative locked cart state with items and product store relations
    const lockedCart = await tx.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              select: { storeId: true },
            },
          },
        },
      },
    });

    if (!lockedCart) {
      throw new CartServiceError('Cart not found', 'CART_NOT_FOUND', 404);
    }

    // 5. Strict Single-Store Invariant Enforcement:
    // If cart has existing items, all items must belong to the exact same store as the product.
    if (lockedCart.items.length > 0) {
      const currentStoreId = lockedCart.storeId || lockedCart.items[0]?.product?.storeId;
      if (currentStoreId && currentStoreId !== product.storeId) {
        const currentStore = await tx.store.findUnique({
          where: { id: currentStoreId },
          select: { id: true, name: true },
        });

        const conflictDetails: CartConflictErrorDetails = {
          currentStoreId,
          currentStoreName: currentStore?.name,
          attemptedStoreId: product.storeId,
          attemptedStoreName: product.store.name,
        };

        throw new CartServiceError(
          'Your cart contains items from another store. Clear your current cart before adding this item.',
          'CART_STORE_CONFLICT',
          409,
          conflictDetails,
        );
      }

      // If storeId on cart row was null, repair it to product.storeId
      if (!lockedCart.storeId) {
        await tx.cart.update({
          where: { id: lockedCart.id },
          data: { storeId: product.storeId },
        });
      }
    } else {
      // Cart is empty: establish new store context
      if (lockedCart.storeId !== product.storeId) {
        await tx.cart.update({
          where: { id: lockedCart.id },
          data: { storeId: product.storeId },
        });
      }
    }

    // 6. Check existing cart item for this product
    const existingItem = lockedCart.items.find((i) => i.productId === productId);
    const existingQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = existingQuantity + requestedQuantity;

    // Check available stock
    if (newQuantity > product.stockQuantity) {
      throw new CartServiceError(
        `Requested quantity (${newQuantity}) exceeds available stock (${product.stockQuantity})`,
        'INSUFFICIENT_STOCK',
        400,
        {
          availableStock: product.stockQuantity,
          requestedQuantity: newQuantity,
        },
      );
    }

    if (existingItem) {
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: lockedCart.id,
          productId,
          quantity: requestedQuantity,
        },
      });
    }

    // 7. Load final updated cart with relations
    const finalCart = await tx.cart.findUnique({
      where: { id: lockedCart.id },
      include: cartIncludeDetails,
    });

    if (!finalCart) {
      throw new CartServiceError('Cart not found', 'CART_NOT_FOUND', 404);
    }

    return formatCart(finalCart);
  });
}

/**
 * Update an existing cart item's quantity.
 * Must belong to authenticated customer's cart.
 */
export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartDto> {
  return prisma.$transaction(async (tx) => {
    // 1. Locate customer's cart
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new CartServiceError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    // 2. Lock cart
    await tx.$queryRaw`SELECT id FROM carts WHERE id = ${cart.id} FOR UPDATE`;

    // 3. Locate item and verify tenant ownership
    const item = await tx.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!item || item.cartId !== cart.id) {
      throw new CartServiceError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    // Strict Store ID consistency check (Requirement 21)
    if (cart.storeId && item.product.storeId !== cart.storeId) {
      throw new CartServiceError('Cart item store mismatch', 'CART_STORE_CONFLICT', 409);
    }

    // Verify product is still active (Requirement 13)
    if (!item.product.isActive) {
      throw new CartServiceError('Product is inactive or unavailable', 'PRODUCT_INACTIVE', 400);
    }

    // Verify store is still active and approved (Requirement 14)
    if (
      !item.product.store ||
      !item.product.store.isActive ||
      item.product.store.status !== StoreStatus.APPROVED
    ) {
      throw new CartServiceError(
        'Store is currently unavailable or inactive',
        'STORE_UNAVAILABLE',
        400,
      );
    }

    // 4. Validate stock
    if (quantity > item.product.stockQuantity) {
      throw new CartServiceError(
        `Requested quantity (${quantity}) exceeds available stock (${item.product.stockQuantity})`,
        'INSUFFICIENT_STOCK',
        400,
        {
          availableStock: item.product.stockQuantity,
          requestedQuantity: quantity,
        },
      );
    }

    // 5. Update item quantity
    await tx.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // 6. Return updated cart
    const finalCart = await tx.cart.findUnique({
      where: { id: cart.id },
      include: cartIncludeDetails,
    });

    if (!finalCart) {
      throw new CartServiceError('Cart not found', 'CART_NOT_FOUND', 404);
    }

    return formatCart(finalCart);
  });
}

/**
 * Remove an item from the customer's cart.
 * If the removed item is the final item, storeId is reset to null.
 */
export async function removeCartItem(userId: string, itemId: string): Promise<CartDto> {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new CartServiceError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    await tx.$queryRaw`SELECT id FROM carts WHERE id = ${cart.id} FOR UPDATE`;

    const item = await tx.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new CartServiceError('Cart item not found', 'CART_ITEM_NOT_FOUND', 404);
    }

    await tx.cartItem.delete({
      where: { id: itemId },
    });

    const remainingCount = await tx.cartItem.count({
      where: { cartId: cart.id },
    });

    if (remainingCount === 0) {
      await tx.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      });
    }

    const finalCart = await tx.cart.findUnique({
      where: { id: cart.id },
      include: cartIncludeDetails,
    });

    if (!finalCart) {
      throw new CartServiceError('Cart not found', 'CART_NOT_FOUND', 404);
    }

    return formatCart(finalCart);
  });
}

/**
 * Clear all items from the customer's cart and reset storeId to null.
 */
export async function clearCart(userId: string): Promise<CartDto> {
  return prisma.$transaction(async (tx) => {
    let cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return createEmptyCartResponse(userId);
    }

    await tx.$queryRaw`SELECT id FROM carts WHERE id = ${cart.id} FOR UPDATE`;

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: { storeId: null },
    });

    const finalCart = await tx.cart.findUnique({
      where: { id: cart.id },
      include: cartIncludeDetails,
    });

    if (!finalCart) {
      return createEmptyCartResponse(userId);
    }

    return formatCart(finalCart);
  });
}
