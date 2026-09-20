import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { OrderStatus, PaymentStatus, UserRole } from '@geomarket/shared';

const app = createApp();

const STORE_LOCATION = {
  latitude: 31.5204,
  longitude: 74.3587,
  deliveryRadiusKm: 10,
  baseDeliveryFee: 100,
  minOrderAmount: 150,
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
  await prisma.storeOperatingHours.deleteMany();
  await prisma.product.deleteMany();
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

  return { user: res.body.user, cookie: res.headers['set-cookie'] };
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

  return { user: res.body.user, cookie: res.headers['set-cookie'] };
}

async function setupStoreWithVendor(vendorEmail = 'vendor1@example.com') {
  const { user: vendorUser, cookie: vendorCookie } = await registerVendor(
    vendorEmail,
    'Vendor Business Ltd'
  );

  const category = await prisma.storeCategory.create({
    data: {
      name: 'Restaurant ' + Math.random().toString(36).substring(7),
      slug: 'restaurant-' + Math.random().toString(36).substring(7),
      isActive: true,
    },
  });

  const storeRes = await request(app)
    .post('/api/v1/vendor/stores')
    .set('Cookie', vendorCookie)
    .send({
      name: 'Delicious Bites',
      description: 'Gourmet burgers and fries',
      addressLine: '45 Food Street',
      city: 'Lahore',
      latitude: STORE_LOCATION.latitude,
      longitude: STORE_LOCATION.longitude,
      deliveryRadiusKm: STORE_LOCATION.deliveryRadiusKm,
      baseDeliveryFee: STORE_LOCATION.baseDeliveryFee,
      minOrderAmount: STORE_LOCATION.minOrderAmount,
      timezone: STORE_LOCATION.timezone,
      storeCategoryId: category.id,
    });

  const storeId = storeRes.body.store.id;

  // Approve and activate store
  await prisma.store.update({
    where: { id: storeId },
    data: { status: 'APPROVED', isActive: true },
  });

  return { vendorUser, vendorCookie, storeId };
}

async function createDeliveredOrder(userId: string, storeId: string, totalAmount = 500) {
  return prisma.order.create({
    data: {
      userId,
      storeId,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      subtotal: totalAmount - 100,
      deliveryFee: 100,
      totalAmount,
      addressSnapshot: {
        create: {
          recipientName: 'Ali Customer',
          recipientPhone: '+923001234567',
          address: 'House 1, Street 2',
          city: 'Lahore',
          latitude: 31.52,
          longitude: 74.35,
        },
      },
    },
  });
}

