import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole, StoreStatus } from '@geomarket/shared';

const app = createApp();

const SAMPLE_STORE = {
  name: 'Gourmet Delights Bakery',
  description: 'Artisanal sourdough and pastries',
  addressLine: '15 Main Boulevard, Gulberg III',
  city: 'Lahore',
  latitude: 31.5204,
  longitude: 74.3587,
  deliveryRadiusKm: 10,
  baseDeliveryFee: 100,
  minOrderAmount: 200,
  timezone: 'Asia/Karachi',
};

const SAMPLE_PRODUCT = {
  name: 'Artisan Sourdough Bread',
  description: 'Naturally fermented 48h sourdough loaf',
  price: 450.0,
  stockQuantity: 25,
  sku: 'SOUR-001',
  unit: 'loaf',
  imageUrl: 'https://images.example.com/sourdough.jpg',
  isActive: true,
};

async function cleanDatabase() {
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderAddressSnapshot.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.storeOperatingHours.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.storeCategory.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function registerVendor(email: string, legalName: string) {
  const res = await request(app)
    .post('/api/v1/auth/register/vendor')
    .send({
      email,
      password: 'SecurePassword123!',
      firstName: 'Ahmed',
      lastName: 'Khan',
      phone: '+923001112233',
      businessLegalName: legalName,
    });

  const cookie = res.headers['set-cookie'];
  return { user: res.body.user, cookie };
}

async function registerCustomer(email: string) {
  const res = await request(app)
    .post('/api/v1/auth/register/customer')
    .send({
      email,
      password: 'SecurePassword123!',
      firstName: 'Customer',
      lastName: 'Buyer',
      phone: '+923009998877',
    });

  const cookie = res.headers['set-cookie'];
  return { user: res.body.user, cookie };
}

async function createAdminUser() {
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin.products@geomarket.test',
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+923000000000',
      isActive: true,
    },
  });

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'admin.products@geomarket.test',
      password: 'AdminPassword123!',
    });

  const cookie = res.headers['set-cookie'];
  return { user, cookie };
}

async function createStoreCategory(name = 'Bakery Category') {
  return prisma.storeCategory.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    },
  });
}

async function createProductCategory(name = 'Bakery Items') {
  return prisma.productCategory.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: 'Baked goods and breads',
    },
  });
}

