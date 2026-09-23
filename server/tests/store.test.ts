import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole, StoreStatus } from '@geomarket/shared';
import { env } from '../src/config/env';

const app = createApp();

const SAMPLE_STORE = {
  name: 'Chenab Bakery',
  description: 'Fresh artisanal baked goods and savories',
  addressLine: 'Plot 12, Main Boulevard, Gulberg III',
  city: 'Lahore',
  latitude: 31.5204,
  longitude: 74.3587,
  deliveryRadiusKm: 12.5,
  baseDeliveryFee: 150.0,
  minOrderAmount: 500.0,
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

async function registerVendor(email: string, legalName: string, taxId = 'TAX-998877') {
  const res = await request(app)
    .post('/api/v1/auth/register/vendor')
    .send({
      email,
      password: 'SecurePassword123!',
      firstName: 'Tariq',
      lastName: 'Jamil',
      phone: '+923001234567',
      businessLegalName: legalName,
      taxIdNumber: taxId,
    });

  // Update taxIdNumber if needed directly in DB since register endpoint may not accept it
  if (taxId && res.body.user?.vendorProfileId) {
    await prisma.vendorProfile.update({
      where: { id: res.body.user.vendorProfileId },
      data: { taxIdNumber: taxId },
    });
  }

  const cookie = res.headers['set-cookie'];
  return { user: res.body.user, cookie };
}

async function registerCustomer(email: string) {
  const res = await request(app)
    .post('/api/v1/auth/register/customer')
    .send({
      email,
      password: 'SecurePassword123!',
      firstName: 'Hamza',
      lastName: 'Ali',
      phone: '+923007654321',
    });

  const cookie = res.headers['set-cookie'];
  return { user: res.body.user, cookie };
}

async function createAdminUser() {
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@geomarket.test',
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
      email: 'admin@geomarket.test',
      password: 'AdminPassword123!',
    });

  const cookie = res.headers['set-cookie'];
  return { user, cookie };
}

