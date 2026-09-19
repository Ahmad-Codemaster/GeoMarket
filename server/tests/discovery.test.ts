import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole, StoreStatus } from '@geomarket/shared';

const app = createApp();

async function cleanDatabase() {
  await prisma.customerAddress.deleteMany();
  await prisma.storeOperatingHours.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.storeCategory.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function createVendor(email: string, legalName: string) {
  const passwordHash = await bcrypt.hash('SecurePassword123!', 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: UserRole.VENDOR,
      firstName: 'Vendor',
      lastName: 'Owner',
      phone: '+923001112233',
      isActive: true,
      vendorProfile: {
        create: {
          businessLegalName: legalName,
          taxIdNumber: 'TAX-123456',
          bankAccountInfo: 'PK99MEZN0000123456789012',
        },
      },
    },
    include: { vendorProfile: true },
  });
  return user;
}

async function createCategory(name: string, slug: string) {
  return prisma.storeCategory.create({
    data: { name, slug },
  });
}

async function createProductCategory(name: string, slug: string) {
  return prisma.productCategory.create({
    data: { name, slug },
  });
}

/**
 * Helper to seed a store with full 7-day operating hours (00:00 - 23:59)
 * ensuring it is open at any time unless explicitly configured otherwise.
 */
async function createTestStore(params: {
  vendorProfileId: string;
  storeCategoryId: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  status?: StoreStatus;
  isActive?: boolean;
  isAcceptingOrders?: boolean;
  timezone?: string;
  baseDeliveryFee?: number;
  minOrderAmount?: number;
  closedToday?: boolean;
  specificHours?: { dayOfWeek: number; openingTime: string; closingTime: string; isClosed: boolean }[];
}) {
  const store = await prisma.store.create({
    data: {
      vendorProfileId: params.vendorProfileId,
      storeCategoryId: params.storeCategoryId,
      name: params.name,
      slug: params.slug,
      description: `Description for ${params.name}`,
      addressLine: `Main Street, Block A`,
      city: 'Lahore',
      latitude: params.latitude,
      longitude: params.longitude,
      deliveryRadiusKm: params.deliveryRadiusKm,
      baseDeliveryFee: params.baseDeliveryFee ?? 100.0,
      minOrderAmount: params.minOrderAmount ?? 500.0,
      status: params.status ?? StoreStatus.APPROVED,
      isActive: params.isActive ?? true,
      isAcceptingOrders: params.isAcceptingOrders ?? true,
      timezone: params.timezone ?? 'Asia/Karachi',
    },
  });

  if (params.specificHours) {
    await prisma.storeOperatingHours.createMany({
      data: params.specificHours.map((h) => ({
        storeId: store.id,
        dayOfWeek: h.dayOfWeek,
        openingTime: h.openingTime,
        closingTime: h.closingTime,
        isClosed: h.isClosed,
      })),
    });
  } else {
    // Seed default 7 days 00:00 - 23:59
    const hours = [];
    for (let day = 0; day <= 6; day++) {
      hours.push({
        storeId: store.id,
        dayOfWeek: day,
        openingTime: '00:00',
        closingTime: '23:59',
        isClosed: params.closedToday ? true : false,
      });
    }
    await prisma.storeOperatingHours.createMany({ data: hours });
  }

  return store;
}

