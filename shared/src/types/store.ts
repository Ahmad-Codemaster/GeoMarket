export enum StoreStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface StoreOperatingHoursDto {
  id: string;
  storeId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openingTime: string; // "HH:MM"
  closingTime: string; // "HH:MM"
  isClosed: boolean;
}

export interface OperatingHourItemDto {
  dayOfWeek: number;
  openingTime: string;
  closingTime: string;
  isClosed: boolean;
}

export interface StoreDto {
  id: string;
  vendorProfileId: string;
  storeCategoryId: string;
  storeCategory?: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  slug: string;
  description: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  baseDeliveryFee: number;
  minOrderAmount: number;
  status: StoreStatus;
  isActive: boolean;
  isAcceptingOrders: boolean;
  rejectionReason?: string | null;
  suspensionReason?: string | null;
  averageRating: number;
  totalReviews: number;
  operatingHours?: StoreOperatingHoursDto[];
  vendorProfile?: {
    id: string;
    businessLegalName: string;
    taxIdNumber?: string | null;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreDto {
  name: string;
  storeCategoryId: string;
  description?: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  deliveryRadiusKm: number;
  baseDeliveryFee?: number;
  minOrderAmount?: number;
}

export interface UpdateStoreDto {
  name?: string;
  storeCategoryId?: string;
  description?: string;
  imageUrl?: string | null;
  logoUrl?: string | null;
  addressLine?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  deliveryRadiusKm?: number;
  baseDeliveryFee?: number;
  minOrderAmount?: number;
}
