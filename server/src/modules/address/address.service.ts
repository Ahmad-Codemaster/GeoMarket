import * as addressRepo from './address.repository';
import { CreateAddressInput, UpdateAddressInput } from './address.schemas';
import { CustomerAddressDto } from '@geomarket/shared';
import { CustomerAddress } from '@prisma/client';

export function formatAddress(address: CustomerAddress): CustomerAddressDto {
  return {
    id: address.id,
    userId: address.userId,
    addressLabel: address.addressLabel,
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    addressLine: address.addressLine,
    city: address.city,
    latitude: Number(address.latitude),
    longitude: Number(address.longitude),
    isDefault: address.isDefault,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

export async function createAddress(
  userId: string,
  input: CreateAddressInput,
): Promise<CustomerAddressDto> {
  const existingCount = await addressRepo.countUserAddresses(userId);

  // If this is the customer's first address, it automatically defaults to true
  const isDefault = existingCount === 0 ? true : input.isDefault;

  const address = await addressRepo.createAddress(userId, {
    addressLabel: input.addressLabel,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    addressLine: input.addressLine,
    city: input.city,
    latitude: input.latitude,
    longitude: input.longitude,
    isDefault,
  });

  return formatAddress(address);
}

export async function getAddresses(userId: string): Promise<CustomerAddressDto[]> {
  const addresses = await addressRepo.findAddressesByUserId(userId);
  return addresses.map(formatAddress);
}

export async function getAddressById(
  id: string,
  userId: string,
): Promise<CustomerAddressDto> {
  const address = await addressRepo.findAddressByIdAndUserId(id, userId);
  if (!address) {
    throw new Error('ADDRESS_NOT_FOUND');
  }
  return formatAddress(address);
}

export async function updateAddress(
  id: string,
  userId: string,
  input: UpdateAddressInput,
): Promise<CustomerAddressDto> {
  const updated = await addressRepo.updateAddress(id, userId, input);
  if (!updated) {
    throw new Error('ADDRESS_NOT_FOUND');
  }
  return formatAddress(updated);
}

export async function setDefaultAddress(
  id: string,
  userId: string,
): Promise<CustomerAddressDto> {
  const updated = await addressRepo.setDefaultAddress(id, userId);
  if (!updated) {
    throw new Error('ADDRESS_NOT_FOUND');
  }
  return formatAddress(updated);
}

export async function deleteAddress(
  id: string,
  userId: string,
): Promise<void> {
  const deleted = await addressRepo.deleteAddress(id, userId);
  if (!deleted) {
    throw new Error('ADDRESS_NOT_FOUND');
  }
}
