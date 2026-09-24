import React from 'react';
import { CartDrawer } from '../cart/CartDrawer';
import { LocationPickerModal } from '../location/LocationPickerModal';
import { useAuthoritativeLocation } from '../../hooks/useAuthoritativeLocation';

export function GlobalOverlays() {
  const { locationModalOpen, setLocationModalOpen, handleSelectMapLocation } = useAuthoritativeLocation();

  return (
    <>
      <CartDrawer />
      {locationModalOpen && (
        <LocationPickerModal
          open={locationModalOpen}
          onOpenChange={setLocationModalOpen}
          onSelectCoordinates={handleSelectMapLocation}
        />
      )}
    </>
  );
}

export default GlobalOverlays;
