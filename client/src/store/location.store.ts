import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerAddressDto } from '@geomarket/shared';

export type AuthoritativeLocationSource =
  | 'gps'
  | 'map'
  | 'saved_address'
  | 'default'
  | 'geocoded'
  | 'demo';

export interface AuthoritativeLocation {
  latitude: number;
  longitude: number;
  label: string;
  addressLine?: string;
  city?: string;
  source: AuthoritativeLocationSource;
}

interface LocationStore {
  activeLocation: AuthoritativeLocation | null;
  locationModalOpen: boolean;
  setLocationModalOpen: (open: boolean) => void;
  setLocation: (loc: AuthoritativeLocation) => void;
  clearLocation: () => void;
  setLocationFromGps: (coords: {
    latitude: number;
    longitude: number;
    label?: string;
    addressLine?: string;
    city?: string;
  }) => void;
  setLocationFromSavedAddress: (address: CustomerAddressDto) => void;
  setLocationFromMap: (coords: {
    latitude: number;
    longitude: number;
    label?: string;
    addressLine?: string;
    city?: string;
  }) => void;
}

export const DEFAULT_REFERENCE_LOCATION: AuthoritativeLocation = {
  latitude: 31.4200,
  longitude: 73.1200,
  label: 'Peoples Colony, Faisalabad',
  addressLine: 'Peoples Colony No. 1, Faisalabad',
  city: 'Faisalabad',
  source: 'default',
};

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      activeLocation: null,
      locationModalOpen: false,
      setLocationModalOpen: (open) => set({ locationModalOpen: open }),
      setLocation: (loc) => set({ activeLocation: loc }),
      clearLocation: () => set({ activeLocation: null }),
      setLocationFromGps: ({ latitude, longitude, label, addressLine, city }) =>
        set({
          activeLocation: {
            latitude,
            longitude,
            label:
              label ||
              (addressLine
                ? `${addressLine}${city ? `, ${city}` : ''}`
                : 'Current Delivery Location'),
            addressLine,
            city,
            source: 'gps',
          },
        }),
      setLocationFromSavedAddress: (address) =>
        set({
          activeLocation: {
            latitude: Number(address.latitude),
            longitude: Number(address.longitude),
            label:
              address.addressLabel && address.city
                ? `${address.addressLabel} (${address.city})`
                : address.addressLabel || address.addressLine || 'Saved Address',
            addressLine: address.addressLine,
            city: address.city,
            source: 'saved_address',
          },
        }),
      setLocationFromMap: ({ latitude, longitude, label, addressLine, city }) =>
        set({
          activeLocation: {
            latitude,
            longitude,
            label:
              label ||
              (addressLine
                ? `${addressLine}${city ? `, ${city}` : ''}`
                : 'Selected Delivery Pin'),
            addressLine,
            city,
            source: 'map',
          },
        }),
    }),
    {
      name: 'geomarket_customer_location',
      partialize: (state) => ({ activeLocation: state.activeLocation }),
    }
  )
);
