import * as discoveryRepo from './discovery.repository';
import {
  DiscoveredStoreDto,
  DiscoveredStoresResponseDto,
  CustomerProductDto,
  DiscoveredProductDetailDto,
  DiscoveredProductsListResponseDto,
} from '@geomarket/shared';
import {
  StoreDiscoveryQueryInput,
  StoreProductsQueryInput,
  ProductsDiscoveryQueryInput,
} from './discovery.schemas';

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Deterministically check if a store is open given operating hours, timezone, and reference date.
 * Strictly uses same-day operating intervals (no overnight scheduling).
 */
export function isStoreCurrentlyOpen(
  operatingHours: { dayOfWeek: number; openingTime: string; closingTime: string; isClosed: boolean }[],
  timezone: string = 'Asia/Karachi',
  referenceDate: Date = new Date(),
): boolean {
  if (!operatingHours || operatingHours.length === 0) {
    return false;
  }

  let tz = timezone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = 'Asia/Karachi';
  }

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour12: false,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = Object.fromEntries(dtf.formatToParts(referenceDate).map((p) => [p.type, p.value]));
  const currentDayOfWeek = WEEKDAY_MAP[parts.weekday];
  const currentTime = `${parts.hour}:${parts.minute}`;

  const todaySchedule = operatingHours.find((h) => h.dayOfWeek === currentDayOfWeek);
  if (!todaySchedule || todaySchedule.isClosed) {
    return false;
  }

  return currentTime >= todaySchedule.openingTime && currentTime <= todaySchedule.closingTime;
}

export async function discoverStores(
  input: StoreDiscoveryQueryInput,
): Promise<DiscoveredStoresResponseDto> {
  const referenceDate = input.referenceTime ? new Date(input.referenceTime) : new Date();

  const { rows, total } = await discoveryRepo.findDiscoveredStores({
    latitude: input.latitude,
    longitude: input.longitude,
    storeCategoryId: input.storeCategoryId,
    search: input.search,
    page: input.page,
    pageSize: input.pageSize,
    referenceDate,
  });

  const totalPages = Math.ceil(total / input.pageSize);

  const stores: DiscoveredStoreDto[] = rows.map((r) => ({
    storeId: r.store_id,
    storeName: r.store_name,
    storeSlug: r.store_slug,
    storeCategory: {
      id: r.category_id,
      name: r.category_name,
      slug: r.category_slug,
    },
    description: r.description,
    imageUrl: r.image_url ?? null,
    logoUrl: r.logo_url ?? null,
    address: r.address,
    city: r.city,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    deliveryRadiusKm: Number(r.delivery_radius_km),
    distanceKm: Number(r.distance_km),
    baseDeliveryFee: Number(r.base_delivery_fee),
    minimumOrderAmount: Number(r.min_order_amount),
    isAcceptingOrders: r.is_accepting_orders,
    isOpen: true, // Strictly filtered in SQL query
    averageRating: Number(r.average_rating),
    totalReviews: r.total_reviews,
    timezone: r.timezone,
  }));

  return {
    stores,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages,
      hasNextPage: input.page < totalPages,
      hasPrevPage: input.page > 1,
    },
  };
}

export async function getDiscoveredStore(
  idOrSlug: string,
  coords?: { latitude: number; longitude: number },
  referenceDate: Date = new Date(),
): Promise<DiscoveredStoreDto> {
  const result = await discoveryRepo.findDiscoveredStoreById(idOrSlug, coords);
  if (!result || !result.store) {
    throw new Error('STORE_NOT_FOUND');
  }

  const { store, distanceKm } = result;

  const isOpen = isStoreCurrentlyOpen(store.operatingHours, store.timezone, referenceDate);

  return {
    storeId: store.id,
    storeName: store.name,
    storeSlug: store.slug,
    storeCategory: {
      id: store.storeCategory.id,
      name: store.storeCategory.name,
      slug: store.storeCategory.slug,
    },
    description: store.description,
    imageUrl: store.imageUrl ?? null,
    logoUrl: store.logoUrl ?? null,
    address: store.addressLine,
    city: store.city,
    latitude: Number(store.latitude),
    longitude: Number(store.longitude),
    deliveryRadiusKm: Number(store.deliveryRadiusKm),
    distanceKm: distanceKm !== null ? distanceKm : 0,
    baseDeliveryFee: Number(store.baseDeliveryFee),
    minimumOrderAmount: Number(store.minOrderAmount),
    isAcceptingOrders: store.isAcceptingOrders,
    isOpen,
    averageRating: Number(store.averageRating),
    totalReviews: store.totalReviews,
    timezone: store.timezone,
    operatingHours: store.operatingHours.map((h) => ({

      id: h.id,
      storeId: h.storeId,
      dayOfWeek: h.dayOfWeek,
      openingTime: h.openingTime,
      closingTime: h.closingTime,
      isClosed: h.isClosed,
    })),
  };
}