async function createCategory(name = 'Bakery & Sweets', isActive = true) {
  return prisma.storeCategory.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: 'Bakeries and dessert shops',
      isActive,
    },
  });
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe('Phase 3: Physical Store Onboarding & Administration', () => {
  // =========================================================================
  // 1. Store Creation & Invariants
  // =========================================================================
  describe('Store Creation & Invariants', () => {
    it('vendor can create own store (initial status PENDING_APPROVAL, is_active: false)', async () => {
      const { cookie: vendorCookie } = await registerVendor('vendor1@test.com', 'Chenab Foods Ltd');
      const category = await createCategory();

      const res = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.store).toBeDefined();
      expect(res.body.store.name).toBe(SAMPLE_STORE.name);
      expect(res.body.store.slug).toBe('chenab-bakery');
      expect(res.body.store.status).toBe(StoreStatus.PENDING_APPROVAL);
      expect(res.body.store.isActive).toBe(false);
      expect(res.body.store.isAcceptingOrders).toBe(true);
      expect(res.body.store.deliveryRadiusKm).toBe(12.5);
    });

    it('generates collision-resistant unique slug for stores with same name', async () => {
      const { cookie: vendorCookie } = await registerVendor('vendor.slug@test.com', 'Slug Test Ltd');
      const category = await createCategory();

      const res1 = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
        });
      expect(res1.body.store.slug).toBe('chenab-bakery');

      const res2 = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
        });
      expect(res2.body.store.slug).toBe('chenab-bakery-2');

      const res3 = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
        });
      expect(res3.body.store.slug).toBe('chenab-bakery-3');
    });

    it('vendor cannot modify status or is_active on create or update', async () => {
      const { cookie: vendorCookie } = await registerVendor('vendor.invar@test.com', 'Invariant Bakery');
      const category = await createCategory();

      // Attempt privilege escalation during creation
      const resCreate = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
          status: 'APPROVED',
          isActive: true,
          is_active: true,
        });

      expect(resCreate.status).toBe(201);
      expect(resCreate.body.store.status).toBe(StoreStatus.PENDING_APPROVAL);
      expect(resCreate.body.store.isActive).toBe(false);

      const storeId = resCreate.body.store.id;

      // Attempt privilege escalation during update
      const resUpdate = await request(app)
        .put(`/api/v1/vendor/stores/${storeId}`)
        .set('Cookie', vendorCookie)
        .send({
          name: 'Chenab Bakery Updated',
          status: 'APPROVED',
          isActive: true,
          is_active: true,
        });

      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.store.name).toBe('Chenab Bakery Updated');
      expect(resUpdate.body.store.status).toBe(StoreStatus.PENDING_APPROVAL);
      expect(resUpdate.body.store.isActive).toBe(false);

      // Verify in DB directly
      const dbStore = await prisma.store.findUnique({ where: { id: storeId } });
      expect(dbStore?.status).toBe(StoreStatus.PENDING_APPROVAL);
      expect(dbStore?.isActive).toBe(false);
    });

    it('vendor can toggle is_accepting_orders', async () => {
      const { cookie: vendorCookie } = await registerVendor('vendor.toggle@test.com', 'Toggle Bakery');
      const category = await createCategory();

      const resCreate = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
        });

      const storeId = resCreate.body.store.id;
      expect(resCreate.body.store.isAcceptingOrders).toBe(true);

      // Toggle off
      const resToggleOff = await request(app)
        .patch(`/api/v1/vendor/stores/${storeId}/toggle-orders`)
        .set('Cookie', vendorCookie);

      expect(resToggleOff.status).toBe(200);
      expect(resToggleOff.body.store.isAcceptingOrders).toBe(false);

      // Toggle back on
      const resToggleOn = await request(app)
        .patch(`/api/v1/vendor/stores/${storeId}/toggle-orders`)
        .set('Cookie', vendorCookie);

      expect(resToggleOn.status).toBe(200);
      expect(resToggleOn.body.store.isAcceptingOrders).toBe(true);
    });
  });

  // =========================================================================
  // 2. Multi-Tenant Isolation
  // =========================================================================
  describe('Multi-Tenant Isolation', () => {
    it('vendor cannot access another vendor store (404 tenant isolation)', async () => {
      const { cookie: vendorACookie } = await registerVendor('vendor.a@test.com', 'Vendor A Ltd');
      const { cookie: vendorBCookie } = await registerVendor('vendor.b@test.com', 'Vendor B Ltd');
      const category = await createCategory();

      // Vendor A creates a store
      const storeA = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorACookie)
        .send({
          ...SAMPLE_STORE,
          name: 'Store Alpha',
          storeCategoryId: category.id,
        });

      const storeAId = storeA.body.store.id;

      // Vendor B attempts to GET store A
      const getRes = await request(app)
        .get(`/api/v1/vendor/stores/${storeAId}`)
        .set('Cookie', vendorBCookie);
      expect(getRes.status).toBe(404);

      // Vendor B attempts to PUT store A
      const putRes = await request(app)
        .put(`/api/v1/vendor/stores/${storeAId}`)
        .set('Cookie', vendorBCookie)
        .send({ name: 'Hacked Store' });
      expect(putRes.status).toBe(404);

      // Vendor B attempts to toggle orders on store A
      const toggleRes = await request(app)
        .patch(`/api/v1/vendor/stores/${storeAId}/toggle-orders`)
        .set('Cookie', vendorBCookie);
      expect(toggleRes.status).toBe(404);

      // Vendor B attempts to resubmit store A
      const resubmitRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeAId}/resubmit`)
        .set('Cookie', vendorBCookie);
      expect(resubmitRes.status).toBe(404);
    });
  });

  // =========================================================================
  // 3. Operating Hours Validation
  // =========================================================================
  describe('Operating Hours', () => {
    it('enforces opening_time < closing_time, rejects overnight schedules and duplicate days', async () => {
      const { cookie: vendorCookie } = await registerVendor('vendor.hours@test.com', 'Hours Bakery');
      const category = await createCategory();

      const storeRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
        });
      const storeId = storeRes.body.store.id;

      // Overnight schedule rejected (22:00 -> 02:00)
      const overnightRes = await request(app)
        .put(`/api/v1/vendor/stores/${storeId}/operating-hours`)
        .set('Cookie', vendorCookie)
        .send([
          {
            dayOfWeek: 1,
            openingTime: '22:00',
            closingTime: '02:00',
            isClosed: false,
          },
        ]);
      expect(overnightRes.status).toBe(400);

      // Equal opening and closing time when not closed rejected
      const equalRes = await request(app)
        .put(`/api/v1/vendor/stores/${storeId}/operating-hours`)
        .set('Cookie', vendorCookie)
        .send([
          {
            dayOfWeek: 1,
            openingTime: '10:00',
            closingTime: '10:00',
            isClosed: false,
          },
        ]);
      expect(equalRes.status).toBe(400);

      // Duplicate day_of_week rejected
      const duplicateRes = await request(app)
        .put(`/api/v1/vendor/stores/${storeId}/operating-hours`)
        .set('Cookie', vendorCookie)
        .send([
          {
            dayOfWeek: 1,
            openingTime: '09:00',
            closingTime: '17:00',
            isClosed: false,
          },
          {
            dayOfWeek: 1,
            openingTime: '10:00',
            closingTime: '18:00',
            isClosed: false,
          },
        ]);
      expect(duplicateRes.status).toBe(400);

      // Valid same-day schedule accepted (and closed days allowed)
      const validRes = await request(app)
        .put(`/api/v1/vendor/stores/${storeId}/operating-hours`)
        .set('Cookie', vendorCookie)
        .send([
          {
            dayOfWeek: 0,
            openingTime: '00:00',
            closingTime: '00:00',
            isClosed: true,
          },
          {
            dayOfWeek: 1,
            openingTime: '09:00',
            closingTime: '18:00',
            isClosed: false,
          },
          {
            dayOfWeek: 2,
            openingTime: '09:00',
            closingTime: '18:00',
            isClosed: false,
          },
        ]);

      expect(validRes.status).toBe(200);
      expect(validRes.body.operatingHours).toHaveLength(3);
      expect(validRes.body.operatingHours[0].dayOfWeek).toBe(0);
      expect(validRes.body.operatingHours[0].isClosed).toBe(true);
      expect(validRes.body.operatingHours[1].dayOfWeek).toBe(1);
      expect(validRes.body.operatingHours[1].openingTime).toBe('09:00');
      expect(validRes.body.operatingHours[1].closingTime).toBe('18:00');
    });
  });

  // =========================================================================
  // 4. Configurable Delivery Radius
  // =========================================================================
  describe('Delivery Radius', () => {
    it('delivery radius <= 0 rejected, > MAX_DELIVERY_RADIUS_KM rejected', async () => {
      const { cookie: vendorCookie } = await registerVendor('vendor.radius@test.com', 'Radius Bakery');
      const category = await createCategory();

      // <= 0 rejected
      const zeroRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
          deliveryRadiusKm: 0,
        });
      expect(zeroRes.status).toBe(400);

      const negativeRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
          deliveryRadiusKm: -5,
        });
      expect(negativeRes.status).toBe(400);

      // > MAX_DELIVERY_RADIUS_KM (env limit) rejected
      const overMaxRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
          deliveryRadiusKm: env.MAX_DELIVERY_RADIUS_KM + 1,
        });
      expect(overMaxRes.status).toBe(400);

      // Valid radius accepted
      const validRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({
          ...SAMPLE_STORE,
          storeCategoryId: category.id,
          deliveryRadiusKm: Math.min(30, env.MAX_DELIVERY_RADIUS_KM),
        });
      expect(validRes.status).toBe(201);
      expect(validRes.body.store.deliveryRadiusKm).toBe(Math.min(30, env.MAX_DELIVERY_RADIUS_KM));
    });
  });

  // =========================================================================
  // 5. Admin Store Management & FSM Transitions
  // =========================================================================
  describe('Admin Store Management & FSM Transitions', () => {
    it('admin can list all stores across vendors with legal details', async () => {
      const { cookie: vendor1Cookie } = await registerVendor('v1@test.com', 'Legal Vendor 1', 'TAX-111');
      const { cookie: vendor2Cookie } = await registerVendor('v2@test.com', 'Legal Vendor 2', 'TAX-222');
      const { cookie: adminCookie } = await createAdminUser();
      const category = await createCategory();

      await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendor1Cookie)
        .send({ ...SAMPLE_STORE, name: 'Store One', storeCategoryId: category.id, city: 'Lahore' });

      await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendor2Cookie)
        .send({ ...SAMPLE_STORE, name: 'Store Two', storeCategoryId: category.id, city: 'Karachi' });

      const adminRes = await request(app)
        .get('/api/v1/admin/stores')
        .set('Cookie', adminCookie);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.stores).toHaveLength(2);

      // Filter by city
      const filterRes = await request(app)
        .get('/api/v1/admin/stores?city=Karachi')
        .set('Cookie', adminCookie);

      expect(filterRes.status).toBe(200);
      expect(filterRes.body.stores).toHaveLength(1);
      expect(filterRes.body.stores[0].city).toBe('Karachi');
      expect(filterRes.body.stores[0].vendorProfile?.businessLegalName).toBe('Legal Vendor 2');
      expect(filterRes.body.stores[0].vendorProfile?.taxIdNumber).toBe('TAX-222');
    });

    it('admin can approve store (status: APPROVED, is_active: true)', async () => {
      const { cookie: vendorCookie } = await registerVendor('v.app@test.com', 'Approval Vendor');
      const { cookie: adminCookie } = await createAdminUser();
      const category = await createCategory();

      const storeRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({ ...SAMPLE_STORE, storeCategoryId: category.id });
      const storeId = storeRes.body.store.id;

      const approveRes = await request(app)
        .post(`/api/v1/admin/stores/${storeId}/approve`)
        .set('Cookie', adminCookie);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.store.status).toBe(StoreStatus.APPROVED);
      expect(approveRes.body.store.isActive).toBe(true);

      // Database check
      const dbStore = await prisma.store.findUnique({ where: { id: storeId } });
      expect(dbStore?.status).toBe(StoreStatus.APPROVED);
      expect(dbStore?.isActive).toBe(true);
    });

    it('admin rejection without reason rejected (400), with reason succeeds', async () => {
      const { cookie: vendorCookie } = await registerVendor('v.rej@test.com', 'Reject Vendor');
      const { cookie: adminCookie } = await createAdminUser();
      const category = await createCategory();

      const storeRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({ ...SAMPLE_STORE, storeCategoryId: category.id });
      const storeId = storeRes.body.store.id;

      // Without reason
      const noReasonRes = await request(app)
        .post(`/api/v1/admin/stores/${storeId}/reject`)
        .set('Cookie', adminCookie)
        .send({});
      expect(noReasonRes.status).toBe(400);

      // Too short reason (< 5 chars)
      const shortReasonRes = await request(app)
        .post(`/api/v1/admin/stores/${storeId}/reject`)
        .set('Cookie', adminCookie)
        .send({ reason: 'bad' });
      expect(shortReasonRes.status).toBe(400);

      // With valid reason
      const validRejectRes = await request(app)
        .post(`/api/v1/admin/stores/${storeId}/reject`)
        .set('Cookie', adminCookie)
        .send({ reason: 'Invalid business address documentation provided' });

      expect(validRejectRes.status).toBe(200);
      expect(validRejectRes.body.store.status).toBe(StoreStatus.REJECTED);
      expect(validRejectRes.body.store.isActive).toBe(false);
      expect(validRejectRes.body.store.rejectionReason).toBe('Invalid business address documentation provided');
    });

    it('rejected store can be resubmitted by vendor (returns to PENDING_APPROVAL, is_active: false)', async () => {
      const { cookie: vendorCookie } = await registerVendor('v.resub@test.com', 'Resubmit Vendor');
      const { cookie: adminCookie } = await createAdminUser();
      const category = await createCategory();

      const storeRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({ ...SAMPLE_STORE, storeCategoryId: category.id });
      const storeId = storeRes.body.store.id;

      // Reject store
      await request(app)
        .post(`/api/v1/admin/stores/${storeId}/reject`)
        .set('Cookie', adminCookie)
        .send({ reason: 'Please provide updated utility bill for verification' });

      // Resubmit store
      const resubmitRes = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/resubmit`)
        .set('Cookie', vendorCookie);

      expect(resubmitRes.status).toBe(200);
      expect(resubmitRes.body.store.status).toBe(StoreStatus.PENDING_APPROVAL);
      expect(resubmitRes.body.store.isActive).toBe(false);

      // Resubmitting non-rejected store returns 400
      const duplicateResubmit = await request(app)
        .post(`/api/v1/vendor/stores/${storeId}/resubmit`)
        .set('Cookie', vendorCookie);
      expect(duplicateResubmit.status).toBe(400);
    });

    it('admin can suspend approved store with reason and restore it', async () => {
      const { cookie: vendorCookie } = await registerVendor('v.susp@test.com', 'Suspend Vendor');
      const { cookie: adminCookie } = await createAdminUser();
      const category = await createCategory();

      const storeRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', vendorCookie)
        .send({ ...SAMPLE_STORE, storeCategoryId: category.id });
      const storeId = storeRes.body.store.id;

      // Approve store first
      await request(app)
        .post(`/api/v1/admin/stores/${storeId}/approve`)
        .set('Cookie', adminCookie);

      // Suspend without reason (rejected 400)
      const invalidSusp = await request(app)
        .post(`/api/v1/admin/stores/${storeId}/suspend`)
        .set('Cookie', adminCookie)
        .send({});
      expect(invalidSusp.status).toBe(400);

      // Suspend with valid reason
      const suspRes = await request(app)
        .post(`/api/v1/admin/stores/${storeId}/suspend`)
        .set('Cookie', adminCookie)
        .send({ reason: 'Repeated customer complaints regarding food hygiene' });

      expect(suspRes.status).toBe(200);
      expect(suspRes.body.store.status).toBe(StoreStatus.SUSPENDED);
      expect(suspRes.body.store.isActive).toBe(false);
      expect(suspRes.body.store.suspensionReason).toBe('Repeated customer complaints regarding food hygiene');

      // Restore suspended store
      const restoreRes = await request(app)
        .post(`/api/v1/admin/stores/${storeId}/restore`)
        .set('Cookie', adminCookie);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.store.status).toBe(StoreStatus.APPROVED);
      expect(restoreRes.body.store.isActive).toBe(true);
      expect(restoreRes.body.store.suspensionReason).toBeNull();
    });
  });

  // =========================================================================
  // 6. Admin Category CRUD & Public Active Categories
  // =========================================================================
  describe('Category Management', () => {
    it('admin category CRUD works and public can list active store categories', async () => {
      const { cookie: adminCookie } = await createAdminUser();

      // Create Store Category
      const createRes = await request(app)
        .post('/api/v1/admin/categories/stores')
        .set('Cookie', adminCookie)
        .send({
          name: 'Pharmacy & Medical',
          description: 'Medicines and healthcare products',
          iconUrl: 'https://example.com/icons/pharmacy.png',
          isActive: true,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.category.name).toBe('Pharmacy & Medical');
      expect(createRes.body.category.slug).toBe('pharmacy-medical');
      expect(createRes.body.category.isActive).toBe(true);

      const categoryId = createRes.body.category.id;

      // Update Store Category
      const updateRes = await request(app)
        .put(`/api/v1/admin/categories/stores/${categoryId}`)
        .set('Cookie', adminCookie)
        .send({
          name: 'Pharmacy & Healthcare',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.category.name).toBe('Pharmacy & Healthcare');
      expect(updateRes.body.category.slug).toBe('pharmacy-healthcare');

      // Create inactive category
      await request(app)
        .post('/api/v1/admin/categories/stores')
        .set('Cookie', adminCookie)
        .send({
          name: 'Inactive Test Category',
          isActive: false,
        });

      // Public endpoint: only active categories
      const publicRes = await request(app).get('/api/v1/categories/stores');
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.categories).toBeDefined();
      const names = publicRes.body.categories.map((c: any) => c.name);
      expect(names).toContain('Pharmacy & Healthcare');
      expect(names).not.toContain('Inactive Test Category');

      // Admin can delete unused category
      const deleteRes = await request(app)
        .delete(`/api/v1/admin/categories/stores/${categoryId}`)
        .set('Cookie', adminCookie);

      expect(deleteRes.status).toBe(200);

      // Verify deleted
      const getDeletedRes = await request(app)
        .get(`/api/v1/admin/categories/stores/${categoryId}`)
        .set('Cookie', adminCookie);
      expect(getDeletedRes.status).toBe(404);
    });
  });

  // =========================================================================
  // 7. Role-Based Access Control (RBAC)
  // =========================================================================
  describe('Role-Based Access Control (RBAC)', () => {
    it('Customer rejected from /vendor/stores (403), Vendor rejected from /admin/stores (403)', async () => {
      const { cookie: customerCookie } = await registerCustomer('customer.rbac@test.com');
      const { cookie: vendorCookie } = await registerVendor('vendor.rbac@test.com', 'RBAC Bakery');

      // Customer tries to access vendor store routes -> 403
      const customerVendorRes = await request(app)
        .get('/api/v1/vendor/stores')
        .set('Cookie', customerCookie);
      expect(customerVendorRes.status).toBe(403);

      const customerCreateRes = await request(app)
        .post('/api/v1/vendor/stores')
        .set('Cookie', customerCookie)
        .send(SAMPLE_STORE);
      expect(customerCreateRes.status).toBe(403);

      // Vendor tries to access admin store routes -> 403
      const vendorAdminRes = await request(app)
        .get('/api/v1/admin/stores')
        .set('Cookie', vendorCookie);
      expect(vendorAdminRes.status).toBe(403);

      // Vendor tries to access admin category routes -> 403
      const vendorCategoryRes = await request(app)
        .post('/api/v1/admin/categories/stores')
        .set('Cookie', vendorCookie)
        .send({ name: 'Hacked Category' });
      expect(vendorCategoryRes.status).toBe(403);

      // Unauthenticated request -> 401
      const unauthRes = await request(app).get('/api/v1/vendor/stores');
      expect(unauthRes.status).toBe(401);
    });
  });
});
