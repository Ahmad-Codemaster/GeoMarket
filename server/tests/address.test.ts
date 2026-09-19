import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole } from '@geomarket/shared';

// Ensure mock provider is active for tests
process.env.GEOCODING_PROVIDER = 'mock';

const app = createApp();

const CUSTOMER_A = {
  email: 'customer.a@test.com',
  password: 'Password123!',
  firstName: 'Customer',
  lastName: 'Alpha',
  phone: '+923001111111',
};

const CUSTOMER_B = {
  email: 'customer.b@test.com',
  password: 'Password123!',
  firstName: 'Customer',
  lastName: 'Beta',
  phone: '+923002222222',
};

const VENDOR_USER = {
  email: 'vendor.address@test.com',
  password: 'Password123!',
  firstName: 'Vendor',
  lastName: 'User',
  phone: '+923003333333',
  businessLegalName: 'Vendor Store Ltd',
};

const SAMPLE_ADDRESS_1 = {
  addressLabel: 'Home',
  recipientName: 'Ali Khan',
  recipientPhone: '+923001234567',
  addressLine: 'House 14, Street 2, Peoples Colony',
  city: 'Faisalabad',
  latitude: 31.4124,
  longitude: 73.1091,
  isDefault: false,
};

const SAMPLE_ADDRESS_2 = {
  addressLabel: 'Office',
  recipientName: 'Ali Khan',
  recipientPhone: '+923001234567',
  addressLine: 'Office 402, Chenab Tower',
  city: 'Faisalabad',
  latitude: 31.428,
  longitude: 73.085,
  isDefault: true,
};