async function createApprovedStoreForVendor(vendorCookie: string[], storeCategory: any, name = 'Vendor Main Store') {
  const res = await request(app)
    .post('/api/v1/vendor/stores')
    .set('Cookie', vendorCookie)
    .send({
      ...SAMPLE_STORE,
      name,
      storeCategoryId: storeCategory.id,
    });

  const storeId = res.body.store.id;

  // Approve store in DB for realism
  await prisma.store.update({
    where: { id: storeId },
    data: {
      status: StoreStatus.APPROVED,
      isActive: true,
    },
  });

  return storeId;
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe('Phase 4: Products & Inventory Management', () => {
  // =========================================================================
  // 1. Product Ownership & Multi-Tenant Isolation
  // =========================================================================
  describe('Product Ownership & Tenant Isolation', () => {
    it('1. Vendor can create product in own store', async () => {
      const { cookie: vendorCookie } = await registerVendor('v1@test.com', 'Vendor 1 Bakery');
      const storeCat = await createStoreCategory('Store Cat 1');
      const prodCat = await createProductCategory('Breads & Loaves');
      const storeId = await createApprovedStoreForVendor(vendorCookie, storeCat);

      const res = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.product).toBeDefined();
      expect(res.body.product.name).toBe(SAMPLE_PRODUCT.name);
      expect(res.body.product.slug).toBe('artisan-sourdough-bread');
      expect(res.body.product.price).toBe(450.0);
      expect(res.body.product.stockQuantity).toBe(25);
      expect(res.body.product.isActive).toBe(true);
      expect(res.body.product.storeId).toBe(storeId);
      expect(res.body.product.productCategoryId).toBe(prodCat.id);
    });

    it("2. Vendor cannot create product in another vendor's store (404 tenant isolation)", async () => {
      const { cookie: vendor1Cookie } = await registerVendor('v1.iso@test.com', 'Vendor One');
      const { cookie: vendor2Cookie } = await registerVendor('v2.iso@test.com', 'Vendor Two');
      const storeCat = await createStoreCategory('Store Cat Iso');
      const prodCat = await createProductCategory('Bakery Iso');

      // Vendor 1 creates store
      const store1Id = await createApprovedStoreForVendor(vendor1Cookie, storeCat, 'Store Vendor 1');

      // Vendor 2 attempts to create product in Vendor 1 store
      const res = await request(app)
        .post(`/api/v1/vendor/stores/${store1Id}/products`)
        .set('Cookie', vendor2Cookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/store not found/i);
    });

    it('3. Vendor can update own product', async () => {
      const { cookie: vendorCookie } = await registerVendor('v.update@test.com', 'Update Bakery');
      const storeCat = await createStoreCategory('Store Cat Up');
      const prodCat = await createProductCategory('Cat Up');
      const storeId = await createApprovedStoreForVendor(vendorCookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      const updateRes = await request(app)
        .put(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', vendorCookie)
        .send({
          name: 'Artisan Multigrain Sourdough',
          price: 520.0,
          description: 'Enriched with organic seeds',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.product.name).toBe('Artisan Multigrain Sourdough');
      expect(updateRes.body.product.slug).toBe('artisan-multigrain-sourdough');
      expect(updateRes.body.product.price).toBe(520.0);
      expect(updateRes.body.product.description).toBe('Enriched with organic seeds');
    });

    it("4. Vendor cannot update another vendor's product (404 tenant isolation)", async () => {
      const { cookie: vendor1Cookie } = await registerVendor('v1.put@test.com', 'Vendor 1 Put');
      const { cookie: vendor2Cookie } = await registerVendor('v2.put@test.com', 'Vendor 2 Put');
      const storeCat = await createStoreCategory('Cat Put S');
      const prodCat = await createProductCategory('Cat Put P');

      const store1Id = await createApprovedStoreForVendor(vendor1Cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${store1Id}/products`)
        .set('Cookie', vendor1Cookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // Vendor 2 attempts to update Vendor 1's product
      const res = await request(app)
        .put(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', vendor2Cookie)
        .send({
          name: 'Hacked Product Name',
          price: 1.0,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/product not found/i);

      // Verify product was not modified in DB
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.name).toBe(SAMPLE_PRODUCT.name);
    });

    it("5. Vendor cannot delete another vendor's product (404 tenant isolation)", async () => {
      const { cookie: vendor1Cookie } = await registerVendor('v1.del@test.com', 'Vendor 1 Del');
      const { cookie: vendor2Cookie } = await registerVendor('v2.del@test.com', 'Vendor 2 Del');
      const storeCat = await createStoreCategory('Cat Del S');
      const prodCat = await createProductCategory('Cat Del P');

      const store1Id = await createApprovedStoreForVendor(vendor1Cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${store1Id}/products`)
        .set('Cookie', vendor1Cookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // Vendor 2 attempts to delete Vendor 1's product
      const res = await request(app)
        .delete(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', vendor2Cookie);

      expect(res.status).toBe(404);

      // Verify product still exists
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct).not.toBeNull();

      // Vendor 1 can delete their own product
      const deleteRes = await request(app)
        .delete(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', vendor1Cookie);

      expect(deleteRes.status).toBe(200);
      const dbProductAfter = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProductAfter).toBeNull();
    });
  });

  // =========================================================================
  // 2. Validation & Invariants
  // =========================================================================
  describe('Validation & Invariants', () => {
    it('6. Negative price rejected (400)', async () => {
      const { cookie } = await registerVendor('neg.price@test.com', 'Price Bakery');
      const storeCat = await createStoreCategory('Store Cat Val');
      const prodCat = await createProductCategory('Prod Cat Val');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const res = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          price: -10,
          productCategoryId: prodCat.id,
        });

      expect(res.status).toBe(400);
    });

    it('7. Negative stock rejected on create and update (400)', async () => {
      const { cookie } = await registerVendor('neg.stock@test.com', 'Stock Bakery');
      const storeCat = await createStoreCategory('Store Cat Stock');
      const prodCat = await createProductCategory('Prod Cat Stock');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      // On create
      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: -5,
          productCategoryId: prodCat.id,
        });

      expect(createRes.status).toBe(400);

      // Create valid product first
      const validCreate = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 10,
          productCategoryId: prodCat.id,
        });

      const productId = validCreate.body.product.id;

      // On update
      const updateRes = await request(app)
        .put(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', cookie)
        .send({ stockQuantity: -1 });

      expect(updateRes.status).toBe(400);
    });

    it('8. Invalid category rejected (400)', async () => {
      const { cookie } = await registerVendor('inv.cat@test.com', 'Cat Bakery');
      const storeCat = await createStoreCategory('Store Cat Inv');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const res = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: '00000000-0000-0000-0000-000000000000',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/category not found/i);
    });

    it('9. Invalid store rejected (404/400)', async () => {
      const { cookie } = await registerVendor('inv.store@test.com', 'Store Bakery');
      const prodCat = await createProductCategory('Prod Cat InvS');

      // Non-existent UUID store -> 404
      const res404 = await request(app)
        .post('/api/v1/vendor/stores/00000000-0000-0000-0000-000000000000/products')
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      expect(res404.status).toBe(404);

      // Malformed non-UUID store -> 400
      const res400 = await request(app)
        .post('/api/v1/vendor/stores/not-a-uuid/products')
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      expect(res400.status).toBe(400);
    });

    it('10. Empty/invalid product name rejected (400)', async () => {
      const { cookie } = await registerVendor('inv.name@test.com', 'Name Bakery');
      const storeCat = await createStoreCategory('Store Cat Name');
      const prodCat = await createProductCategory('Prod Cat Name');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      // Empty name
      const emptyRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          name: '',
          productCategoryId: prodCat.id,
        });
      expect(emptyRes.status).toBe(400);

      // Whitespace only name
      const whitespaceRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          name: '   ',
          productCategoryId: prodCat.id,
        });
      expect(whitespaceRes.status).toBe(400);
    });

    it('composite uniqueness: duplicate names in same store get collision-resistant slug; same name across different stores allowed', async () => {
      const { cookie: vendor1Cookie } = await registerVendor('slug.v1@test.com', 'Slug Vendor');
      const { cookie: vendor2Cookie } = await registerVendor('slug.v2@test.com', 'Slug Vendor 2');
      const storeCat = await createStoreCategory('Store Cat Slug');
      const prodCat = await createProductCategory('Prod Cat Slug');

      const store1Id = await createApprovedStoreForVendor(vendor1Cookie, storeCat, 'Bakery A');
      const store2Id = await createApprovedStoreForVendor(vendor2Cookie, storeCat, 'Bakery B');

      // Product 1 in Store 1
      const p1Res = await request(app)
        .post(`/api/v1/vendor/stores/${store1Id}/products`)
        .set('Cookie', vendor1Cookie)
        .send({
          ...SAMPLE_PRODUCT,
          name: 'Chocolate Fudge Cake',
          productCategoryId: prodCat.id,
        });
      expect(p1Res.body.product.slug).toBe('chocolate-fudge-cake');

      // Product 2 in same Store 1 with duplicate name -> slug collision handled
      const p2Res = await request(app)
        .post(`/api/v1/vendor/stores/${store1Id}/products`)
        .set('Cookie', vendor1Cookie)
        .send({
          ...SAMPLE_PRODUCT,
          name: 'Chocolate Fudge Cake',
          productCategoryId: prodCat.id,
        });
      expect(p2Res.body.product.slug).toBe('chocolate-fudge-cake-2');

      // Product 3 in different Store 2 with same name -> allowed with base slug
      const p3Res = await request(app)
        .post(`/api/v1/vendor/stores/${store2Id}/products`)
        .set('Cookie', vendor2Cookie)
        .send({
          ...SAMPLE_PRODUCT,
          name: 'Chocolate Fudge Cake',
          productCategoryId: prodCat.id,
        });
      expect(p3Res.body.product.slug).toBe('chocolate-fudge-cake');
    });
  });

  // =========================================================================
  // 3. Inventory Operations & Concurrency Safety
  // =========================================================================
  describe('Inventory Operations & Concurrency Safety', () => {
    it('11. Stock can be increased (INCREMENT)', async () => {
      const { cookie } = await registerVendor('inv.inc@test.com', 'Inc Bakery');
      const storeCat = await createStoreCategory('Cat Inc S');
      const prodCat = await createProductCategory('Cat Inc P');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 25,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      const incRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', cookie)
        .send({
          operation: 'INCREMENT',
          quantity: 10,
        });

      expect(incRes.status).toBe(200);
      expect(incRes.body.product.stockQuantity).toBe(35);

      // Verify in DB
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.stockQuantity).toBe(35);
    });

    it('12. Stock can be decreased (DECREMENT)', async () => {
      const { cookie } = await registerVendor('inv.dec@test.com', 'Dec Bakery');
      const storeCat = await createStoreCategory('Cat Dec S');
      const prodCat = await createProductCategory('Cat Dec P');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 25,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      const decRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', cookie)
        .send({
          operation: 'DECREMENT',
          quantity: 5,
        });

      expect(decRes.status).toBe(200);
      expect(decRes.body.product.stockQuantity).toBe(20);

      // Verify SET stock also works
      const setRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', cookie)
        .send({
          operation: 'SET',
          quantity: 40,
        });

      expect(setRes.status).toBe(200);
      expect(setRes.body.product.stockQuantity).toBe(40);
    });

    it('13. Stock cannot become negative (400 validation/business error)', async () => {
      const { cookie } = await registerVendor('inv.neg@test.com', 'Neg Bakery');
      const storeCat = await createStoreCategory('Cat Neg S');
      const prodCat = await createProductCategory('Cat Neg P');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 10,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // Try to decrement by 15 when stock is 10
      const res = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', cookie)
        .send({
          operation: 'DECREMENT',
          quantity: 15,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot be negative/i);

      // Stock should remain unchanged at 10
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.stockQuantity).toBe(10);
    });

    it('14. Concurrent inventory modification remains consistent under race condition', async () => {
      const { cookie } = await registerVendor('inv.race@test.com', 'Race Bakery');
      const storeCat = await createStoreCategory('Cat Race S');
      const prodCat = await createProductCategory('Cat Race P');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      // Initial stock = 5
      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 5,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // Send 10 concurrent requests to decrement by 1
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .patch(`/api/v1/vendor/products/${productId}/stock`)
          .set('Cookie', cookie)
          .send({
            operation: 'DECREMENT',
            quantity: 1,
          }),
      );

      const results = await Promise.all(requests);

      const succeeded = results.filter((r) => r.status === 200);
      const failed = results.filter((r) => r.status === 400);

      // Exactly 5 requests must succeed and 5 must fail with insufficient stock
      expect(succeeded).toHaveLength(5);
      expect(failed).toHaveLength(5);

      // Final stock must be exactly 0 (never negative)
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.stockQuantity).toBe(0);
    });

    it('15. Transaction rollback leaves stock unchanged after failure', async () => {
      const { cookie } = await registerVendor('inv.roll@test.com', 'Rollback Bakery');
      const storeCat = await createStoreCategory('Cat Roll S');
      const prodCat = await createProductCategory('Cat Roll P');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 12,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // Attempt invalid stock operation
      const failRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', cookie)
        .send({
          operation: 'DECREMENT',
          quantity: 20,
        });

      expect(failRes.status).toBe(400);

      // Verify stock in database remains exactly 12
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.stockQuantity).toBe(12);
    });
  });

  // =========================================================================
  // 4. Product Lifecycle
  // =========================================================================
  describe('Product Lifecycle', () => {
    it('16. Product can be activated/deactivated', async () => {
      const { cookie } = await registerVendor('v.life@test.com', 'Lifecycle Bakery');
      const storeCat = await createStoreCategory('Cat Life S');
      const prodCat = await createProductCategory('Cat Life P');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          isActive: true,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;
      expect(createRes.body.product.isActive).toBe(true);

      // Deactivate product
      const deactRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/active`)
        .set('Cookie', cookie)
        .send({ isActive: false });

      expect(deactRes.status).toBe(200);
      expect(deactRes.body.product.isActive).toBe(false);

      // Verify in DB
      let dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.isActive).toBe(false);

      // Toggle back to active
      const reactRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/active`)
        .set('Cookie', cookie)
        .send({ isActive: true });

      expect(reactRes.status).toBe(200);
      expect(reactRes.body.product.isActive).toBe(true);

      dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.isActive).toBe(true);
    });

    it('17. Inactive product is not treated as purchasable (flag verification)', async () => {
      const { cookie } = await registerVendor('v.inactive@test.com', 'Inactive Bakery');
      const storeCat = await createStoreCategory('Cat Inact S');
      const prodCat = await createProductCategory('Cat Inact P');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          isActive: false,
          productCategoryId: prodCat.id,
        });

      expect(createRes.body.product.isActive).toBe(false);

      // Verify filter by isActive on vendor listing
      const listActiveRes = await request(app)
        .get(`/api/v1/vendor/products?isActive=true`)
        .set('Cookie', cookie);

      expect(listActiveRes.status).toBe(200);
      expect(listActiveRes.body.products).toHaveLength(0);

      const listInactiveRes = await request(app)
        .get(`/api/v1/vendor/products?isActive=false`)
        .set('Cookie', cookie);

      expect(listInactiveRes.status).toBe(200);
      expect(listInactiveRes.body.products).toHaveLength(1);
    });

    it('18. Customer cannot access vendor-management operations (403)', async () => {
      const { cookie: vendorCookie } = await registerVendor('v.custblock@test.com', 'Cust Block Bakery');
      const { cookie: customerCookie } = await registerCustomer('cust.blocked@test.com');
      const storeCat = await createStoreCategory('Cat Block S');
      const prodCat = await createProductCategory('Cat Block P');
      const storeId = await createApprovedStoreForVendor(vendorCookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // Customer tries to list vendor products -> 403
      const listRes = await request(app)
        .get('/api/v1/vendor/products')
        .set('Cookie', customerCookie);
      expect(listRes.status).toBe(403);

      // Customer tries to create product -> 403
      const custCreateRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', customerCookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });
      expect(custCreateRes.status).toBe(403);

      // Customer tries to update stock -> 403
      const custStockRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', customerCookie)
        .send({ operation: 'SET', quantity: 999 });
      expect(custStockRes.status).toBe(403);

      // Customer tries to delete product -> 403
      const custDelRes = await request(app)
        .delete(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', customerCookie);
      expect(custDelRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 5. RBAC & Taxonomy Integration
  // =========================================================================
  describe('RBAC & Category Taxonomy Integration', () => {
    it('19. CUSTOMER cannot manage products or stock (403)', async () => {
      const { cookie: customerCookie } = await registerCustomer('cust.rbac@test.com');

      const res = await request(app)
        .get('/api/v1/vendor/stores/00000000-0000-0000-0000-000000000000/products')
        .set('Cookie', customerCookie);

      expect(res.status).toBe(403);
    });

    it('20. ADMIN access follows existing admin model: cannot inherit vendor ownership', async () => {
      const { cookie: adminCookie } = await createAdminUser();
      const storeCat = await createStoreCategory('Store Cat Admin');
      const prodCat = await createProductCategory('Prod Cat Admin');

      // Admin calling vendor product endpoint -> 403 (Admin is not a Vendor)
      const res = await request(app)
        .get('/api/v1/vendor/products')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(403);

      // Admin cannot create vendor product directly via vendor route
      const createRes = await request(app)
        .post('/api/v1/vendor/stores/00000000-0000-0000-0000-000000000000/products')
        .set('Cookie', adminCookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      expect(createRes.status).toBe(403);
    });

    it('Product category cannot be deleted by admin if referenced by existing products (409 CATEGORY_IN_USE)', async () => {
      const { cookie: vendorCookie } = await registerVendor('v.catdel@test.com', 'Cat Del Bakery');
      const { cookie: adminCookie } = await createAdminUser();
      const storeCat = await createStoreCategory('Cat Del Store');
      const prodCat = await createProductCategory('In Use Prod Cat');
      const storeId = await createApprovedStoreForVendor(vendorCookie, storeCat);

      // Vendor creates product referencing this category
      await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      // Admin attempts to delete product category -> 409
      const delRes = await request(app)
        .delete(`/api/v1/admin/categories/products/${prodCat.id}`)
        .set('Cookie', adminCookie);

      expect(delRes.status).toBe(409);
      expect(delRes.body.error).toMatch(/cannot delete category that has products/i);
    });
  });

  // =========================================================================
  // 6. Deep Verification: Extended Multi-Tenant Isolation & Edge Cases
  // =========================================================================
  describe('Extended Multi-Tenant Isolation & Store Eligibility', () => {
    it('Vendor cannot read, toggle active, or adjust stock on another vendor\'s product/store (404)', async () => {
      const { cookie: vendor1Cookie } = await registerVendor('v1.iso.ext@test.com', 'Vendor 1 Iso Ext');
      const { cookie: vendor2Cookie } = await registerVendor('v2.iso.ext@test.com', 'Vendor 2 Iso Ext');
      const storeCat = await createStoreCategory('Store Cat Iso Ext');
      const prodCat = await createProductCategory('Prod Cat Iso Ext');
      const store1Id = await createApprovedStoreForVendor(vendor1Cookie, storeCat, 'Store 1 Iso Ext');

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${store1Id}/products`)
        .set('Cookie', vendor1Cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 50,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // 1. Vendor 2 cannot read product by ID -> 404
      const getRes = await request(app)
        .get(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', vendor2Cookie);
      expect(getRes.status).toBe(404);

      // 2. Vendor 2 cannot list store products for Vendor 1 store -> 404
      const listStoreRes = await request(app)
        .get(`/api/v1/vendor/stores/${store1Id}/products`)
        .set('Cookie', vendor2Cookie);
      expect(listStoreRes.status).toBe(404);

      // 3. Vendor 2 cannot toggle active -> 404
      const toggleRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/active`)
        .set('Cookie', vendor2Cookie)
        .send({ isActive: false });
      expect(toggleRes.status).toBe(404);

      // 4. Vendor 2 cannot update stock -> 404
      const stockRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', vendor2Cookie)
        .send({ operation: 'DECREMENT', quantity: 5 });
      expect(stockRes.status).toBe(404);

      // Verify stock remained 50
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.stockQuantity).toBe(50);
      expect(dbProduct?.isActive).toBe(true);
    });

    it('Validation on update: invalid category ID rejected (400) and invalid isActive format rejected (400)', async () => {
      const { cookie } = await registerVendor('v.val.ext@test.com', 'Val Ext Bakery');
      const storeCat = await createStoreCategory('Store Cat Val Ext');
      const prodCat = await createProductCategory('Prod Cat Val Ext');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // Update with nonexistent category UUID -> 400
      const badCatRes = await request(app)
        .put(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', cookie)
        .send({ productCategoryId: '00000000-0000-0000-0000-000000000000' });
      expect(badCatRes.status).toBe(400);
      expect(badCatRes.body.error).toMatch(/category not found/i);

      // Toggle active with non-boolean payload -> 400
      const badActiveRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/active`)
        .set('Cookie', cookie)
        .send({ isActive: 'not_a_boolean' });
      expect(badActiveRes.status).toBe(400);
      expect(badActiveRes.body.error).toMatch(/validation failed/i);
    });

    it('Requirement 14 Store Eligibility: products can be managed in stores with PENDING_APPROVAL, REJECTED, or SUSPENDED status', async () => {
      const { cookie } = await registerVendor('v.eligibility@test.com', 'Eligibility Bakery');
      const storeCat = await createStoreCategory('Store Cat Elig');
      const prodCat = await createProductCategory('Prod Cat Elig');

      // Create store initially in PENDING_APPROVAL
      const storeRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_STORE,
          name: 'Pending Store',
          storeCategoryId: storeCat.id,
        });

      const storeId = storeRes.body.store.id;

      // Vendor can create product in PENDING_APPROVAL store
      const prodPending = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          name: 'Pending Store Loaf',
          productCategoryId: prodCat.id,
        });
      expect(prodPending.status).toBe(201);
      const productId = prodPending.body.product.id;

      // Admin rejects store -> status becomes REJECTED
      await prisma.store.update({
        where: { id: storeId },
        data: { status: StoreStatus.REJECTED, rejectionReason: 'Needs better license' },
      });

      // Vendor can still update stock in REJECTED store
      const stockRes = await request(app)
        .patch(`/api/v1/vendor/products/${productId}/stock`)
        .set('Cookie', cookie)
        .send({ operation: 'INCREMENT', quantity: 15 });
      expect(stockRes.status).toBe(200);
      expect(stockRes.body.product.stockQuantity).toBe(40);

      // Admin suspends store -> status becomes SUSPENDED
      await prisma.store.update({
        where: { id: storeId },
        data: { status: StoreStatus.SUSPENDED, suspensionReason: 'Temporary review' },
      });

      // Vendor can still update product details in SUSPENDED store
      const updateRes = await request(app)
        .put(`/api/v1/vendor/products/${productId}`)
        .set('Cookie', cookie)
        .send({ description: 'Updated while suspended' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.product.description).toBe('Updated while suspended');
    });

    it('High-contention mixed concurrency: simultaneous interleaved increments and decrements preserve exact inventory balance', async () => {
      const { cookie } = await registerVendor('v.mixed.concurrency@test.com', 'Mixed Concurrency Bakery');
      const storeCat = await createStoreCategory('Store Cat Mixed');
      const prodCat = await createProductCategory('Prod Cat Mixed');
      const storeId = await createApprovedStoreForVendor(cookie, storeCat);

      // Start with stock = 10
      const createRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/products`)
        .set('Cookie', cookie)
        .send({
          ...SAMPLE_PRODUCT,
          stockQuantity: 10,
          productCategoryId: prodCat.id,
        });

      const productId = createRes.body.product.id;

      // 10 concurrent increments of +3 (= +30)
      const increments = Array.from({ length: 10 }, () =>
        request(app)
          .patch(`/api/v1/vendor/products/${productId}/stock`)
          .set('Cookie', cookie)
          .send({ operation: 'INCREMENT', quantity: 3 }),
      );

      // 10 concurrent decrements of -2 (= -20)
      const decrements = Array.from({ length: 10 }, () =>
        request(app)
          .patch(`/api/v1/vendor/products/${productId}/stock`)
          .set('Cookie', cookie)
          .send({ operation: 'DECREMENT', quantity: 2 }),
      );

      // Interleave both sets of requests in parallel
      const mixedRequests = [...increments, ...decrements].sort(() => Math.random() - 0.5);
      const responses = await Promise.all(mixedRequests);

      // All 20 requests must succeed with 200
      const successes = responses.filter((r) => r.status === 200);
      expect(successes).toHaveLength(20);

      // Final stock must be exactly: 10 + (10 * 3) - (10 * 2) = 10 + 30 - 20 = 20
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.stockQuantity).toBe(20);
    });
  });
});