describe('Phase 8 — Reviews, Ratings & Vendor Analytics', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('1. Customer Review Creation', () => {
    it('allows authenticated customer to review a delivered order with valid rating and comment', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('cust1@example.com');

      const order = await createDeliveredOrder(customer.id, storeId);

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order.id,
          rating: 5,
          comment: 'Outstanding food quality and super fast delivery!',
        });

      expect(res.status).toBe(201);
      expect(res.body.review).toBeDefined();
      expect(res.body.review.rating).toBe(5);
      expect(res.body.review.comment).toBe('Outstanding food quality and super fast delivery!');
      expect(res.body.review.orderId).toBe(order.id);
      expect(res.body.review.storeId).toBe(storeId);
      expect(res.body.review.userId).toBe(customer.id);
      expect(res.body.review.customerName).toBe('Ali C.');

      // Check that store aggregates were updated transactionally
      const store = await prisma.store.findUnique({ where: { id: storeId } });
      expect(Number(store?.averageRating)).toBe(5.0);
      expect(store?.totalReviews).toBe(1);
    });

    it('allows customer to create a review without comment (comment is optional)', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('cust2@example.com');

      const order = await createDeliveredOrder(customer.id, storeId);

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order.id,
          rating: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(4);
      expect(res.body.review.comment).toBeNull();
    });

    it('supports rating boundaries 1 and 5', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('cust_bounds@example.com');

      const order1 = await createDeliveredOrder(customer.id, storeId);
      const res1 = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order1.id,
          rating: 1,
          comment: 'Terrible experience',
        });
      expect(res1.status).toBe(201);
      expect(res1.body.review.rating).toBe(1);

      const order2 = await createDeliveredOrder(customer.id, storeId);
      const res2 = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order2.id,
          rating: 5,
          comment: 'Perfect experience',
        });
      expect(res2.status).toBe(201);
      expect(res2.body.review.rating).toBe(5);

      // Average: (1 + 5) / 2 = 3.00
      const store = await prisma.store.findUnique({ where: { id: storeId } });
      expect(Number(store?.averageRating)).toBe(3.0);
      expect(store?.totalReviews).toBe(2);
    });
  });

  describe('2. Review Rejections & Invariants', () => {
    it('rejects unauthenticated review submission with 401', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer } = await registerCustomer('unauth@example.com');
      const order = await createDeliveredOrder(customer.id, storeId);

      const res = await request(app)
        .post('/api/v1/reviews')
        .send({
          orderId: order.id,
          rating: 5,
        });

      expect(res.status).toBe(401);
    });

    it('rejects review on another customer order with 403 NOT_ORDER_OWNER', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer1 } = await registerCustomer('custA@example.com');
      const { cookie: customer2Cookie } = await registerCustomer('custB@example.com');

      const order = await createDeliveredOrder(customer1.id, storeId);

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customer2Cookie)
        .send({
          orderId: order.id,
          rating: 5,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_ORDER_OWNER');
    });

    it('rejects review on non-delivered order with 400 ORDER_NOT_DELIVERED', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('nondeliv@example.com');

      const nonDeliveredOrder = await prisma.order.create({
        data: {
          userId: customer.id,
          storeId,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: 400,
          deliveryFee: 100,
          totalAmount: 500,
        },
      });

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: nonDeliveredOrder.id,
          rating: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('ORDER_NOT_DELIVERED');
    });

    it('enforces ONE ORDER -> MAXIMUM ONE REVIEW and rejects duplicate reviews with 409', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('dup@example.com');
      const order = await createDeliveredOrder(customer.id, storeId);

      // First review succeeds
      const firstRes = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order.id,
          rating: 4,
          comment: 'First review',
        });
      expect(firstRes.status).toBe(201);

      // Duplicate review is rejected with 409
      const secondRes = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order.id,
          rating: 5,
          comment: 'Attempted second review',
        });
      expect(secondRes.status).toBe(409);
      expect(secondRes.body.code).toBe('ORDER_ALREADY_REVIEWED');
    });

    it('rejects invalid rating values (< 1, > 5, floats, string) with 400', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('invalid_rating@example.com');
      const order = await createDeliveredOrder(customer.id, storeId);

      const resZero = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({ orderId: order.id, rating: 0 });
      expect(resZero.status).toBe(400);

      const resSix = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({ orderId: order.id, rating: 6 });
      expect(resSix.status).toBe(400);

      const resFloat = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({ orderId: order.id, rating: 4.5 });
      expect(resFloat.status).toBe(400);
    });

    it('prevents vendors from reviewing their own stores', async () => {
      const { vendorUser, vendorCookie, storeId } = await setupStoreWithVendor('vendor_self@example.com');

      // Create delivered order belonging to vendor's user ID
      const order = await createDeliveredOrder(vendorUser.id, storeId);

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', vendorCookie)
        .send({
          orderId: order.id,
          rating: 5,
          comment: 'Best store ever',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('VENDOR_CANNOT_REVIEW');
    });

    it('rejects review when order does not belong to store being reviewed with 400 INVALID_STORE_ORDER', async () => {
      const { storeId: store1 } = await setupStoreWithVendor('store1_rel@example.com');
      const { storeId: store2 } = await setupStoreWithVendor('store2_rel@example.com');
      const { user: customer, cookie: customerCookie } = await registerCustomer('cust_rel@example.com');

      // Order belongs to store 1
      const order = await createDeliveredOrder(customer.id, store1);

      // Customer attempts to review specifying store 2
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order.id,
          storeId: store2,
          rating: 5,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STORE_ORDER');
    });

    it('rejects review on non-existent order with 404 ORDER_NOT_FOUND', async () => {
      const { cookie: customerCookie } = await registerCustomer('nonexistent_order@example.com');
      const fakeOrderId = '00000000-0000-4000-8000-000000000000';

      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: fakeOrderId,
          rating: 5,
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ORDER_NOT_FOUND');
    });

    it('enforces database-level unique constraint on orderId', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer } = await registerCustomer('db_uniq@example.com');
      const order = await createDeliveredOrder(customer.id, storeId);

      // Create first review directly
      await prisma.review.create({
        data: {
          orderId: order.id,
          userId: customer.id,
          storeId,
          rating: 4,
          comment: 'Direct review',
        },
      });

      // Attempt second review directly in DB
      await expect(
        prisma.review.create({
          data: {
            orderId: order.id,
            userId: customer.id,
            storeId,
            rating: 5,
            comment: 'Direct duplicate',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('3. Review Modification, Deletion & Rating Aggregation', () => {
    it('allows customer to update own review and recalculates store aggregates transactionally', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('cust_update@example.com');
      const order = await createDeliveredOrder(customer.id, storeId);

      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({
          orderId: order.id,
          rating: 2,
          comment: 'Food was cold',
        });
      expect(createRes.status).toBe(201);
      const reviewId = createRes.body.review.id;

      // Check initial aggregate
      let store = await prisma.store.findUnique({ where: { id: storeId } });
      expect(Number(store?.averageRating)).toBe(2.0);

      // Customer updates review
      const updateRes = await request(app)
        .patch(`/api/v1/reviews/${reviewId}`)
        .set('Cookie', customerCookie)
        .send({
          rating: 5,
          comment: 'Manager sent a fresh warm replacement, excellent support!',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.review.rating).toBe(5);
      expect(updateRes.body.review.comment).toContain('replacement');

      // Check updated aggregate
      store = await prisma.store.findUnique({ where: { id: storeId } });
      expect(Number(store?.averageRating)).toBe(5.0);
      expect(store?.totalReviews).toBe(1);
    });

    it('rejects another customer from modifying someone else review with 403', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer1, cookie: cookie1 } = await registerCustomer('owner@example.com');
      const { cookie: cookie2 } = await registerCustomer('intruder@example.com');

      const order = await createDeliveredOrder(customer1.id, storeId);
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', cookie1)
        .send({ orderId: order.id, rating: 5 });

      const reviewId = createRes.body.review.id;

      const modRes = await request(app)
        .patch(`/api/v1/reviews/${reviewId}`)
        .set('Cookie', cookie2)
        .send({ rating: 1 });

      expect(modRes.status).toBe(403);
    });

    it('rejects review update with empty body with 400', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie } = await registerCustomer('cust_empty_update@example.com');

      const order = await createDeliveredOrder(customer.id, storeId);
      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', cookie)
        .send({ orderId: order.id, rating: 5 });

      const reviewId = createRes.body.review.id;

      const emptyRes = await request(app)
        .patch(`/api/v1/reviews/${reviewId}`)
        .set('Cookie', cookie)
        .send({});

      expect(emptyRes.status).toBe(400);
    });

    it('allows customer to delete own review and re-aggregates store rating', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: customer, cookie: customerCookie } = await registerCustomer('cust_del@example.com');
      const order = await createDeliveredOrder(customer.id, storeId);

      const createRes = await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', customerCookie)
        .send({ orderId: order.id, rating: 4 });
      const reviewId = createRes.body.review.id;

      const delRes = await request(app)
        .delete(`/api/v1/reviews/${reviewId}`)
        .set('Cookie', customerCookie);

      expect(delRes.status).toBe(200);

      // Verify aggregates returned to 0
      const store = await prisma.store.findUnique({ where: { id: storeId } });
      expect(Number(store?.averageRating)).toBe(0.0);
      expect(store?.totalReviews).toBe(0);
    });

    it('exposes public store reviews with calculated average rating, review count, and sanitized names (no private orderId or userId)', async () => {
      const { storeId } = await setupStoreWithVendor();
      const { user: c1, cookie: cookie1 } = await registerCustomer('rev1@example.com', 'Sara', 'Khan');
      const { user: c2, cookie: cookie2 } = await registerCustomer('rev2@example.com', 'Bilal', 'Ahmed');

      const order1 = await createDeliveredOrder(c1.id, storeId);
      const order2 = await createDeliveredOrder(c2.id, storeId);

      await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', cookie1)
        .send({ orderId: order1.id, rating: 4, comment: 'Nice place' });

      await request(app)
        .post('/api/v1/reviews')
        .set('Cookie', cookie2)
        .send({ orderId: order2.id, rating: 5, comment: 'Amazing service' });

      const res = await request(app).get(`/api/v1/reviews/store/${storeId}`);
      expect(res.status).toBe(200);
      expect(res.body.reviewCount).toBe(2);
      expect(res.body.averageRating).toBe(4.5);
      expect(res.body.reviews).toHaveLength(2);
      expect(res.body.reviews[0].customerName).toMatch(/^(Sara K\.|Bilal A\.)$/);
      expect(res.body.reviews[0].customerEmail).toBeUndefined();
      expect(res.body.reviews[0].phone).toBeUndefined();
      // CRITICAL: Ensure private orderId and userId are never exposed in public reviews
      expect(res.body.reviews[0].orderId).toBeUndefined();
      expect(res.body.reviews[0].userId).toBeUndefined();

      // Also verify discovery route alias
      const discoveryRes = await request(app).get(`/api/v1/discovery/stores/${storeId}/reviews`);
      expect(discoveryRes.status).toBe(200);
      expect(discoveryRes.body.reviewCount).toBe(2);
      expect(discoveryRes.body.averageRating).toBe(4.5);
      expect(discoveryRes.body.reviews[0].orderId).toBeUndefined();
      expect(discoveryRes.body.reviews[0].userId).toBeUndefined();
    });
  });

  describe('4. Vendor Analytics & Tenant Isolation', () => {
    it('returns operational analytics for vendor stores', async () => {
      const { vendorCookie, storeId } = await setupStoreWithVendor('vendor_analytics@example.com');
      const { user: customer } = await registerCustomer('analytics_cust@example.com');

      // Order 1: Delivered (amount = 500)
      const order1 = await createDeliveredOrder(customer.id, storeId, 500);

      // Order 2: Delivered (amount = 700)
      const order2 = await createDeliveredOrder(customer.id, storeId, 700);

      // Order 3: Cancelled (amount = 300)
      await prisma.order.create({
        data: {
          userId: customer.id,
          storeId,
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
          subtotal: 200,
          deliveryFee: 100,
          totalAmount: 300,
        },
      });

      // Reviews: rating 4 and 5
      await prisma.review.create({
        data: {
          orderId: order1.id,
          userId: customer.id,
          storeId,
          rating: 4,
          comment: 'Good food',
        },
      });

      await prisma.review.create({
        data: {
          orderId: order2.id,
          userId: customer.id,
          storeId,
          rating: 5,
          comment: 'Great burger',
        },
      });

      const res = await request(app)
        .get('/api/v1/vendor/analytics?storeId=' + storeId)
        .set('Cookie', vendorCookie);

      expect(res.status).toBe(200);
      const analytics = res.body.analytics;
      expect(analytics.totalOrders).toBe(3);
      expect(analytics.deliveredOrders).toBe(2);
      expect(analytics.cancelledOrders).toBe(1);
      // Revenue strictly from DELIVERED orders: 500 + 700 = 1200
      expect(analytics.revenue).toBe(1200);
      // Average Order Value = 1200 / 2 = 600
      expect(analytics.averageOrderValue).toBe(600);
      // Average rating: (4 + 5) / 2 = 4.5
      expect(analytics.averageRating).toBe(4.5);
      expect(analytics.reviewCount).toBe(2);
      expect(analytics.recentReviews).toHaveLength(2);
      // Ensure private orderId and userId are not exposed in vendor analytics recentReviews
      expect(analytics.recentReviews[0].orderId).toBeUndefined();
      expect(analytics.recentReviews[0].userId).toBeUndefined();
    });

    it('enforces tenant isolation: vendor cannot query another vendor analytics', async () => {
      const { storeId: store1 } = await setupStoreWithVendor('vendorA@example.com');
      const { vendorCookie: vendor2Cookie } = await setupStoreWithVendor('vendorB@example.com');

      // Vendor 2 tries to access store 1 analytics
      const res = await request(app)
        .get(`/api/v1/vendor/analytics?storeId=${store1}`)
        .set('Cookie', vendor2Cookie);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('STORE_NOT_FOUND');
    });

    it('enforces tenant isolation: vendor cannot access another vendor reviews', async () => {
      const { storeId: store1 } = await setupStoreWithVendor('vendor1_rev@example.com');
      const { vendorCookie: vendor2Cookie } = await setupStoreWithVendor('vendor2_rev@example.com');

      const res = await request(app)
        .get(`/api/v1/vendor/reviews?storeId=${store1}`)
        .set('Cookie', vendor2Cookie);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('STORE_NOT_FOUND');
    });

    it('supports period filtering in analytics (today, last_7_days, last_30_days, all_time)', async () => {
      const { vendorCookie, storeId } = await setupStoreWithVendor('period_test@example.com');
      const { user: customer } = await registerCustomer('period_cust@example.com');

      // Order today
      const orderToday = await createDeliveredOrder(customer.id, storeId, 300);

      // Review today
      await prisma.review.create({
        data: {
          orderId: orderToday.id,
          userId: customer.id,
          storeId,
          rating: 5,
          comment: 'Today review',
        },
      });

      const resToday = await request(app)
        .get(`/api/v1/vendor/analytics?storeId=${storeId}&period=today`)
        .set('Cookie', vendorCookie);

      expect(resToday.status).toBe(200);
      expect(resToday.body.analytics.period).toBe('today');
      expect(resToday.body.analytics.deliveredOrders).toBe(1);
      expect(resToday.body.analytics.reviewCount).toBe(1);
      expect(resToday.body.analytics.recentReviews).toHaveLength(1);

      const resAll = await request(app)
        .get(`/api/v1/vendor/analytics?storeId=${storeId}&period=all_time`)
        .set('Cookie', vendorCookie);

      expect(resAll.status).toBe(200);
      expect(resAll.body.analytics.period).toBe('all_time');
      expect(resAll.body.analytics.deliveredOrders).toBe(1);
      expect(resAll.body.analytics.reviewCount).toBe(1);
    });
  });
});