async function cleanDatabase() {
  await prisma.customerAddress.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe('Phase 2 — Customer Addresses & Location Abstractions', () => {
  describe('Address Creation & Default Promotion Invariant', () => {
    it('TEST-ADDR-001: Customer creates first address with isDefault:false — auto-promoted to isDefault:true', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const res = await agent.post('/api/v1/addresses').send(SAMPLE_ADDRESS_1);

      expect(res.status).toBe(201);
      expect(res.body.address).toBeDefined();
      expect(res.body.address.addressLabel).toBe('Home');
      expect(res.body.address.latitude).toBe(SAMPLE_ADDRESS_1.latitude);
      expect(res.body.address.longitude).toBe(SAMPLE_ADDRESS_1.longitude);
      // Auto-promoted because it is the customer's very first address
      expect(res.body.address.isDefault).toBe(true);
    });

    it('TEST-ADDR-002: Customer creates second address with isDefault:true — previous address demoted', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      // Create address 1 (auto-default)
      const res1 = await agent.post('/api/v1/addresses').send(SAMPLE_ADDRESS_1);
      expect(res1.body.address.isDefault).toBe(true);
      const addr1Id = res1.body.address.id;

      // Create address 2 with isDefault: true
      const res2 = await agent.post('/api/v1/addresses').send(SAMPLE_ADDRESS_2);
      expect(res2.status).toBe(201);
      expect(res2.body.address.isDefault).toBe(true);

      // Verify in DB that address 1 is now isDefault: false
      const addr1Updated = await prisma.customerAddress.findUnique({
        where: { id: addr1Id },
      });
      expect(addr1Updated?.isDefault).toBe(false);
    });
  });

  describe('Address Reading & Tenant Isolation', () => {
    it('TEST-ADDR-003: Customer lists only own saved addresses', async () => {
      const agentA = request.agent(app);
      await agentA.post('/api/v1/auth/register/customer').send(CUSTOMER_A);
      await agentA.post('/api/v1/addresses').send(SAMPLE_ADDRESS_1);

      const agentB = request.agent(app);
      await agentB.post('/api/v1/auth/register/customer').send(CUSTOMER_B);
      await agentB.post('/api/v1/addresses').send(SAMPLE_ADDRESS_2);

      const resA = await agentA.get('/api/v1/addresses');
      expect(resA.status).toBe(200);
      expect(resA.body.addresses).toHaveLength(1);
      expect(resA.body.addresses[0].addressLabel).toBe(SAMPLE_ADDRESS_1.addressLabel);

      const resB = await agentB.get('/api/v1/addresses');
      expect(resB.status).toBe(200);
      expect(resB.body.addresses).toHaveLength(1);
      expect(resB.body.addresses[0].addressLabel).toBe(SAMPLE_ADDRESS_2.addressLabel);
    });

    it('TEST-ADDR-004: Customer fetches single owned address by ID', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);
      const createRes = await agent.post('/api/v1/addresses').send(SAMPLE_ADDRESS_1);
      const addrId = createRes.body.address.id;

      const res = await agent.get(`/api/v1/addresses/${addrId}`);
      expect(res.status).toBe(200);
      expect(res.body.address.id).toBe(addrId);
      expect(res.body.address.city).toBe('Faisalabad');
    });

    it('TEST-ADDR-005: Customer A cannot fetch Customer B address (404 tenant isolation)', async () => {
      const agentA = request.agent(app);
      await agentA.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const agentB = request.agent(app);
      await agentB.post('/api/v1/auth/register/customer').send(CUSTOMER_B);
      const createResB = await agentB.post('/api/v1/addresses').send(SAMPLE_ADDRESS_2);
      const addrBId = createResB.body.address.id;

      // Customer A tries to read Customer B's address
      const res = await agentA.get(`/api/v1/addresses/${addrBId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Address not found');
    });
  });

  describe('Address Mutation & Deletion Tenant Isolation', () => {
    it('TEST-ADDR-006: Customer updates own address successfully', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);
      const createRes = await agent.post('/api/v1/addresses').send(SAMPLE_ADDRESS_1);
      const addrId = createRes.body.address.id;

      const res = await agent
        .put(`/api/v1/addresses/${addrId}`)
        .send({ addressLine: 'Updated Street 99', city: 'Faisalabad' });

      expect(res.status).toBe(200);
      expect(res.body.address.addressLine).toBe('Updated Street 99');
    });

    it('TEST-ADDR-007: Customer A cannot update Customer B address (404 tenant isolation)', async () => {
      const agentA = request.agent(app);
      await agentA.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const agentB = request.agent(app);
      await agentB.post('/api/v1/auth/register/customer').send(CUSTOMER_B);
      const createResB = await agentB.post('/api/v1/addresses').send(SAMPLE_ADDRESS_2);
      const addrBId = createResB.body.address.id;

      const res = await agentA
        .put(`/api/v1/addresses/${addrBId}`)
        .send({ addressLine: 'Tampered Address' });

      expect(res.status).toBe(404);

      // Verify B's address is untouched in DB
      const dbB = await prisma.customerAddress.findUnique({ where: { id: addrBId } });
      expect(dbB?.addressLine).toBe(SAMPLE_ADDRESS_2.addressLine);
    });

    it('TEST-ADDR-008: Customer deletes own address successfully', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);
      const createRes = await agent.post('/api/v1/addresses').send(SAMPLE_ADDRESS_1);
      const addrId = createRes.body.address.id;

      const res = await agent.delete(`/api/v1/addresses/${addrId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Address deleted successfully');

      const inDb = await prisma.customerAddress.findUnique({ where: { id: addrId } });
      expect(inDb).toBeNull();
    });

    it('TEST-ADDR-009: Customer A cannot delete Customer B address (404 tenant isolation)', async () => {
      const agentA = request.agent(app);
      await agentA.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const agentB = request.agent(app);
      await agentB.post('/api/v1/auth/register/customer').send(CUSTOMER_B);
      const createResB = await agentB.post('/api/v1/addresses').send(SAMPLE_ADDRESS_2);
      const addrBId = createResB.body.address.id;

      const res = await agentA.delete(`/api/v1/addresses/${addrBId}`);
      expect(res.status).toBe(404);

      // Verify B's address still exists
      const inDb = await prisma.customerAddress.findUnique({ where: { id: addrBId } });
      expect(inDb).not.toBeNull();
    });
  });

  describe('Validation & Boundary Checks', () => {
    it('TEST-ADDR-010: Rejects out-of-range latitude (> 90)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const res = await agent
        .post('/api/v1/addresses')
        .send({ ...SAMPLE_ADDRESS_1, latitude: 95.5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('TEST-ADDR-011: Rejects missing city', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const { city: _, ...withoutCity } = SAMPLE_ADDRESS_1;
      const res = await agent.post('/api/v1/addresses').send(withoutCity);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('TEST-ADDR-012: Sets default address via PATCH /addresses/:id/default', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      // Create addr 1 (becomes default)
      const res1 = await agent.post('/api/v1/addresses').send(SAMPLE_ADDRESS_1);
      const addr1Id = res1.body.address.id;

      // Create addr 2 (isDefault: false)
      const res2 = await agent.post('/api/v1/addresses').send({ ...SAMPLE_ADDRESS_2, isDefault: false });
      const addr2Id = res2.body.address.id;
      expect(res2.body.address.isDefault).toBe(false);

      // Promote addr 2 to default
      const patchRes = await agent.patch(`/api/v1/addresses/${addr2Id}/default`);
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.address.isDefault).toBe(true);

      // Check that addr 1 is now demoted
      const addr1Db = await prisma.customerAddress.findUnique({ where: { id: addr1Id } });
      expect(addr1Db?.isDefault).toBe(false);
    });
  });

  describe('RBAC & Route Protection', () => {
    it('TEST-ADDR-013: Rejects vendor role from accessing /addresses (403 Forbidden)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/vendor').send(VENDOR_USER);

      const res = await agent.get('/api/v1/addresses');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient permissions');
    });

    it('TEST-ADDR-014: Rejects unauthenticated requests to /addresses (401)', async () => {
      const res = await request(app).get('/api/v1/addresses');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('Location Provider Endpoints (Reverse & Forward Geocoding)', () => {
    it('TEST-ADDR-015: Reverse geocodes coordinates via MockGeocodingProvider', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const res = await agent
        .post('/api/v1/location/reverse')
        .send({ latitude: 31.4124, longitude: 73.1091 });

      expect(res.status).toBe(200);
      expect(res.body.location).toBeDefined();
      expect(res.body.location.city).toBe('Faisalabad');
      expect(res.body.location.latitude).toBe(31.4124);
      expect(res.body.location.longitude).toBe(73.1091);
      expect(res.body.location.formattedAddress).toContain('Faisalabad');
    });

    it('TEST-ADDR-016: Forward geocodes text query via MockGeocodingProvider', async () => {
      const agent = request.agent(app);
      await agent.post('/api/v1/auth/register/customer').send(CUSTOMER_A);

      const res = await agent
        .post('/api/v1/location/forward')
        .send({ query: 'D Ground, Faisalabad' });

      expect(res.status).toBe(200);
      expect(res.body.locations).toBeInstanceOf(Array);
      expect(res.body.locations.length).toBeGreaterThan(0);
      expect(res.body.locations[0].city).toBe('Faisalabad');
      expect(res.body.locations[0].latitude).toBe(31.4124);
    });
  });
});
