import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole, StoreStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@geomarket/shared';

const app = createApp();

const STORE_LOCATION = {
  latitude: 31.5204,
  longitude: 74.3587, // Gulberg, Lahore
  deliveryRadiusKm: 10,
  baseDeliveryFee: 150,
  minOrderAmount: 200,
  timezone: 'Asia/Karachi',
};

async function cleanDatabase() {
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderAddressSnapshot.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeOperatingHours.deleteMany();
  await prisma.store.deleteMany();
  await prisma.storeCategory.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function registerCustomer(email: string, firstName = 'Ali', lastName = 'Customer') {
  const res = await request(app)
    .post('/api/v1/auth/register/customer')
    .send({
      email,
      password: 'SecurePassword123!',
      firstName,
      lastName,
      phone: '+923001234567',
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
      lastName: 'Owner',
      phone: '+923009876543',
      businessLegalName: legalName,
    });

  const cookie = res.headers['set-cookie'];
  return { user: res.body.user, cookie };
}

async function createStoreCategory(name = 'Bakery') {
  return prisma.storeCategory.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7),
      isActive: true,
    },
  });
}

async function createProductCategory(name = 'Breads') {
  return prisma.productCategory.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7),
    },
  });
}

async function createApprovedStore(
  vendorCookie: string[],
  storeCategoryId: string,
  overrides: Partial<any> = {}
) {
  const payload = {
    name: 'Test Store ' + Math.random().toString(36).substring(7),
    description: 'Fresh artisanal goods',
    addressLine: '123 Main Street',
    city: 'Lahore',
    latitude: STORE_LOCATION.latitude,
    longitude: STORE_LOCATION.longitude,
    deliveryRadiusKm: STORE_LOCATION.deliveryRadiusKm,
    baseDeliveryFee: STORE_LOCATION.baseDeliveryFee,
    minOrderAmount: STORE_LOCATION.minOrderAmount,
    timezone: STORE_LOCATION.timezone,
    storeCategoryId,
    ...overrides,
  };

  const res = await request(app)
    .post('/api/v1/vendor/stores')
    .set('Cookie', vendorCookie)
    .send(payload);

  const storeId = res.body.store.id;

  // Approve store and ensure it is active
  await prisma.store.update({
    where: { id: storeId },
    data: {
      status: overrides.status ?? StoreStatus.APPROVED,
      isActive: overrides.isActive ?? true,
      isAcceptingOrders: overrides.isAcceptingOrders ?? true,
    },
  });

  // Seed 24/7 operating hours so it's always open unless specified
  const hours = [];
  for (let day = 0; day <= 6; day++) {
    hours.push({
      storeId,
      dayOfWeek: day,
      openingTime: '00:00',
      closingTime: '23:59',
      isClosed: overrides.closedToday ? true : false,
    });
  }
  await prisma.storeOperatingHours.createMany({ data: hours });

  return prisma.store.findUnique({
    where: { id: storeId },
    include: { operatingHours: true },
  });
}

