import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { UserRole } from '@geomarket/shared';
import bcrypt from 'bcrypt';

const app = createApp();

const TEST_CUSTOMER = {
  email: 'customer@test.com',
  password: 'SecurePassword123',
  firstName: 'Ali',
  lastName: 'Hassan',
  phone: '+923001234567',
};

const TEST_VENDOR = {
  email: 'vendor@test.com',
  password: 'SecurePassword123',
  firstName: 'Sara',
  lastName: 'Khan',
  phone: '+923009876543',
  businessLegalName: 'Chenab Bakery Ltd',
};

async function cleanDatabase() {
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

describe('Auth — Customer Registration', () => {
  it('registers a new customer successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/customer')
      .send(TEST_CUSTOMER);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(TEST_CUSTOMER.email);
    expect(res.body.user.role).toBe(UserRole.CUSTOMER);
    expect(res.body.user.vendorProfileId).toBeNull();
    // Password hash MUST NOT be returned
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('sets an HttpOnly cookie on customer registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/customer')
      .send(TEST_CUSTOMER);

    expect(res.status).toBe(201);
    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('HttpOnly');
    expect(cookieStr).toContain('SameSite=Lax');
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/v1/auth/register/customer').send(TEST_CUSTOMER);
    const res = await request(app).post('/api/v1/auth/register/customer').send(TEST_CUSTOMER);

    expect(res.status).toBe(409);
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/customer')
      .send({ ...TEST_CUSTOMER, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/customer')
      .send({ ...TEST_CUSTOMER, password: 'short' });

    expect(res.status).toBe(400);
  });
});

describe('Auth — Vendor Registration', () => {
  it('registers a new vendor with auto-created VendorProfile', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/vendor')
      .send(TEST_VENDOR);

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe(UserRole.VENDOR);
    // VendorProfile must be auto-created
    expect(res.body.user.vendorProfileId).toBeDefined();
    expect(res.body.user.vendorProfileId).not.toBeNull();
    // Password must not be returned
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('creates VendorProfile record in database', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/vendor')
      .send(TEST_VENDOR);

    const profile = await prisma.vendorProfile.findUnique({
      where: { id: res.body.user.vendorProfileId },
    });
    expect(profile).not.toBeNull();
    expect(profile?.businessLegalName).toBe(TEST_VENDOR.businessLegalName);
  });

  it('rejects vendor registration without businessLegalName', async () => {
    const { businessLegalName: _, ...withoutBusiness } = TEST_VENDOR;
    const res = await request(app)
      .post('/api/v1/auth/register/vendor')
      .send(withoutBusiness);

    expect(res.status).toBe(400);
  });

  it('stores a BCrypt hash and not the plain password', async () => {
    await request(app).post('/api/v1/auth/register/vendor').send(TEST_VENDOR);

    const user = await prisma.user.findUnique({
      where: { email: TEST_VENDOR.email },
    });
    expect(user).not.toBeNull();
    expect(user?.passwordHash).not.toBe(TEST_VENDOR.password);
    const isHash = await bcrypt.compare(TEST_VENDOR.password, user!.passwordHash);
    expect(isHash).toBe(true);
  });

  it('rejects duplicate email for vendor', async () => {
    await request(app).post('/api/v1/auth/register/vendor').send(TEST_VENDOR);
    const res = await request(app).post('/api/v1/auth/register/vendor').send(TEST_VENDOR);
    expect(res.status).toBe(409);
  });
});

describe('Auth — Login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register/customer').send(TEST_CUSTOMER);
  });

  it('logs in with valid credentials and returns cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_CUSTOMER.email, password: TEST_CUSTOMER.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    const setCookieHeader = res.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_CUSTOMER.email, password: 'WrongPassword123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('rejects login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'AnyPassword123' });

    expect(res.status).toBe(401);
  });

  it('does not reveal whether email exists on invalid login', async () => {
    const resExisting = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_CUSTOMER.email, password: 'WrongPass' });
    const resNonExisting = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'WrongPass' });

    expect(resExisting.body.error).toBe(resNonExisting.body.error);
  });
});

describe('Auth — Logout', () => {
  it('clears the authentication cookie on logout', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    const setCookieHeader = res.headers['set-cookie'];
    if (setCookieHeader) {
      const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
      expect(cookieStr).toContain('token=;');
    }
  });
});

describe('Auth — /me Endpoint', () => {
  it('returns authenticated user when cookie is valid', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register/customer').send(TEST_CUSTOMER);

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(TEST_CUSTOMER.email);
    expect(meRes.body.user.passwordHash).toBeUndefined();
  });

  it('returns 401 when no cookie is present', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 after logout', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/register/customer').send(TEST_CUSTOMER);
    await agent.post('/api/v1/auth/logout');
    const res = await agent.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('RBAC — Role Enforcement', () => {
  it('customer role is correctly assigned on customer registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/customer')
      .send(TEST_CUSTOMER);
    expect(res.body.user.role).toBe(UserRole.CUSTOMER);
  });

  it('vendor role is correctly assigned on vendor registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/vendor')
      .send(TEST_VENDOR);
    expect(res.body.user.role).toBe(UserRole.VENDOR);
  });

  it('ADMIN role cannot be self-registered via customer endpoint', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/customer')
      .send({ ...TEST_CUSTOMER, role: UserRole.ADMIN });

    // Either 400 (validation) or 201 with role forced to CUSTOMER
    if (res.status === 201) {
      expect(res.body.user.role).toBe(UserRole.CUSTOMER);
    } else {
      expect(res.status).toBe(400);
    }
  });

  it('ADMIN role cannot be self-registered via vendor endpoint', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/vendor')
      .send({ ...TEST_VENDOR, role: UserRole.ADMIN });

    if (res.status === 201) {
      expect(res.body.user.role).toBe(UserRole.VENDOR);
    } else {
      expect(res.status).toBe(400);
    }
  });
});

describe('Health Check', () => {
  it('returns 200 and database connected status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });
});
