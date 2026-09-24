import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env';

export interface RawDiscoveredStore {
  store_id: string;
  store_name: string;
  store_slug: string;
  description: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  address: string;
  city: string;
  latitude: number | string;
  longitude: number | string;
  delivery_radius_km: number | string;
  base_delivery_fee: number | string;
  min_order_amount: number | string;
  is_accepting_orders: boolean;
  timezone: string;
  average_rating: number | string;
  total_reviews: number;
  category_id: string;
  category_name: string;
  category_slug: string;
  distance_km: number | string;
}

export interface DiscoveredStoresQueryParams {
  latitude: number;
  longitude: number;
  storeCategoryId?: string;
  search?: string;
  page: number;
  pageSize: number;
  referenceDate: Date;
}

export async function findDiscoveredStores(params: DiscoveredStoresQueryParams): Promise<{
  rows: RawDiscoveredStore[];
  total: number;
}> {
  const { latitude, longitude, storeCategoryId, search, page, pageSize, referenceDate } = params;
  const offset = (page - 1) * pageSize;
  const maxRadiusMeters = env.MAX_DELIVERY_RADIUS_KM * 1000;
  const refDateStr = referenceDate.toISOString();

  // ST_MakePoint coordinate order: (longitude, latitude)
  const conditions: Prisma.Sql[] = [
    Prisma.sql`s.status = 'APPROVED'`,
    Prisma.sql`s.is_active = true`,
    Prisma.sql`s.is_accepting_orders = true`,
    // GiST index-compatible bounding box pre-filter using max configured delivery radius
    Prisma.sql`ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${maxRadiusMeters})`,
    // Store-specific straight-line geographic radius filter
    Prisma.sql`ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, s.delivery_radius_km * 1000)`,
    // Operating hours check: open on day of week and current time within [opening_time, closing_time] in store's timezone (using resilient safe_timestamptz_at_tz)
    Prisma.sql`EXISTS (
      SELECT 1 FROM store_operating_hours soh
      WHERE soh.store_id = s.id
        AND soh.day_of_week = EXTRACT(DOW FROM safe_timestamptz_at_tz(${refDateStr}::timestamptz, s.timezone))::int
        AND soh.is_closed = false
        AND to_char(safe_timestamptz_at_tz(${refDateStr}::timestamptz, s.timezone), 'HH24:MI') >= soh.opening_time
        AND to_char(safe_timestamptz_at_tz(${refDateStr}::timestamptz, s.timezone), 'HH24:MI') <= soh.closing_time
    )`,
    // Ensure store category is active
    Prisma.sql`sc.is_active = true`,
  ];

  if (storeCategoryId) {
    conditions.push(Prisma.sql`s.store_category_id = ${storeCategoryId}`);
  }

  if (search && search.trim()) {
    const escapedSearch = search.trim().replace(/([%_\\])/g, '\\$1');
    const searchPattern = `%${escapedSearch}%`;
    conditions.push(Prisma.sql`s.name ILIKE ${searchPattern}`);
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  // 1. Total count query with identical WHERE conditions and store_categories join
  const countResult = await prisma.$queryRaw<{ count: number }[]>(
    Prisma.sql`
      SELECT COUNT(*)::int as count
      FROM stores s
      JOIN store_categories sc ON s.store_category_id = sc.id
      ${whereSql}
    `,
  );
  const total = Number(countResult[0]?.count ?? 0);

  if (total === 0) {
    return { rows: [], total: 0 };
  }

  // 2. Paginated data query with PostGIS distance calculation and deterministic ordering
  const rows = await prisma.$queryRaw<RawDiscoveredStore[]>(
    Prisma.sql`
      SELECT
        s.id AS store_id,
        s.name AS store_name,
        s.slug AS store_slug,
        s.description,
        s.image_url,
        s.logo_url,
        s.address_line AS address,
        s.city,
        s.latitude,
        s.longitude,
        s.delivery_radius_km,
        s.base_delivery_fee,
        s.min_order_amount,
        s.is_accepting_orders,
        s.timezone,
        s.average_rating,
        s.total_reviews,
        sc.id AS category_id,
        sc.name AS category_name,
        sc.slug AS category_slug,
        ROUND((ST_Distance(s.location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography) / 1000.0)::numeric, 2) AS distance_km
      FROM stores s
      JOIN store_categories sc ON s.store_category_id = sc.id
      ${whereSql}
      ORDER BY distance_km ASC, s.name ASC, s.id ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
  );

  return { rows, total };
}

export async function findDiscoveredStoreById(
  idOrSlug: string,
  coords?: { latitude: number; longitude: number },
) {
  // Store must be APPROVED, active, and belong to an active category
  const store = await prisma.store.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      status: 'APPROVED',
      isActive: true,
      storeCategory: {
        isActive: true,
      },
    },
    include: {
      storeCategory: true,
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });

  if (!store) {
    return null;
  }

  let distanceKm: number | null = null;
  if (coords && coords.latitude !== undefined && coords.longitude !== undefined) {
    const distResult = await prisma.$queryRaw<{ distance_km: number }[]>(
      Prisma.sql`
        SELECT ROUND((ST_Distance(
          s.location,
          ST_SetSRID(ST_MakePoint(${coords.longitude}, ${coords.latitude}), 4326)::geography
        ) / 1000.0)::numeric, 2) AS distance_km
        FROM stores s
        WHERE s.id = ${store.id}
      `,
    );
    if (distResult[0]) {
      distanceKm = Number(distResult[0].distance_km);
    }
  }

  return { store, distanceKm };
}

export async function findStoreActiveProducts(
  storeId: string,
  params: {
    productCategoryId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    storeId,
    isActive: true,
  };

  if (params.productCategoryId) {
    where.productCategoryId = params.productCategoryId;
  }

  if (params.search && params.search.trim()) {
    where.name = { contains: params.search.trim(), mode: 'insensitive' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, pageSize };
}

export async function findDiscoveredProductById(idOrSlug: string) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      isActive: true,
      store: {
        status: 'APPROVED',
        isActive: true,
      },
    },
    include: {
      category: true,
      store: {
        include: {
          storeCategory: true,
          operatingHours: {
            orderBy: { dayOfWeek: 'asc' },
          },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      storeId: product.storeId,
      id: { not: product.id },
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return { product, relatedProducts };
}

export async function findDiscoveredProducts(params: {
  search?: string;
  productCategoryId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
  page?: number;
  pageSize?: number;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 12;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    store: {
      status: 'APPROVED',
      isActive: true,
    },
  };

  if (params.productCategoryId) {
    where.productCategoryId = params.productCategoryId;
  }

  if (params.storeId) {
    where.storeId = params.storeId;
  }

  if (params.inStockOnly) {
    where.stockQuantity = { gt: 0 };
  }

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {};
    if (params.minPrice !== undefined) {
      where.price.gte = params.minPrice;
    }
    if (params.maxPrice !== undefined) {
      where.price.lte = params.maxPrice;
    }
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (params.sortBy === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (params.sortBy === 'price_desc') {
    orderBy = { price: 'desc' };
  } else if (params.sortBy === 'name_asc') {
    orderBy = { name: 'asc' };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        store: {
          include: {
            storeCategory: true,
            operatingHours: {
              orderBy: { dayOfWeek: 'asc' },
            },
          },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, pageSize };
}