async function createProductForStore(
  vendorCookie: string[],
  storeId: string,
  categoryId: string,
  overrides: Partial<any> = {}
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

async function createCustomerAddress(
  customerCookie: string[],
  overrides: Partial<any> = {}
) {
  const res = await request(app)
    .post('/api/v1/addresses')
    .set('Cookie', customerCookie)
    .send({
      addressLabel: 'Home',
      recipientName: 'Ali Customer',
      recipientPhone: '+923001234567',
      addressLine: 'Gulberg III, Near Main Market',
      city: 'Lahore',
      latitude: STORE_LOCATION.latitude + 0.01, // ~1.1km away (inside 10km radius)
      longitude: STORE_LOCATION.longitude + 0.01,
      isDefault: true,
      ...overrides,
    });

  return res.body.address;
}

describe('Phase 7: Checkout, COD, and Order Fulfillment Lifecycle', () => {
  let customerA: { user: any; cookie: string[] };
  let customerB: { user: any; cookie: string[] };
  let vendorA: { user: any; cookie: string[] };
  let vendorB: { user: any; cookie: string[] };
  let storeCat: any;
  let prodCat: any;
  let storeA: any;
  let productA1: any;
  let productA2: any;
  let addressA: any;

  beforeEach(async () => {
    await cleanDatabase();

    customerA = await registerCustomer('customerA@test.com', 'Ali', 'Ahmad');
    customerB = await registerCustomer('customerB@test.com', 'Bilal', 'Khan');
    vendorA = await registerVendor('vendorA@test.com', 'Vendor Alpha Foods');
    vendorB = await registerVendor('vendorB@test.com', 'Vendor Beta Grocery');

    storeCat = await createStoreCategory('Supermarket');
    prodCat = await createProductCategory('General Goods');

    storeA = await createApprovedStore(vendorA.cookie, storeCat.id, {
      name: 'Store Alpha',
      minOrderAmount: 200,
      baseDeliveryFee: 150,
    });

    productA1 = await createProductForStore(vendorA.cookie, storeA.id, prodCat.id, {
      name: 'Whole Grain Bread',
      price: 200,
      stockQuantity: 10,
    });

    productA2 = await createProductForStore(vendorA.cookie, storeA.id, prodCat.id, {
      name: 'Almond Milk 1L',
      price: 350,
      stockQuantity: 5,
    });

    addressA = await createCustomerAddress(customerA.cookie);
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. Checkout Success
  // =========================================================================
  describe('Checkout Success & Invariants', () => {
    it('executes successful atomic checkout with COD, snapshots, inventory deduction, and cart clearing', async () => {
      // 1. Add products to customerA cart (Total subtotal: 200*2 + 350*1 = 750)
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA2.id, quantity: 1 });

      // 2. Perform checkout
      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(201);
      const order = res.body.order;
      expect(order).toBeDefined();
      expect(order.userId).toBe(customerA.user.id);
      expect(order.storeId).toBe(storeA.id);
      expect(order.status).toBe(OrderStatus.PLACED);
      expect(order.paymentMethod).toBe(PaymentMethod.COD);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);

      // Financials
      expect(order.subtotal).toBe(750);
      expect(order.deliveryFee).toBe(150);
      expect(order.totalAmount).toBe(900);

      // Items Snapshot
      expect(order.items).toHaveLength(2);
      const item1 = order.items.find((i: any) => i.productId === productA1.id);
      expect(item1.productNameSnapshot).toBe(productA1.name);
      expect(item1.unitPriceSnapshot).toBe(200);
      expect(item1.quantity).toBe(2);
      expect(item1.lineTotal).toBe(400);

      // Address Snapshot
      expect(order.addressSnapshot).toBeDefined();
      expect(order.addressSnapshot.recipientName).toBe(addressA.recipientName);
      expect(order.addressSnapshot.recipientPhone).toBe(addressA.recipientPhone);
      expect(order.addressSnapshot.address).toBe(addressA.addressLine);
      expect(order.addressSnapshot.city).toBe(addressA.city);

      // Inventory deduction verification in DB
      const updatedP1 = await prisma.product.findUnique({ where: { id: productA1.id } });
      const updatedP2 = await prisma.product.findUnique({ where: { id: productA2.id } });
      expect(updatedP1?.stockQuantity).toBe(8); // 10 - 2
      expect(updatedP2?.stockQuantity).toBe(4); // 5 - 1

      // Cart clearing verification
      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);
      expect(cartRes.body.cart.items).toHaveLength(0);
      expect(cartRes.body.cart.storeId).toBeNull();
    });

    it('executes successful atomic checkout with inline address payload for new/guest address', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({
          inlineAddress: {
            recipientName: 'Sara Ahmad',
            recipientPhone: '+923005554433',
            addressLine: 'House 42, Street 7, Gulberg III',
            city: 'Lahore',
            latitude: STORE_LOCATION.latitude + 0.01,
            longitude: STORE_LOCATION.longitude + 0.01,
          },
        });

      expect(res.status).toBe(201);
      const order = res.body.order;
      expect(order).toBeDefined();
      expect(order.status).toBe(OrderStatus.PLACED);
      expect(order.addressSnapshot.recipientName).toBe('Sara Ahmad');
      expect(order.addressSnapshot.recipientPhone).toBe('+923005554433');
      expect(order.addressSnapshot.address).toBe('House 42, Street 7, Gulberg III');
    });

    it('guarantees historical order price immutability when product price changes', async () => {
      // 1. Create product at price A (Rs. 250)
      const testProduct = await createProductForStore(vendorA.cookie, storeA.id, prodCat.id, {
        name: 'Artisan Sourdough',
        price: 250.0,
        stockQuantity: 50,
      });

      // 2. Customer places order: 2 × Rs. 250 = Rs. 500 (+ Rs. 150 delivery fee = Rs. 650)
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: testProduct.id, quantity: 2 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(checkoutRes.status).toBe(201);
      const placedOrder = checkoutRes.body.order;
      expect(placedOrder.subtotal).toBe(500);
      expect(placedOrder.deliveryFee).toBe(150);
      expect(placedOrder.totalAmount).toBe(650);

      const placedItem = placedOrder.items.find((i: any) => i.productId === testProduct.id);
      expect(placedItem.unitPriceSnapshot).toBe(250);
      expect(placedItem.quantity).toBe(2);
      expect(placedItem.lineTotal).toBe(500);

      // 3. Vendor later updates product price to price B (Rs. 350)
      const updateRes = await request(app)
        .put(`/api/v1/vendor/products/${testProduct.id}`)
        .set('Cookie', vendorA.cookie)
        .send({ price: 350.0 });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.product.price).toBe(350);

      // 4. Retrieve the old order as customer
      const customerOrderRes = await request(app)
        .get(`/api/v1/orders/${placedOrder.id}`)
        .set('Cookie', customerA.cookie);

      expect(customerOrderRes.status).toBe(200);
      const retrievedOrder = customerOrderRes.body.order;

      // 5. Assert the order still shows price A (Rs. 250)
      const retrievedItem = retrievedOrder.items.find((i: any) => i.productId === testProduct.id);
      expect(retrievedItem.unitPriceSnapshot).toBe(250);
      expect(retrievedItem.lineTotal).toBe(500);

      // 6. Assert order total and subtotal remain unchanged
      expect(retrievedOrder.subtotal).toBe(500);
      expect(retrievedOrder.deliveryFee).toBe(150);
      expect(retrievedOrder.totalAmount).toBe(650);

      // 7. Retrieve the old order as vendor and verify same invariant
      const vendorOrderRes = await request(app)
        .get(`/api/v1/vendor/orders/${placedOrder.id}`)
        .set('Cookie', vendorA.cookie);
      expect(vendorOrderRes.status).toBe(200);
      const vendorRetrievedOrder = vendorOrderRes.body.order;
      expect(vendorRetrievedOrder.subtotal).toBe(500);
      expect(vendorRetrievedOrder.totalAmount).toBe(650);
      expect(vendorRetrievedOrder.items[0].unitPriceSnapshot).toBe(250);

      // 8. Assert current product catalog now has price B (Rs. 350)
      const currentProductRes = await request(app)
        .get(`/api/v1/vendor/products/${testProduct.id}`)
        .set('Cookie', vendorA.cookie);
      expect(currentProductRes.status).toBe(200);
      expect(currentProductRes.body.product.price).toBe(350);

      const dbProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(Number(dbProduct?.price)).toBe(350);
    });
  });

  // =========================================================================
  // 2. Address Security
  // =========================================================================
  describe('Address Security', () => {
    it('rejects checkout when customer attempts to use another customer address', async () => {
      const addressB = await createCustomerAddress(customerB.cookie);

      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressB.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('ADDRESS_NOT_FOUND');
    });
  });

  // =========================================================================
  // 3. Store Eligibility
  // =========================================================================
  describe('Store Eligibility', () => {
    it('rejects checkout when store is not APPROVED (e.g. SUSPENDED)', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      await prisma.store.update({
        where: { id: storeA.id },
        data: { status: StoreStatus.SUSPENDED },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('STORE_UNAVAILABLE');
    });

    it('rejects checkout when store is inactive', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      await prisma.store.update({
        where: { id: storeA.id },
        data: { isActive: false },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('STORE_UNAVAILABLE');
    });

    it('rejects checkout when store is not accepting orders', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      await prisma.store.update({
        where: { id: storeA.id },
        data: { isAcceptingOrders: false },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('STORE_UNAVAILABLE');
    });

    it('rejects checkout when store is currently closed according to operating hours', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      // Mark all operating hours closed
      await prisma.storeOperatingHours.updateMany({
        where: { storeId: storeA.id },
        data: { isClosed: true },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('STORE_CLOSED');
    });
  });

  // =========================================================================
  // 4. Geospatial PostGIS Validation
  // =========================================================================
  describe('Geospatial PostGIS Validation', () => {
    it('rejects checkout when delivery address is outside store delivery radius', async () => {
      // Create address ~25km away in another district (Store delivery radius is 10km)
      const farAddress = await createCustomerAddress(customerA.cookie, {
        addressLabel: 'Far Office',
        latitude: STORE_LOCATION.latitude + 0.25, // ~28km away
        longitude: STORE_LOCATION.longitude + 0.25,
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: farAddress.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OUT_OF_DELIVERY_RADIUS');
    });
  });

  // =========================================================================
  // 5. Product Validation & Invariants
  // =========================================================================
  describe('Product Validation', () => {
    it('rejects checkout when cart is empty', async () => {
      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('EMPTY_CART');
    });

    it('rejects checkout when product is inactive', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      await prisma.product.update({
        where: { id: productA1.id },
        data: { isActive: false },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PRODUCT_INACTIVE');
    });

    it('rejects checkout when requested quantity exceeds available stock', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 5 });

      // Reduce stock in DB to 3
      await prisma.product.update({
        where: { id: productA1.id },
        data: { stockQuantity: 3 },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    });

    it('rejects checkout when minimum order amount is not met', async () => {
      // Store min order is 200, add item with price 150
      const cheapProduct = await createProductForStore(vendorA.cookie, storeA.id, prodCat.id, {
        price: 150,
        stockQuantity: 10,
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: cheapProduct.id, quantity: 1 });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MIN_ORDER_AMOUNT_NOT_MET');
    });
  });

  // =========================================================================
  // 6. Price Integrity
  // =========================================================================
  describe('Price Integrity', () => {
    it('re-reads authoritative product prices from DB and saves accurate snapshots', async () => {
      // Add product at initial price 200
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      // Vendor updates product price to 280
      await prisma.product.update({
        where: { id: productA1.id },
        data: { price: 280 },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(201);
      const order = res.body.order;

      // Subtotal should use 280 * 2 = 560
      expect(order.subtotal).toBe(560);
      expect(order.totalAmount).toBe(560 + 150);
      expect(order.items[0].unitPriceSnapshot).toBe(280);
      expect(order.items[0].lineTotal).toBe(560);
    });
  });

  // =========================================================================
  // 7. Concurrency & No Negative Stock
  // =========================================================================
  describe('Concurrency Protection', () => {
    it('prevents overselling and negative stock under concurrent checkout attempts', async () => {
      // Set limited inventory of 2 units
      const limitedProduct = await createProductForStore(vendorA.cookie, storeA.id, prodCat.id, {
        price: 250,
        stockQuantity: 2,
      });

      const addressB = await createCustomerAddress(customerB.cookie);

      // Customer A adds 2 units
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: limitedProduct.id, quantity: 2 });

      // Customer B adds 2 units
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerB.cookie)
        .send({ productId: limitedProduct.id, quantity: 2 });

      // Both attempt checkout simultaneously
      const [resA, resB] = await Promise.all([
        request(app)
          .post('/api/v1/checkout')
          .set('Cookie', customerA.cookie)
          .send({ addressId: addressA.id }),
        request(app)
          .post('/api/v1/checkout')
          .set('Cookie', customerB.cookie)
          .send({ addressId: addressB.id }),
      ]);

      const successCount = [resA.status, resB.status].filter((s) => s === 201).length;
      const failCount = [resA.status, resB.status].filter((s) => s === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      // Verify stock is exactly 0, never negative
      const productInDb = await prisma.product.findUnique({
        where: { id: limitedProduct.id },
      });
      expect(productInDb?.stockQuantity).toBe(0);
    });
  });

  // =========================================================================
  // 8. Atomic Rollback
  // =========================================================================
  describe('Rollback & Transaction Integrity', () => {
    it('rolls back entirely on checkout failure: no order, no partial items, no stock deduction, cart intact', async () => {
      // Product 1 has stock, Product 2 has stock initially
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA2.id, quantity: 2 });

      // Force Product 2 to be out of stock right before checkout
      await prisma.product.update({
        where: { id: productA2.id },
        data: { stockQuantity: 1 },
      });

      const res = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(res.status).toBe(400);

      // Verify no order created
      const ordersCount = await prisma.order.count();
      expect(ordersCount).toBe(0);

      // Verify no order items created
      const orderItemsCount = await prisma.orderItem.count();
      expect(orderItemsCount).toBe(0);

      // Verify Product 1 stock was NOT deducted
      const p1 = await prisma.product.findUnique({ where: { id: productA1.id } });
      expect(p1?.stockQuantity).toBe(10);

      // Verify cart remains intact
      const cartRes = await request(app)
        .get('/api/v1/cart')
        .set('Cookie', customerA.cookie);
      expect(cartRes.body.cart.items).toHaveLength(2);
    });
  });

  // =========================================================================
  // 9. Cancellation & Inventory Restoration
  // =========================================================================
  describe('Order Cancellation & Stock Restoration', () => {
    it('restores inventory atomically when customer cancels a PLACED order', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 3 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Stock was 10, now 7
      let p1 = await prisma.product.findUnique({ where: { id: productA1.id } });
      expect(p1?.stockQuantity).toBe(7);

      // Customer cancels
      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerA.cookie);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.order.status).toBe(OrderStatus.CANCELLED);
      expect(cancelRes.body.order.paymentStatus).toBe(PaymentStatus.CANCELLED);

      // Inventory restored back to 10
      p1 = await prisma.product.findUnique({ where: { id: productA1.id } });
      expect(p1?.stockQuantity).toBe(10);
    });

    it('restores inventory when cancelling a CONFIRMED order', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Vendor confirms order
      await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.CONFIRMED });

      // Customer cancels confirmed order
      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerA.cookie);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.order.status).toBe(OrderStatus.CANCELLED);

      // Inventory restored
      const p1 = await prisma.product.findUnique({ where: { id: productA1.id } });
      expect(p1?.stockQuantity).toBe(10);
    });

    it('rejects cancellation from PREPARING and subsequent states', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Vendor advances to PREPARING
      await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.CONFIRMED });

      await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.PREPARING });

      // Customer attempts to cancel
      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerA.cookie);

      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.code).toBe('CANNOT_CANCEL_ORDER');
    });
  });

  // =========================================================================
  // 10. Explicit Order FSM Transitions
  // =========================================================================
  describe('Order FSM Full Lifecycle', () => {
    it('progresses through PLACED -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // 1. CONFIRMED
      let res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.CONFIRMED });
      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe(OrderStatus.CONFIRMED);

      // 2. PREPARING
      res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.PREPARING });
      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe(OrderStatus.PREPARING);

      // 3. READY
      res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.READY });
      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe(OrderStatus.READY);

      // 4. OUT_FOR_DELIVERY
      res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.OUT_FOR_DELIVERY });
      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe(OrderStatus.OUT_FOR_DELIVERY);

      // 5. DELIVERED (and COD paymentStatus becomes PAID)
      res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.DELIVERED });
      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe(OrderStatus.DELIVERED);
      expect(res.body.order.paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('rejects invalid backwards or skipped status transitions', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Skip to DELIVERED directly from PLACED
      let res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.DELIVERED });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');

      // Valid: PLACED -> CONFIRMED
      await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.CONFIRMED });

      // Invalid: CONFIRMED -> PLACED (backward)
      res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.PLACED });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  // =========================================================================
  // 11. Authorization & Tenant Isolation
  // =========================================================================
  describe('Authorization & Tenant Isolation', () => {
    it('customer cannot view or cancel another customer order (404)', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Customer B attempts to view Customer A's order
      const viewRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Cookie', customerB.cookie);

      expect(viewRes.status).toBe(404);

      // Customer B attempts to cancel Customer A's order
      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerB.cookie);

      expect(cancelRes.status).toBe(404);
    });

    it('customer cannot perform vendor fulfillment transitions (403)', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Customer attempts vendor status update endpoint
      const res = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', customerA.cookie)
        .send({ status: OrderStatus.CONFIRMED });

      expect(res.status).toBe(403);
    });

    it('vendor cannot view or modify orders belonging to another vendor store (404)', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Vendor B attempts to view Vendor A's order
      const viewRes = await request(app)
        .get(`/api/v1/vendor/orders/${orderId}`)
        .set('Cookie', vendorB.cookie);

      expect(viewRes.status).toBe(404);

      // Vendor B attempts to update status of Vendor A's order
      const updateRes = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorB.cookie)
        .send({ status: OrderStatus.CONFIRMED });

      expect(updateRes.status).toBe(404);
    });
  });

  // =========================================================================
  // 12. Historical Integrity
  // =========================================================================
  describe('Historical Integrity of Snapshots', () => {
    it('preserves historical product name, unit price, and delivery address snapshots even after original rows change or are deleted', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // 1. Modify the original product's name and price in DB
      await prisma.product.update({
        where: { id: productA1.id },
        data: {
          name: 'Completely Changed Name 2026',
          price: 999.0,
        },
      });

      // 2. Modify the customer's saved address in DB
      await prisma.customerAddress.update({
        where: { id: addressA.id },
        data: {
          addressLine: 'Moved to Different City 999',
          city: 'Islamabad',
        },
      });

      // 3. Fetch order detail
      const orderRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Cookie', customerA.cookie);

      expect(orderRes.status).toBe(200);
      const order = orderRes.body.order;

      // Snapshot product name and price must NOT change
      expect(order.items[0].productNameSnapshot).toBe('Whole Grain Bread');
      expect(order.items[0].unitPriceSnapshot).toBe(200);
      expect(order.items[0].lineTotal).toBe(400);

      // Snapshot address must NOT change
      expect(order.addressSnapshot.address).toBe(addressA.addressLine);
      expect(order.addressSnapshot.city).toBe('Lahore');
    });
  });

  // =========================================================================
  // 13. Edge Cases & Resilience
  // =========================================================================
  describe('Edge Cases & Transaction Resilience', () => {
    it('safely cancels an order and restores stock even if one product was deleted (onDelete: SetNull)', async () => {
      // Add both products to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 2 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA2.id, quantity: 2 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      expect(checkoutRes.status).toBe(201);
      const orderId = checkoutRes.body.order.id;

      // Product 1 stock was 10 -> 8; Product 2 was 5 -> 3
      let p1 = await prisma.product.findUnique({ where: { id: productA1.id } });
      expect(p1?.stockQuantity).toBe(8);

      // Now simulate product 2 being deleted from database
      await prisma.product.delete({ where: { id: productA2.id } });

      // Customer cancels order
      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerA.cookie);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.order.status).toBe(OrderStatus.CANCELLED);

      // Product 1 stock restored back to 10
      p1 = await prisma.product.findUnique({ where: { id: productA1.id } });
      expect(p1?.stockQuantity).toBe(10);
    });

    it('rejects double cancellation with 400 CANNOT_CANCEL_ORDER', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // First cancel succeeds
      const cancel1 = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerA.cookie);
      expect(cancel1.status).toBe(200);

      // Second cancel must fail with 400
      const cancel2 = await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerA.cookie);
      expect(cancel2.status).toBe(400);
      expect(cancel2.body.code).toBe('CANNOT_CANCEL_ORDER');
    });

    it('rejects customer orders query with invalid pagination parameters with 400', async () => {
      const res = await request(app)
        .get('/api/v1/orders?page=-5&pageSize=not-a-number')
        .set('Cookie', customerA.cookie);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('rejects vendor transition on an already cancelled order under transaction lock', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', customerA.cookie)
        .send({ productId: productA1.id, quantity: 1 });

      const checkoutRes = await request(app)
        .post('/api/v1/checkout')
        .set('Cookie', customerA.cookie)
        .send({ addressId: addressA.id });

      const orderId = checkoutRes.body.order.id;

      // Customer cancels
      await request(app)
        .patch(`/api/v1/orders/${orderId}/cancel`)
        .set('Cookie', customerA.cookie);

      // Vendor attempts to confirm or progress cancelled order
      const vendorRes = await request(app)
        .patch(`/api/v1/vendor/orders/${orderId}/status`)
        .set('Cookie', vendorA.cookie)
        .send({ status: OrderStatus.CONFIRMED });

      expect(vendorRes.status).toBe(400);
      expect(vendorRes.body.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });
});