describe('Phase 5: Customer Store Discovery & Marketplace', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // Base coordinates: Lahore Gulberg (31.5204, 74.3587)
  const CENTER_LAT = 31.5204;
  const CENTER_LON = 74.3587;

  // =========================================================================
  // 1. Spatial Eligibility
  // =========================================================================
  describe('Spatial Eligibility', () => {
    it('1. Store inside delivery radius is returned', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      // Store at Gulberg center with 10km radius
      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Gulberg Fresh Market',
        slug: 'gulberg-fresh-market',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      // Customer is ~1.5km away (31.5304, 74.3587)
      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: 31.5304, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0].storeId).toBe(store.id);
      expect(res.body.stores[0].distanceKm).toBeGreaterThan(0);
      expect(res.body.stores[0].distanceKm).toBeLessThan(2.0);
      expect(res.body.stores[0].isOpen).toBe(true);
      expect(res.body.stores[0].isAcceptingOrders).toBe(true);
    });

    it('2. Store outside delivery radius is excluded', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      // Store at Gulberg center with 3km radius
      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Neighborhood Mini Mart',
        slug: 'neighborhood-mini-mart',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 3.0,
      });

      // Customer is ~15km away (31.6500, 74.3587)
      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: 31.65, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('3. Store exactly on the radius boundary behaves consistently', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      // Store at 0, 0 with 5km delivery radius
      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Boundary Test Store',
        slug: 'boundary-test-store',
        latitude: 0,
        longitude: 0,
        deliveryRadiusKm: 5.0,
      });

      // Query distance of point (0, 0.0449155) to (0, 0)
      // In PostGIS, let's verify ST_DWithin on the boundary
      // Customer at (0, 0) is distance 0 (inside)
      const centerRes = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: 0, longitude: 0 });
      expect(centerRes.status).toBe(200);
      expect(centerRes.body.stores).toHaveLength(1);
      expect(centerRes.body.stores[0].distanceKm).toBe(0);

      // Customer at exactly 5km (latitude approx 0.04491576 degrees)
      // Query PostGIS directly to find the exact boundary latitude for 5000m
      const queryLatResult = await prisma.$queryRaw<{ lat: number }[]>`
        SELECT ST_Y(ST_Project(ST_MakePoint(0, 0)::geography, 5000, radians(0))::geometry) as lat
      `;
      const boundaryLat = queryLatResult[0]?.lat;

      if (boundaryLat !== undefined) {
        const boundaryRes = await request(app)
          .get('/api/v1/discovery/stores')
          .query({ latitude: boundaryLat, longitude: 0 });
        expect(boundaryRes.status).toBe(200);
        expect(boundaryRes.body.stores).toHaveLength(1);
        expect(boundaryRes.body.stores[0].distanceKm).toBeCloseTo(5.0, 1);
      }
    });

    it('4. Invalid latitude is rejected with 400', async () => {
      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: 95.0, longitude: CENTER_LON });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('5. Invalid longitude is rejected with 400', async () => {
      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: 185.0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  // =========================================================================
  // 2. Store Eligibility
  // =========================================================================
  describe('Store Eligibility Rules', () => {
    it('6. Pending store is excluded from customer discovery', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Pending Store',
        slug: 'pending-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.PENDING_APPROVAL,
        isActive: false,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('7. Rejected store is excluded from customer discovery', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Rejected Store',
        slug: 'rejected-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.REJECTED,
        isActive: false,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('8. Suspended store is excluded from customer discovery', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Suspended Store',
        slug: 'suspended-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.SUSPENDED,
        isActive: false,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('9. Inactive store is excluded even if approved', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Inactive Approved Store',
        slug: 'inactive-approved-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.APPROVED,
        isActive: false,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('10. Store not accepting orders is excluded', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Paused Orders Store',
        slug: 'paused-orders-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.APPROVED,
        isActive: true,
        isAcceptingOrders: false,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('11. Closed store is excluded based on operating hours', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      // Saturday 2026-09-19T05:00:00.000Z is 10:00 AM Karachi time (DOW=6)
      const referenceTime = '2026-09-19T05:00:00.000Z';

      // Store operating hours: only open 18:00 - 22:00 on Saturday (closed at 10:00 AM)
      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Night Owl Store',
        slug: 'night-owl-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        specificHours: [
          {
            dayOfWeek: 6,
            openingTime: '18:00',
            closingTime: '22:00',
            isClosed: false,
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON, referenceTime });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(0);
    });

    it('12. Approved, active, accepting, open store inside radius is returned', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Groceries', 'groceries');

      // Saturday 2026-09-19T05:00:00.000Z is 10:00 AM Karachi time (DOW=6)
      const referenceTime = '2026-09-19T05:00:00.000Z';

      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Fully Eligible Store',
        slug: 'fully-eligible-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.APPROVED,
        isActive: true,
        isAcceptingOrders: true,
        specificHours: [
          {
            dayOfWeek: 6,
            openingTime: '08:00',
            closingTime: '20:00',
            isClosed: false,
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON, referenceTime });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0].storeId).toBe(store.id);
      expect(res.body.stores[0].storeName).toBe('Fully Eligible Store');
      expect(res.body.stores[0].isOpen).toBe(true);
    });
  });

  // =========================================================================
  // 3. Category
  // =========================================================================
  describe('Store Category Filtering', () => {
    it('13. Store category filter works', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const catBakery = await createCategory('Bakery', 'bakery');
      const catPharmacy = await createCategory('Pharmacy', 'pharmacy');

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: catBakery.id,
        name: 'Warm Delights Bakery',
        slug: 'warm-delights-bakery',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: catPharmacy.id,
        name: 'City Care Pharmacy',
        slug: 'city-care-pharmacy',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      // Filter by Bakery
      const bakeryRes = await request(app)
        .get('/api/v1/discovery/stores')
        .query({
          latitude: CENTER_LAT,
          longitude: CENTER_LON,
          storeCategoryId: catBakery.id,
        });

      expect(bakeryRes.status).toBe(200);
      expect(bakeryRes.body.stores).toHaveLength(1);
      expect(bakeryRes.body.stores[0].storeName).toBe('Warm Delights Bakery');

      // Filter by Pharmacy
      const pharmRes = await request(app)
        .get('/api/v1/discovery/stores')
        .query({
          latitude: CENTER_LAT,
          longitude: CENTER_LON,
          storeCategoryId: catPharmacy.id,
        });

      expect(pharmRes.status).toBe(200);
      expect(pharmRes.body.stores).toHaveLength(1);
      expect(pharmRes.body.stores[0].storeName).toBe('City Care Pharmacy');
    });

    it('14. Invalid category is handled correctly', async () => {
      // Non-UUID category ID rejected with 400
      const invalidUuidRes = await request(app)
        .get('/api/v1/discovery/stores')
        .query({
          latitude: CENTER_LAT,
          longitude: CENTER_LON,
          storeCategoryId: 'invalid-category-id',
        });

      expect(invalidUuidRes.status).toBe(400);

      // Valid UUID but non-existent category returns empty list (200)
      const nonExistentRes = await request(app)
        .get('/api/v1/discovery/stores')
        .query({
          latitude: CENTER_LAT,
          longitude: CENTER_LON,
          storeCategoryId: '00000000-0000-0000-0000-000000000000',
        });

      expect(nonExistentRes.status).toBe(200);
      expect(nonExistentRes.body.stores).toHaveLength(0);
      expect(nonExistentRes.body.pagination.total).toBe(0);
    });
  });

  // =========================================================================
  // 4. Multi-Vendor Isolation
  // =========================================================================
  describe('Multi-Vendor Isolation', () => {
    it('15. Stores from multiple vendors can appear when they independently satisfy discovery criteria', async () => {
      const vendor1 = await createVendor('v1@test.com', 'Vendor Alpha');
      const vendor2 = await createVendor('v2@test.com', 'Vendor Beta');
      const cat = await createCategory('Electronics', 'electronics');

      await createTestStore({
        vendorProfileId: vendor1.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Alpha Tech Store',
        slug: 'alpha-tech-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      await createTestStore({
        vendorProfileId: vendor2.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Beta Gadgets Store',
        slug: 'beta-gadgets-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(2);
      const names = res.body.stores.map((s: any) => s.storeName);
      expect(names).toContain('Alpha Tech Store');
      expect(names).toContain('Beta Gadgets Store');
    });

    it('16. One vendor ownership does not restrict customer discovery', async () => {
      const vendor1 = await createVendor('v1@test.com', 'Vendor Alpha');
      const vendor2 = await createVendor('v2@test.com', 'Vendor Beta');
      const cat = await createCategory('Food', 'food');

      // Vendor 1 store is rejected, Vendor 2 store is approved
      await createTestStore({
        vendorProfileId: vendor1.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Vendor 1 Rejected Store',
        slug: 'v1-rejected-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.REJECTED,
      });

      await createTestStore({
        vendorProfileId: vendor2.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Vendor 2 Active Store',
        slug: 'v2-active-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.APPROVED,
        isActive: true,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0].storeName).toBe('Vendor 2 Active Store');
    });
  });

  // =========================================================================
  // 5. Pagination & Ordering
  // =========================================================================
  describe('Pagination & Ordering', () => {
    it('17. Page size is respected', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Books', 'books');

      // Create 5 stores at increasing distances
      for (let i = 1; i <= 5; i++) {
        await createTestStore({
          vendorProfileId: vendor.vendorProfile!.id,
          storeCategoryId: cat.id,
          name: `Store Number ${i}`,
          slug: `store-number-${i}`,
          latitude: CENTER_LAT + i * 0.005,
          longitude: CENTER_LON,
          deliveryRadiusKm: 20.0,
        });
      }

      // Query page 1 with pageSize = 2
      const page1Res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({
          latitude: CENTER_LAT,
          longitude: CENTER_LON,
          page: 1,
          pageSize: 2,
        });

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.stores).toHaveLength(2);
      expect(page1Res.body.pagination.page).toBe(1);
      expect(page1Res.body.pagination.pageSize).toBe(2);
      expect(page1Res.body.pagination.total).toBe(5);
      expect(page1Res.body.pagination.totalPages).toBe(3);
      expect(page1Res.body.pagination.hasNextPage).toBe(true);

      // Query page 3 with pageSize = 2
      const page3Res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({
          latitude: CENTER_LAT,
          longitude: CENTER_LON,
          page: 3,
          pageSize: 2,
        });

      expect(page3Res.status).toBe(200);
      expect(page3Res.body.stores).toHaveLength(1);
      expect(page3Res.body.pagination.hasNextPage).toBe(false);
      expect(page3Res.body.pagination.hasPrevPage).toBe(true);
    });

    it('18. Maximum page size is enforced', async () => {
      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({
          latitude: CENTER_LAT,
          longitude: CENTER_LON,
          pageSize: 100, // Exceeds max 50
        });

      expect(res.status).toBe(400);
      expect(res.body.details[0].message).toContain('cannot exceed 50');
    });

    it('19. Ordering is deterministic (distance ascending, store name)', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const cat = await createCategory('Clothing', 'clothing');

      // Create Store C (farthest: ~3.3km)
      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Store Far',
        slug: 'store-far',
        latitude: CENTER_LAT + 0.03,
        longitude: CENTER_LON,
        deliveryRadiusKm: 15.0,
      });

      // Create Store A (closest: ~0.55km)
      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Store Near',
        slug: 'store-near',
        latitude: CENTER_LAT + 0.005,
        longitude: CENTER_LON,
        deliveryRadiusKm: 15.0,
      });

      // Create Store B (mid: ~1.1km)
      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Store Mid',
        slug: 'store-mid',
        latitude: CENTER_LAT + 0.01,
        longitude: CENTER_LON,
        deliveryRadiusKm: 15.0,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(3);
      expect(res.body.stores[0].storeName).toBe('Store Near');
      expect(res.body.stores[1].storeName).toBe('Store Mid');
      expect(res.body.stores[2].storeName).toBe('Store Far');

      // Verify distance is monotonically increasing
      expect(res.body.stores[0].distanceKm).toBeLessThanOrEqual(res.body.stores[1].distanceKm);
      expect(res.body.stores[1].distanceKm).toBeLessThanOrEqual(res.body.stores[2].distanceKm);
    });
  });

  // =========================================================================
  // 6. Products
  // =========================================================================
  describe('Customer Store Product Browsing', () => {
    it('20. Inactive products are not exposed through customer browsing', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const storeCat = await createCategory('Food', 'food');
      const prodCat = await createProductCategory('Organic', 'organic');

      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: storeCat.id,
        name: 'Green Foods',
        slug: 'green-foods',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      // Active product
      await prisma.product.create({
        data: {
          storeId: store.id,
          productCategoryId: prodCat.id,
          name: 'Active Organic Apples',
          slug: 'active-organic-apples',
          price: 250.0,
          stockQuantity: 20,
          isActive: true,
        },
      });

      // Inactive product
      await prisma.product.create({
        data: {
          storeId: store.id,
          productCategoryId: prodCat.id,
          name: 'Hidden Inactive Mangoes',
          slug: 'hidden-inactive-mangoes',
          price: 500.0,
          stockQuantity: 10,
          isActive: false,
        },
      });

      const res = await request(app).get(`/api/v1/discovery/stores/${store.id}/products`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].name).toBe('Active Organic Apples');
    });

    it('21. Active products belong strictly to the selected store', async () => {
      const vendor = await createVendor('v1@test.com', 'Vendor 1');
      const storeCat = await createCategory('Market', 'market');
      const prodCat = await createProductCategory('Produce', 'produce');

      const store1 = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: storeCat.id,
        name: 'Store One',
        slug: 'store-one',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      const store2 = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: storeCat.id,
        name: 'Store Two',
        slug: 'store-two',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      await prisma.product.create({
        data: {
          storeId: store1.id,
          productCategoryId: prodCat.id,
          name: 'Store 1 Milk',
          slug: 'store-1-milk',
          price: 150.0,
          stockQuantity: 50,
          isActive: true,
        },
      });

      await prisma.product.create({
        data: {
          storeId: store2.id,
          productCategoryId: prodCat.id,
          name: 'Store 2 Bread',
          slug: 'store-2-bread',
          price: 120.0,
          stockQuantity: 30,
          isActive: true,
        },
      });

      const res = await request(app).get(`/api/v1/discovery/stores/${store1.id}/products`);

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].name).toBe('Store 1 Milk');
      expect(res.body.products[0].storeId).toBe(store1.id);
    });
  });

  // =========================================================================
  // 7. Security & Privacy
  // =========================================================================
  describe('Security & Information Privacy', () => {
    it('22. Customer discovery cannot expose private vendor/store information', async () => {
      const vendor = await createVendor('secret-vendor@test.com', 'Secret Holding Ltd');
      const storeCat = await createCategory('Services', 'services');

      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: storeCat.id,
        name: 'Customer Facing Store',
        slug: 'customer-facing-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      // Query discovery list
      const listRes = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(listRes.status).toBe(200);
      const returnedStore = listRes.body.stores[0];

      // Must NOT expose private vendor info, bank details, tax ID, or user email
      expect(returnedStore.vendorProfile).toBeUndefined();
      expect(returnedStore.taxIdNumber).toBeUndefined();
      expect(returnedStore.bankAccountInfo).toBeUndefined();
      expect(returnedStore.rejectionReason).toBeUndefined();
      expect(returnedStore.suspensionReason).toBeUndefined();

      // Query single store endpoint
      const singleRes = await request(app).get(`/api/v1/discovery/stores/${store.id}`);
      expect(singleRes.status).toBe(200);
      const detailStore = singleRes.body.store;
      expect(detailStore.vendorProfile).toBeUndefined();
      expect(detailStore.taxIdNumber).toBeUndefined();
      expect(detailStore.bankAccountInfo).toBeUndefined();
    });

    it('23. Unauthorized administrative/vendor data cannot be requested through customer endpoints', async () => {
      const vendor = await createVendor('hidden-vendor@test.com', 'Hidden Corp');
      const storeCat = await createCategory('Retail', 'retail');

      // Suspended store
      const suspendedStore = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: storeCat.id,
        name: 'Fraudulent Store',
        slug: 'fraudulent-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
        status: StoreStatus.SUSPENDED,
        isActive: false,
      });

      // Customer discovery detail endpoint must return 404 for suspended/unapproved stores
      const res = await request(app).get(`/api/v1/discovery/stores/${suspendedStore.id}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();

      // Products endpoint must also return 404 for suspended/unapproved stores
      const prodRes = await request(app).get(`/api/v1/discovery/stores/${suspendedStore.id}/products`);
      expect(prodRes.status).toBe(404);
    });

    it('24. Store belonging to a deactivated category is excluded from discovery and detail', async () => {
      const vendor = await createVendor('cat-vendor@test.com', 'Deactivated Category Vendor');
      const activeCat = await createCategory('Active Category', 'active-cat');
      const inactiveCat = await prisma.storeCategory.create({
        data: { name: 'Deactivated Category', slug: 'deactivated-cat', isActive: false },
      });

      const storeInActiveCat = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: activeCat.id,
        name: 'Discoverable Store',
        slug: 'discoverable-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      const storeInInactiveCat = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: inactiveCat.id,
        name: 'Hidden Category Store',
        slug: 'hidden-category-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      const listRes = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(listRes.status).toBe(200);
      expect(listRes.body.stores).toHaveLength(1);
      expect(listRes.body.stores[0].storeId).toBe(storeInActiveCat.id);
      expect(listRes.body.pagination.total).toBe(1);

      // Detail endpoint also rejects store with inactive category
      const detailRes = await request(app).get(`/api/v1/discovery/stores/${storeInInactiveCat.id}`);
      expect(detailRes.status).toBe(404);
    });

    it('25. Store with non-standard timezone in DB does not crash discovery query', async () => {
      const vendor = await createVendor('tz-vendor@test.com', 'Timezone Vendor');
      const cat = await createCategory('Timezone Category', 'timezone-cat');

      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Timezone Resilient Store',
        slug: 'tz-resilient-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      // Tamper store timezone directly in DB to simulate malformed/legacy data
      await prisma.store.update({
        where: { id: store.id },
        data: { timezone: 'Nonexistent/Invalid_Timezone' },
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      // Must succeed with 200 without throwing PostgreSQL 500 error
      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0].storeId).toBe(store.id);
    });

    it('26. Store detail computes distanceKm when coordinates are provided', async () => {
      const vendor = await createVendor('dist-vendor@test.com', 'Distance Vendor');
      const cat = await createCategory('Distance Cat', 'distance-cat');

      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Distance Detail Store',
        slug: 'dist-detail-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      // Query store detail with customer coordinates ~1.1km away
      const res = await request(app)
        .get(`/api/v1/discovery/stores/${store.id}`)
        .query({ latitude: CENTER_LAT + 0.01, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.store.storeId).toBe(store.id);
      expect(res.body.store.distanceKm).toBeGreaterThan(0.9);
      expect(res.body.store.distanceKm).toBeLessThan(1.3);
      expect(res.body.store.timezone).toBe('Asia/Karachi');
    });

    it('27. Invalid coordinates on store detail endpoint are rejected with 400', async () => {
      const vendor = await createVendor('coord-err@test.com', 'Coord Error Vendor');
      const cat = await createCategory('Coord Cat', 'coord-cat');

      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'Coord Test Store',
        slug: 'coord-test-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      const res = await request(app)
        .get(`/api/v1/discovery/stores/${store.id}`)
        .query({ latitude: 120.0, longitude: CENTER_LON });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid coordinates provided');
    });

    it('28. Store search safely escapes SQL wildcards (% and _)', async () => {
      const vendor = await createVendor('search-vendor@test.com', 'Search Vendor');
      const cat = await createCategory('Search Cat', 'search-cat');

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: '100% Organic Produce',
        slug: '100-organic-produce',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: 'General 500 Store',
        slug: 'general-500-store',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      // Search for literal '100%' should ONLY return '100% Organic Produce'
      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON, search: '100%' });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0].storeName).toBe('100% Organic Produce');
    });

    it('29. Discovery query without referenceTime uses live current time successfully', async () => {
      const vendor = await createVendor('realtime-vendor@test.com', 'Realtime Vendor');
      const cat = await createCategory('Realtime Cat', 'realtime-cat');

      // Seed store open 24/7 (00:00 - 23:59 everyday)
      const store = await createTestStore({
        vendorProfileId: vendor.vendorProfile!.id,
        storeCategoryId: cat.id,
        name: '24/7 Express Mart',
        slug: '247-express-mart',
        latitude: CENTER_LAT,
        longitude: CENTER_LON,
        deliveryRadiusKm: 10.0,
      });

      const res = await request(app)
        .get('/api/v1/discovery/stores')
        .query({ latitude: CENTER_LAT, longitude: CENTER_LON });

      expect(res.status).toBe(200);
      expect(res.body.stores).toHaveLength(1);
      expect(res.body.stores[0].storeId).toBe(store.id);
      expect(res.body.stores[0].isOpen).toBe(true);
    });
  });
});
