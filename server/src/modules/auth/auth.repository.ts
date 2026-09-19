import { prisma } from '../../lib/prisma';
import { UserRole } from '@geomarket/shared';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { vendorProfile: true },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { vendorProfile: true },
  });
}

export async function createCustomer(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      role: UserRole.CUSTOMER,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
    include: { vendorProfile: true },
  });
}

export async function createVendorWithProfile(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  businessLegalName: string;
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      role: UserRole.VENDOR,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      vendorProfile: {
        create: {
          businessLegalName: data.businessLegalName,
        },
      },
    },
    include: { vendorProfile: true },
  });
}
