import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useLocationStore,
  DEFAULT_REFERENCE_LOCATION,
  type AuthoritativeLocation,
} from '../store/location.store';
import { useCurrentUser } from './useAuth';
import { useAddresses, useReverseGeocode } from './useAddresses';
import { toast } from './useToast';
import type { CustomerAddressDto } from '@geomarket/shared';

export function useAuthoritativeLocation() {
  const { data: user } = useCurrentUser();
  const { data: addresses, isLoading: addressesLoading } = useAddresses({ enabled: !!user });
  const reverseGeocodeMutation = useReverseGeocode();

  const activeLocation = useLocationStore((s) => s.activeLocation);
  const locationModalOpen = useLocationStore((s) => s.locationModalOpen);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setLocationModalOpen = useLocationStore((s) => s.setLocationModalOpen);
  const setLocationFromSavedAddress = useLocationStore((s) => s.setLocationFromSavedAddress);
  const setLocationFromGps = useLocationStore((s) => s.setLocationFromGps);
  const setLocationFromMap = useLocationStore((s) => s.setLocationFromMap);

  const [isLocating, setIsLocating] = useState(false);
  const initAttemptedRef = useRef(false);

  // Initial location resolution
  useEffect(() => {
    // If active location is already set (e.g. from localStorage persistence or previous interaction), do not re-request
    if (activeLocation) return;
    if (initAttemptedRef.current) return;

    // 1. If user is authenticated and has saved addresses, use the default address
    if (user && addresses && addresses.length > 0) {
      initAttemptedRef.current = true;
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setLocationFromSavedAddress(def);
      return;
    }

    // Wait until address loading finishes if user is logged in
    if (user && addressesLoading) return;

    // 2. Otherwise, attempt GPS once if available, or fall back to default reference location
    initAttemptedRef.current = true;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await reverseGeocodeMutation.mutateAsync({ latitude: lat, longitude: lng });
            const loc = res?.location;
            const label = loc?.addressLine
              ? `${loc.addressLine}${loc.city ? `, ${loc.city}` : ''}`
              : `Near your current location`;

            setLocationFromGps({
              latitude: lat,
              longitude: lng,
              label,
              addressLine: loc?.addressLine,
              city: loc?.city,
            });
          } catch {
            setLocationFromGps({
              latitude: lat,
              longitude: lng,
              label: `Current GPS Location`,
            });
          }
        },
        () => {
          // GPS unavailable or denied - set default reference location
          setLocation(DEFAULT_REFERENCE_LOCATION);
        },
        { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      setLocation(DEFAULT_REFERENCE_LOCATION);
    }
  }, [
    activeLocation,
    user,
    addresses,
    addressesLoading,
    reverseGeocodeMutation,
    setLocation,
    setLocationFromSavedAddress,
    setLocationFromGps,
  ]);

  // Explicit GPS detection handler
  const handleDetectGPS = useCallback(async () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support GPS location detection. Please select your location on the map.',
        variant: 'destructive',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await reverseGeocodeMutation.mutateAsync({ latitude: lat, longitude: lng });
          const loc = res?.location;
          const label = loc?.addressLine
            ? `${loc.addressLine}${loc.city ? `, ${loc.city}` : ''}`
            : `GPS Verified Location`;

          setLocationFromGps({
            latitude: lat,
            longitude: lng,
            label,
            addressLine: loc?.addressLine,
            city: loc?.city,
          });

          toast({
            title: 'Location updated',
            description: `Now showing stores delivering to ${label}`,
          });
        } catch {
          setLocationFromGps({
            latitude: lat,
            longitude: lng,
            label: `Current Delivery Location`,
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let message = 'Unable to detect your current location.';
        if (err.code === 1) {
          message = 'Location access was denied. Please allow location permissions or choose your location on the map.';
        } else if (err.code === 2) {
          message = 'Location information is currently unavailable.';
        } else if (err.code === 3) {
          message = 'Location request timed out. Please try again or choose on the map.';
        }
        toast({
          title: 'Location detection failed',
          description: message,
          variant: 'destructive',
        });
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [isLocating, reverseGeocodeMutation, setLocationFromGps]);

  const handleSelectSavedAddress = useCallback(
    (addr: CustomerAddressDto) => {
      setLocationFromSavedAddress(addr);
      toast({
        title: 'Delivery address selected',
        description: `Delivering to ${addr.addressLabel || addr.addressLine}`,
      });
    },
    [setLocationFromSavedAddress]
  );

  const handleSelectMapLocation = useCallback(
    (result: { latitude: number; longitude: number; label?: string; addressLine?: string; city?: string }) => {
      const label = result.addressLine
        ? `${result.addressLine}${result.city ? `, ${result.city}` : ''}`
        : (result.label && result.label !== 'Selected Pin' ? result.label : `Selected Delivery Location`);

      setLocationFromMap({
        latitude: result.latitude,
        longitude: result.longitude,
        label,
        addressLine: result.addressLine,
        city: result.city,
      });

      setLocationModalOpen(false);
      toast({
        title: 'Location updated',
        description: `Now showing stores delivering to ${label}`,
      });
    },
    [setLocationFromMap, setLocationModalOpen]
  );

  return {
    activeLocation,
    isLocating,
    locationModalOpen,
    setLocationModalOpen,
    handleDetectGPS,
    handleSelectSavedAddress,
    handleSelectMapLocation,
    setActiveLocation: setLocation,
    savedAddresses: addresses,
    isAuthenticated: !!user,
  };
}
