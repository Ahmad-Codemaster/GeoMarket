export interface CustomerAddressDto {
  id: string;
  userId: string;
  addressLabel: string;
  recipientName: string | null;
  recipientPhone: string | null;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressDto {
  addressLabel: string;
  recipientName?: string;
  recipientPhone?: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  addressLabel?: string;
  recipientName?: string;
  recipientPhone?: string;
  addressLine?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface GeocodingResultDto {
  formattedAddress: string;
  addressLine: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  providerMetadata?: Record<string, unknown>;
}

export interface ReverseGeocodeDto {
  latitude: number;
  longitude: number;
}

export interface ForwardGeocodeDto {
  query: string;
  limit?: number;
}

export interface MapTileConfigDto {
  urlTemplate: string;
  attribution: string;
  subdomains?: string[];
  maxZoom: number;
  minZoom: number;
  tileSize?: number;
}