export async function getDiscoveredStoreProducts(
  storeIdOrSlug: string,
  input: StoreProductsQueryInput,
) {
  const storeResult = await discoveryRepo.findDiscoveredStoreById(storeIdOrSlug);
  if (!storeResult || !storeResult.store) {
    throw new Error('STORE_NOT_FOUND');
  }

  const { products, total, page, pageSize } = await discoveryRepo.findStoreActiveProducts(
    storeResult.store.id,
    input,
  );

  const totalPages = Math.ceil(total / pageSize);

  const customerProducts: CustomerProductDto[] = products.map((p) => ({
    id: p.id,
    storeId: p.storeId,
    productCategoryId: p.productCategoryId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    stockQuantity: p.stockQuantity,
    sku: p.sku,
    imageUrl: p.imageUrl,
    unit: p.unit,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          description: p.category.description,
        }
      : undefined,
  }));

  return {
    products: customerProducts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getDiscoveredProductById(
  idOrSlug: string,
  referenceDate: Date = new Date(),
): Promise<DiscoveredProductDetailDto> {
  const result = await discoveryRepo.findDiscoveredProductById(idOrSlug);
  if (!result || !result.product) {
    throw new Error('PRODUCT_NOT_FOUND');
  }

  const { product, relatedProducts } = result;
  const store = product.store;
  const isOpen = isStoreCurrentlyOpen(store.operatingHours, store.timezone, referenceDate);

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
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          description: product.category.description,
        }
      : undefined,
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      addressLine: store.addressLine,
      city: store.city,
      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
      deliveryRadiusKm: Number(store.deliveryRadiusKm),
      baseDeliveryFee: Number(store.baseDeliveryFee),
      minOrderAmount: Number(store.minOrderAmount),
      averageRating: Number(store.averageRating),
      totalReviews: store.totalReviews,
      isOpen,
      isAcceptingOrders: store.isAcceptingOrders,
    },
    relatedProducts: relatedProducts.map((p) => ({
      id: p.id,
      storeId: p.storeId,
      productCategoryId: p.productCategoryId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      stockQuantity: p.stockQuantity,
      sku: p.sku,
      imageUrl: p.imageUrl,
      unit: p.unit,
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            description: p.category.description,
          }
        : undefined,
    })),
  };
}

export async function searchDiscoveredProducts(
  input: ProductsDiscoveryQueryInput,
  referenceDate: Date = new Date(),
): Promise<DiscoveredProductsListResponseDto> {
  const { products, total, page, pageSize } = await discoveryRepo.findDiscoveredProducts(input);
  const totalPages = Math.ceil(total / pageSize);

  const mappedProducts = products.map((p) => {
    const store = p.store;
    const isOpen = isStoreCurrentlyOpen(store.operatingHours, store.timezone, referenceDate);

    return {
      id: p.id,
      storeId: p.storeId,
      productCategoryId: p.productCategoryId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      stockQuantity: p.stockQuantity,
      sku: p.sku,
      imageUrl: p.imageUrl,
      unit: p.unit,
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            description: p.category.description,
          }
        : undefined,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        addressLine: store.addressLine,
        city: store.city,
        latitude: Number(store.latitude),
        longitude: Number(store.longitude),
        deliveryRadiusKm: Number(store.deliveryRadiusKm),
        baseDeliveryFee: Number(store.baseDeliveryFee),
        minOrderAmount: Number(store.minOrderAmount),
        averageRating: Number(store.averageRating),
        totalReviews: store.totalReviews,
        isOpen,
        isAcceptingOrders: store.isAcceptingOrders,
      },
    };
  });

  return {
    products: mappedProducts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
