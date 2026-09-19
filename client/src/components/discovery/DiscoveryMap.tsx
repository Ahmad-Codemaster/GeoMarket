import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getActiveMapTileProvider } from '../../lib/maps/mapTileProvider';
import type { DiscoveredStoreDto } from '@geomarket/shared';

interface DiscoveryMapProps {
  customerLocation: { latitude: number; longitude: number; label?: string };
  stores: DiscoveredStoreDto[];
  onSelectStore?: (storeId: string) => void;
}

function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Custom icon for customer pin
const customerPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icon for store pins
const storePinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function DiscoveryMap({ customerLocation, stores, onSelectStore }: DiscoveryMapProps) {
  const tileProvider = useMemo(() => getActiveMapTileProvider(), []);
  const tileConfig = tileProvider.getTileConfig();

  const center: [number, number] = [customerLocation.latitude, customerLocation.longitude];

  return (
    <div className="relative w-full h-[380px] md:h-[480px] rounded-xl overflow-hidden border border-border shadow-xs">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          url={tileConfig.urlTemplate}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
          minZoom={tileConfig.minZoom}
        />
        <MapViewController center={center} />

        {/* Customer Location Pin */}
        <Marker
          position={[customerLocation.latitude, customerLocation.longitude]}
          icon={customerPinIcon}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-bold text-foreground">Your Delivery Pin</p>
              <p className="text-muted-foreground">{customerLocation.label || 'Selected Location'}</p>
            </div>
          </Popup>
        </Marker>

        {/* Discovered Stores Pins & Delivery Perimeter Circles */}
        {stores.map((store) => (
          <React.Fragment key={store.storeId}>
            <Circle
              center={[store.latitude, store.longitude]}
              radius={store.deliveryRadiusKm * 1000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />
            <Marker
              position={[store.latitude, store.longitude]}
              icon={storePinIcon}
            >
              <Popup>
                <div className="text-xs space-y-1.5 p-0.5">
                  <p className="font-bold text-sm text-foreground">{store.storeName}</p>
                  <p className="text-muted-foreground">{store.address}, {store.city}</p>
                  <div className="flex items-center gap-2 pt-1 font-medium">
                    <span className="text-primary">{store.distanceKm.toFixed(1)} km away</span>
                    <span>•</span>
                    <span>Radius: {store.deliveryRadiusKm} km</span>
                  </div>
                  <div className="pt-1">
                    {onSelectStore ? (
                      <button
                        onClick={() => onSelectStore(store.storeId)}
                        className="text-accent underline font-medium hover:text-accent/80 cursor-pointer"
                      >
                        View Store Products
                      </button>
                    ) : null}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
