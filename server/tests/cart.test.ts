import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole, StoreStatus } from '@geomarket/shared';

const app = createApp();

const SAMPLE_STORE_A = {
  name: 'Store Alpha Bakery',
  description: 'Artisanal sourdough and fresh pastries',
  addressLine: '10 Main Boulevard',
  city: 'Lahore',
  latitude: 31.5204,
  longitude: 74.3587,
  deliveryRadiusKm: 10,
  baseDeliveryFee: 150,
  minOrderAmount: 300,
  timezone: 'Asia/Karachi',
};

const SAMPLE_STORE_B = {
  name: 'Store Beta Grocery',
  description: 'Organic fruits and vegetables',
  addressLine: '25 Mall Road',
  city: 'Lahore',
  latitude: 31.525,
  longitude: 74.36,
  deliveryRadiusKm: 12,
  baseDeliveryFee: 100,
  minOrderAmount: 200,
  timezone: 'Asia/Karachi',
};

async function cleanDatabase() {
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

async function registerVendor(email: string, legalName: string) {
  const res = await request(app)
    .post('/api/v1/auth/register/vendor')
    .send({
      email,
      password: 'SecurePassword123!',
      firstName: 'Vendor',
      lastName: 'Seller',
      phone: '+923001112233',
      businessLegalName: legalName,
    });

  const cookie = res.headers['set-cookie'];
  return { user: res.body.user, cookie };
}

async function createAdminUser() {
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin.cart@geomarket.test',
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
      email: 'admin.cart@geomarket.test',
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

async function createApprovedStore(vendorCookie: string[], storeCategory: any, payload: any) {
  const res = await request(app)
    .post('/api/v1/vendor/stores')
    .set('Cookie', vendorCookie)
    .send({
      ...payload,
      storeCategoryId: storeCategory.id,
    });

  const storeId = res.body.store.id;

  const store = await prisma.store.update({
    where: { id: storeId },
    data: {
      status: StoreStatus.APPROVED,
      isActive: true,
    },
  });

  return store;
}

async function createProductForStore(
  vendorCookie: string[],
  storeId: string,
  categoryId: string,
  overrides: Partial<any> = {},
) {
  const res = await request(app)
    .post(`/api/v1/vendor/stores/${storeId}/products`)
    .set('Cookie', vendorCookie)
    .send({
      name: 'Product ' + Math.random().toString(36).substring(7),
      productCategoryId: categoryId,
      price: 250.0,
      stockQuantity: 20,
      unit: 'item',
      isActive: true,
      ...overrides,
    });

  return res.body.product;
}

describe('Phase 6: Shopping Cart & Single-Store Enforcement', () => {
  let customerA: { user: any; cookie: string[] };
  let customerB: { user: any; cookie: string[] };
  let vendor: { user: any; cookie: string[] };
  let admin: { user: any; cookie: string[] };
  let storeCat: any;
  let prodCat: any;
  let storeA: any;
  let storeB: any;
  let productA1: any;
  let productA2: any;
  let productB1: any;

  beforeEach(async () => {
    await cleanDatabase();

    customerA = await registerCustomer('customerA@test.com');
    customerB = await registerCustomer('customerB@test.com');
    vendor = await registerVendor('vendor@test.com', 'Acme Food Group');
    admin = await createAdminUser();

    storeCat = await createStoreCategory();
    prodCat = await createProductCategory();

    storeA = await createApprovedStore(vendor.cookie, storeCat, SAMPLE_STORE_A);
    storeB = await createApprovedStore(vendor.cookie, storeCat, SAMPLE_STORE_B);

    productA1 = await createProductForStore(vendor.cookie, storeA.id, prodCat.id, {
      name: 'Sourdough Loaf',
      price: 300,
      stockQuantity: 10,
    });

    productA2 = await createProductForStore(vendor.cookie, storeA.id, prodCat.id, {
      name: 'Butter Croissant',
      price: 150,
      stockQuantity: 5,
    });

    productB1 = await createProductForStore(vendor.cookie, storeB.id, prodCat.id, {
      name: 'Organic Apples',
      price: 200,
      stockQuantity: 15,
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // 1. Cart Creation
  // =========================================================================
  describe('Cart Creation', () => {
    it('1. Empty customer has no cart', async () => {
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);

      expect(res.status).toBe(200);
      expect(res.body.cart).toBeNull();
    });

    it('2. Adding first product creates cart', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.cart).toBeDefined();
      expect(res.body.cart.id).toBeTruthy();
      expect(res.body.cart.userId).toBe(customerA.user.id);
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0].productId).toBe(productA1.id);
      expect(res.body.cart.items[0].quantity).toBe(2);
    });

    it('3. Cart store is set from first product', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      expect(res.status).toBe(200);
      expect(res.body.cart.storeId).toBe(storeA.id);
      expect(res.body.cart.store).toBeDefined();
      expect(res.body.cart.store.id).toBe(storeA.id);
      expect(res.body.cart.store.name).toBe(storeA.name);
    });
  });

  // =========================================================================
  // 2. Single-Store Invariant Enforcement
  // =========================================================================
  describe('Single-Store Enforcement', () => {
    it('4. Same-store product can be added', async () => {
      // Add first product from Store A
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      // Add second product from Store A
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA2.id, quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.cart.storeId).toBe(storeA.id);
      expect(res.body.cart.items).toHaveLength(2);
      expect(res.body.cart.itemCount).toBe(3);
      expect(res.body.cart.subtotal).toBe(300 * 1 + 150 * 2); // 600
    });

    it('5. Different-store product is rejected with CART_STORE_CONFLICT', async () => {
      // Add product from Store A
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      // Attempt to add product from Store B
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productB1.id, quantity: 1 });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CART_STORE_CONFLICT');
      expect(res.body.error).toContain('another store');
      expect(res.body.currentStoreId).toBe(storeA.id);
      expect(res.body.attemptedStoreId).toBe(storeB.id);
    });

    it('6. Store conflict does not modify existing cart', async () => {
      // Add product from Store A
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      // Attempt to add product from Store B
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productB1.id, quantity: 3 });

      // Verify cart still intact with Store A items only
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);

      expect(res.status).toBe(200);
      expect(res.body.cart.storeId).toBe(storeA.id);
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0].productId).toBe(productA1.id);
      expect(res.body.cart.items[0].quantity).toBe(2);
    });

    it('7. Clearing cart allows a different store to become the new cart store', async () => {
      // Add product from Store A
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      // Clear the cart
      const clearRes = await request(app)
        .delete('/api/v1/cart')
        .set('Cookie', customerA.cookie);

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.cart.items).toHaveLength(0);
      expect(clearRes.body.cart.storeId).toBeNull();

      // Now add product from Store B
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productB1.id, quantity: 3 });

      expect(addRes.status).toBe(200);
      expect(addRes.body.cart.storeId).toBe(storeB.id);
      expect(addRes.body.cart.items).toHaveLength(1);
      expect(addRes.body.cart.items[0].productId).toBe(productB1.id);
      expect(addRes.body.cart.items[0].quantity).toBe(3);
    });
  });

  // =========================================================================
  // 3. Quantity Rules
  // =========================================================================
  describe('Quantity Rules', () => {
    it('8. Same product merges into existing line', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0].quantity).toBe(5);
      expect(res.body.cart.items[0].lineTotal).toBe(300 * 5);
      expect(res.body.cart.itemCount).toBe(5);
    });

    it('9. Quantity can be increased via PATCH', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      const itemId = addRes.body.cart.items[0].id;

      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Cookie', customerA.cookie)
        .send({ quantity: 6 });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.cart.items[0].quantity).toBe(6);
      expect(patchRes.body.cart.items[0].lineTotal).toBe(1800);
    });

    it('10. Quantity can be decreased via PATCH', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 4 });

      const itemId = addRes.body.cart.items[0].id;

      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Cookie', customerA.cookie)
        .send({ quantity: 1 });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.cart.items[0].quantity).toBe(1);
      expect(patchRes.body.cart.items[0].lineTotal).toBe(300);
    });

    it('11. Quantity cannot be zero', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('12. Quantity cannot be negative', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: -2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('13. Quantity cannot exceed available stock', async () => {
      // productA1 has stockQuantity = 10
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 11 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');
      expect(res.body.availableStock).toBe(10);
    });

    it('13b. Incremental addition cannot exceed stock', async () => {
      // Add 7 of 10
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 7 });

      // Request 5 more -> total would be 12 > 10
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');

      // Cart quantity must remain 7
      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);
      expect(cartRes.body.cart.items[0].quantity).toBe(7);
    });
  });

  // =========================================================================
  // 4. Product State & Availability
  // =========================================================================
  describe('Product State', () => {
    it('14. Inactive product cannot be added', async () => {
      const inactiveProduct = await createProductForStore(vendor.cookie, storeA.id, prodCat.id, {
        name: 'Inactive Pastry',
        isActive: false,
        stockQuantity: 10,
      });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: inactiveProduct.id, quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PRODUCT_INACTIVE');
    });

    it('15. Out-of-stock product cannot be added', async () => {
      const outOfStockProduct = await createProductForStore(vendor.cookie, storeA.id, prodCat.id, {
        name: 'Sold Out Tart',
        stockQuantity: 0,
      });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: outOfStockProduct.id, quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    });

    it('16. Existing cart correctly reports product that later becomes unavailable', async () => {
      // Add product
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      // Deactivate product directly in DB (e.g. vendor toggled it off)
      await prisma.product.update({
        where: { id: productA1.id },
        data: { isActive: false },
      });

      // Fetch cart
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);

      expect(res.status).toBe(200);
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0].isAvailable).toBe(false);
      expect(res.body.cart.items[0].status).toBe('unavailable');
      expect(res.body.cart.isValid).toBe(false);
    });

    it('16b. Updating quantity on an inactive product returns 400 PRODUCT_INACTIVE', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const itemId = addRes.body.cart.items[0].id;

      await prisma.product.update({
        where: { id: productA1.id },
        data: { isActive: false },
      });

      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Cookie', customerA.cookie)
        .send({ quantity: 2 });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.code).toBe('PRODUCT_INACTIVE');
    });

    it('16c. Updating quantity on an item whose store is suspended returns 400 STORE_UNAVAILABLE', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const itemId = addRes.body.cart.items[0].id;

      await prisma.store.update({
        where: { id: storeA.id },
        data: { status: StoreStatus.SUSPENDED },
      });

      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Cookie', customerA.cookie)
        .send({ quantity: 2 });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.code).toBe('STORE_UNAVAILABLE');
    });

    it('16d. Store pausing orders blocks new additions and renders cart invalid', async () => {
      await prisma.store.update({
        where: { id: storeA.id },
        data: { isAcceptingOrders: false },
      });

      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      expect(addRes.status).toBe(400);
      expect(addRes.body.code).toBe('STORE_UNAVAILABLE');
    });

    it('16e. Cart item store mismatch renders item unavailable and cart invalid', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const cartId = addRes.body.cart.id;

      // Simulate a data anomaly: directly insert item from Store B into customer A's cart
      await prisma.cartItem.create({
        data: {
          cartId,
          productId: productB1.id,
          quantity: 1,
        },
      });

      const res = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);

      expect(res.status).toBe(200);
      const mismatchedItem = res.body.cart.items.find((i: any) => i.productId === productB1.id);
      expect(mismatchedItem.status).toBe('unavailable');
      expect(mismatchedItem.isAvailable).toBe(false);
      expect(res.body.cart.isValid).toBe(false);
    });
  });

  // =========================================================================
  // 5. Ownership & Tenant Isolation
  // =========================================================================
  describe('Ownership and Tenant Isolation', () => {
    it("17. Customer cannot access another customer's cart", async () => {
      // Customer A adds item
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      // Customer B checks their cart -> must be null/empty
      const resB = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerB.cookie);

      expect(resB.status).toBe(200);
      expect(resB.body.cart).toBeNull();
    });

    it("18. Customer cannot modify another customer's cart item", async () => {
      // Customer A adds item
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      const itemAId = addRes.body.cart.items[0].id;

      // Customer B attempts to patch customer A's item
      const patchRes = await request(app)
        .patch(`/api/v1/cart/items/${itemAId}`)
        .set('Cookie', customerB.cookie)
        .send({ quantity: 5 });

      expect(patchRes.status).toBe(404);
      expect(patchRes.body.error).toBe('Cart item not found');

      // Customer B attempts to delete customer A's item
      const delRes = await request(app)
        .delete(`/api/v1/cart/items/${itemAId}`)
        .set('Cookie', customerB.cookie);

      expect(delRes.status).toBe(404);
      expect(delRes.body.error).toBe('Cart item not found');

      // Customer A's item remains unaffected
      const checkA = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);
      expect(checkA.body.cart.items[0].quantity).toBe(2);
    });

    it('19. Vendor cannot access customer cart APIs', async () => {
      const getRes = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', vendor.cookie);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error).toBe('Insufficient permissions');

      const postRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', vendor.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      expect(postRes.status).toBe(403);
    });

    it('20. Admin cannot access customer cart APIs', async () => {
      const getRes = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', admin.cookie);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error).toBe('Insufficient permissions');

      const postRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', admin.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      expect(postRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 6. Concurrency Safety
  // =========================================================================
  describe('Concurrency Safety', () => {
    it('21. Concurrent cart creation remains one cart', async () => {
      // Customer has no cart yet. Send 3 simultaneous add requests for same store products
      const results = await Promise.all([
        request(app)
          .post('/api/v1/cart/items')
          .set('Cookie', customerA.cookie)
          .send({ productId: productA1.id, quantity: 1 }),
        request(app)
          .post('/api/v1/cart/items')
          .set('Cookie', customerA.cookie)
          .send({ productId: productA2.id, quantity: 1 }),
        request(app)
          .post('/api/v1/cart/items')
          .set('Cookie', customerA.cookie)
          .send({ productId: productA1.id, quantity: 1 }),
      ]);

      for (const res of results) {
        expect(res.status).toBe(200);
      }

      // Verify in DB that exactly one Cart exists for customerA
      const cartsCount = await prisma.cart.count({
        where: { userId: customerA.user.id },
      });
      expect(cartsCount).toBe(1);

      // Verify cart has Store A as storeId and total quantity is 3
      const cart = await prisma.cart.findUnique({
        where: { userId: customerA.user.id },
        include: { items: true },
      });
      expect(cart?.storeId).toBe(storeA.id);
      const totalQty = cart?.items.reduce((sum, item) => sum + item.quantity, 0);
      expect(totalQty).toBe(3);
    });

    it('22. Concurrent same-product additions do not create duplicate CartItems', async () => {
      // Two concurrent add requests for productA1 (quantity 2 and quantity 3)
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/cart/items')
          .set('Cookie', customerB.cookie)
          .send({ productId: productA1.id, quantity: 2 }),
        request(app)
          .post('/api/v1/cart/items')
          .set('Cookie', customerB.cookie)
          .send({ productId: productA1.id, quantity: 3 }),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Verify in DB that only 1 CartItem row exists for (cartId, productA1.id)
      const cart = await prisma.cart.findUnique({
        where: { userId: customerB.user.id },
        include: { items: true },
      });

      expect(cart?.items).toHaveLength(1);
      expect(cart?.items[0].productId).toBe(productA1.id);
      expect(cart?.items[0].quantity).toBe(5);
    });

    it('22b. Concurrent cross-store additions: exactly one store wins and the other is rejected with CART_STORE_CONFLICT', async () => {
      // Customer has no cart yet. Send 2 simultaneous requests from different stores (Store A vs Store B)
      const [resA, resB] = await Promise.all([
        request(app)
          .post('/api/v1/cart/items')
          .set('Cookie', customerA.cookie)
          .send({ productId: productA1.id, quantity: 2 }),
        request(app)
          .post('/api/v1/cart/items')
          .set('Cookie', customerA.cookie)
          .send({ productId: productB1.id, quantity: 2 }),
      ]);

      const statuses = [resA.status, resB.status].sort();
      // Exactly one must succeed (200) and the other must be rejected with 409 conflict
      expect(statuses).toEqual([200, 409]);

      const conflictRes = resA.status === 409 ? resA : resB;
      const successRes = resA.status === 200 ? resA : resB;

      expect(conflictRes.body.code).toBe('CART_STORE_CONFLICT');
      expect(successRes.body.cart).toBeDefined();

      // In database, cart must contain only items from the winning store
      const dbCart = await prisma.cart.findUnique({
        where: { userId: customerA.user.id },
        include: { items: { include: { product: true } } },
      });

      expect(dbCart).toBeDefined();
      expect(dbCart!.items.length).toBeGreaterThan(0);
      for (const item of dbCart!.items) {
        expect(item.product.storeId).toBe(dbCart!.storeId);
      }
    });
  });

  // =========================================================================
  // 7. Clear & Remove Operations
  // =========================================================================
  describe('Clear and Remove Operations', () => {
    it('23. Removing an item works', async () => {
      // Add two products
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const addRes2 = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA2.id, quantity: 2 });

      const itemA2Id = addRes2.body.cart.items.find((i: any) => i.productId === productA2.id).id;

      // Remove product A2
      const delRes = await request(app)
        .delete(`/api/v1/cart/items/${itemA2Id}`)
        .set('Cookie', customerA.cookie);

      expect(delRes.status).toBe(200);
      expect(delRes.body.cart.items).toHaveLength(1);
      expect(delRes.body.cart.items[0].productId).toBe(productA1.id);
      expect(delRes.body.cart.itemCount).toBe(1);
    });

    it('24. Removing the final item leaves an empty cart and resets storeId', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const itemId = addRes.body.cart.items[0].id;

      const delRes = await request(app)
        .delete(`/api/v1/cart/items/${itemId}`)
        .set('Cookie', customerA.cookie);

      expect(delRes.status).toBe(200);
      expect(delRes.body.cart.items).toHaveLength(0);
      expect(delRes.body.cart.itemCount).toBe(0);
      expect(delRes.body.cart.subtotal).toBe(0);
      expect(delRes.body.cart.storeId).toBeNull();
      expect(delRes.body.cart.store).toBeNull();
    });

    it('25. Clear cart removes all items', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA2.id, quantity: 3 });

      const clearRes = await request(app)
        .delete('/api/v1/cart')
        .set('Cookie', customerA.cookie);

      expect(clearRes.status).toBe(200);
      expect(clearRes.body.cart.items).toHaveLength(0);
      expect(clearRes.body.cart.itemCount).toBe(0);
      expect(clearRes.body.cart.subtotal).toBe(0);
      expect(clearRes.body.cart.storeId).toBeNull();
    });

    it('26. After clearing, a product from another store can establish the new store context', async () => {
      // Add from Store A
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      // Clear cart
      await request(app)
        .delete('/api/v1/cart')
        .set('Cookie', customerA.cookie);

      // Add from Store B
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productB1.id, quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.cart.storeId).toBe(storeB.id);
      expect(res.body.cart.store.name).toBe(storeB.name);
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0].productId).toBe(productB1.id);
      expect(res.body.cart.items[0].quantity).toBe(4);
    });
  });
});
