import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { UserRole, JwtPayload, AuthUser } from '@geomarket/shared';
import {
  findUserByEmail,
  findUserById,
  createCustomer,
  createVendorWithProfile,
} from './auth.repository';
import type { RegisterCustomerInput, RegisterVendorInput, LoginInput, GuestSessionInput } from './auth.schemas';

const BCRYPT_COST_FACTOR = 12;

export function buildAuthUser(user: {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  isGuest?: boolean;
  vendorProfile: { id: string } | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isActive: user.isActive,
    isGuest: (user as any).isGuest ?? false,
    vendorProfileId: user.vendorProfile?.id ?? null,
  };
}

export function signToken(user: AuthUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    vendorProfileId: user.vendorProfileId,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export async function registerCustomer(input: RegisterCustomerInput): Promise<AuthUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST_FACTOR);

  const user = await createCustomer({
    email: input.email.toLowerCase().trim(),
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
  });

  return buildAuthUser(user);
}

export async function registerVendor(input: RegisterVendorInput): Promise<AuthUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST_FACTOR);

  const user = await createVendorWithProfile({
    email: input.email.toLowerCase().trim(),
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    businessLegalName: input.businessLegalName,
  });

  return buildAuthUser(user);
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const user = await findUserByEmail(input.email.toLowerCase().trim());

  // Use constant-time comparison to prevent email enumeration timing attacks
  const GENERIC_ERROR = new Error('INVALID_CREDENTIALS');

  if (!user || !user.isActive) {
    // Still hash to consume similar time
    await bcrypt.hash(input.password, BCRYPT_COST_FACTOR);
    throw GENERIC_ERROR;
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    throw GENERIC_ERROR;
  }

  return buildAuthUser(user);
}

export async function getAuthenticatedUser(userId: string): Promise<AuthUser | null> {
  const user = await findUserById(userId);
  if (!user || !user.isActive) return null;
  return buildAuthUser(user);
}

export async function createOrRestoreGuestSession(input?: GuestSessionInput): Promise<AuthUser> {
  const guestId = crypto.randomUUID().slice(0, 8);
  const email = input?.email || `guest_${guestId}@guest.geomarket.local`;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  const firstName = input?.firstName || 'Guest';
  const lastName = input?.lastName || 'Customer';
  const phone = input?.phone || '+923000000000';

  const user = await (prisma.user as any).create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      role: UserRole.CUSTOMER,
      firstName,
      lastName,
      phone,
      isGuest: true,
      isActive: true,
    },
    include: { vendorProfile: true },
  });

  return buildAuthUser(user);
}
