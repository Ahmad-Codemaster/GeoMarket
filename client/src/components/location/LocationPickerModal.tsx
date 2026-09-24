import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Loader2, Compass, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getActiveMapTileProvider } from '../../lib/maps/mapTileProvider';
import { useReverseGeocode, useForwardGeocode, useCreateAddress } from '../../hooks/useAddresses';
import { toast } from '../../hooks/useToast';
import type { GeocodingResultDto } from '@geomarket/shared';

interface LocationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressCreated?: () => void;
  onSelectCoordinates?: (coords: {
    latitude: number;
    longitude: number;
    label: string;
    addressLine?: string;
    city?: string;
  }) => void;
}


// Default initial centroid: Faisalabad, Pakistan (Peoples Colony)
const DEFAULT_LAT = 31.4200;
const DEFAULT_LON = 73.1200;

function MapEventHandler({
  onPositionChange,
}: {
  onPositionChange: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function LocationPickerModal({
  open,
  onOpenChange,
  onAddressCreated,
  onSelectCoordinates,
}: LocationPickerModalProps) {
  const tileProvider = useMemo(() => getActiveMapTileProvider(), []);
  const tileConfig = tileProvider.getTileConfig();

  const [position, setPosition] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LON]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResultDto[]>([]);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const reverseGeocodeMutation = useReverseGeocode();
  const forwardGeocodeMutation = useForwardGeocode();
  const createAddressMutation = useCreateAddress();

  const markerRef = useRef<L.Marker | null>(null);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Trigger reverse geocoding when position changes
  const handlePositionChange = async (lat: number, lon: number) => {
    setPosition([lat, lon]);
    try {
      const res = await reverseGeocodeMutation.mutateAsync({ latitude: lat, longitude: lon });
      if (res?.location) {
        setAddressLine(res.location.addressLine || '');
        setCity(res.location.city || '');
      }
    } catch {
      // Keep manual input available if geocoder fails
    }
  };

  // Browser GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation unavailable', description: 'Browser does not support geolocation.' });
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await handlePositionChange(pos.coords.latitude, pos.coords.longitude);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        toast({ title: 'Location access denied', description: 'Please choose on the map manually.' });
      },
      { timeout: 8000 },
    );
  };

  // Text search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const res = await forwardGeocodeMutation.mutateAsync({ query: searchQuery.trim(), limit: 5 });
      if (res?.locations?.length) {
        setSearchResults(res.locations);
        const first = res.locations[0];
        setPosition([first.latitude, first.longitude]);
        setAddressLine(first.addressLine || '');
        setCity(first.city || '');
      } else {
        toast({ title: 'No results found', description: 'Try another search term.' });
      }
    } catch {
      toast({ title: 'Search error', description: 'Could not connect to geocoding service.' });
    }
  };

  const handleSelectSearchResult = (loc: GeocodingResultDto) => {
    setPosition([loc.latitude, loc.longitude]);
    setAddressLine(loc.addressLine || '');
    setCity(loc.city || '');
    setSearchResults([]);
  };

  // Save address
  const handleSave = async () => {
    if (!addressLabel.trim()) {
      toast({ variant: 'destructive', title: 'Label required', description: 'e.g. Home, Work' });
      return;
    }
    if (!addressLine.trim() || !city.trim()) {
      toast({ variant: 'destructive', title: 'Address incomplete', description: 'Please provide address line and city.' });
      return;
    }

    try {
      await createAddressMutation.mutateAsync({
        addressLabel: addressLabel.trim(),
        addressLine: addressLine.trim(),
        city: city.trim(),
        latitude: position[0],
        longitude: position[1],
        recipientName: recipientName.trim() || undefined,
        recipientPhone: recipientPhone.trim() || undefined,
        isDefault,
      });

      toast({
        variant: 'success',
        title: 'Delivery location saved',
        description: `${addressLabel} has been added to your delivery addresses.`,
      });

      onOpenChange(false);
      onAddressCreated?.();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to save address',
        description: err.message || 'Please try again.',
      });
    }
  };

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          handlePositionChange(latLng.lat, latLng.lng);
        }
      },
    }),
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Set Customer Delivery Location
          </DialogTitle>
          <DialogDescription>
            Select a location on the map or search an address. Drag the pin to adjust.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar & Detect GPS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search landmark or area (e.g. D Ground, Faisalabad)"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={forwardGeocodeMutation.isPending}>
                {forwardGeocodeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="shrink-0 gap-1.5"
            >
              {isDetectingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              ) : (
                <Compass className="h-4 w-4 text-accent" />
              )}
              {isDetectingLocation ? 'Detecting…' : 'Use My Location'}
            </Button>
          </div>

          {/* Search suggestions dropdown */}
          {searchResults.length > 0 && (
            <div className="border rounded-md divide-y bg-background shadow-sm max-h-36 overflow-y-auto">
              {searchResults.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(loc)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center justify-between"
                >
                  <span className="truncate mr-2">{loc.formattedAddress}</span>
                  <span className="text-muted-foreground shrink-0">{loc.city}</span>
                </button>
              ))}
            </div>
          )}

          {/* Leaflet Interactive Map Container */}
          <div className="h-64 sm:h-72 w-full rounded-lg border overflow-hidden relative">
            {open && (
              <MapContainer
                center={position}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url={tileConfig.urlTemplate}
                  attribution={tileConfig.attribution}
                  maxZoom={tileConfig.maxZoom}
                  minZoom={tileConfig.minZoom}
                />
                <Marker
                  position={position}
                  draggable={true}
                  eventHandlers={markerEventHandlers}
                  ref={markerRef}
                />
                <MapEventHandler onPositionChange={handlePositionChange} />
                <MapCenterController center={position} />
              </MapContainer>
            )}

            {/* Reverse geocoding status overlay */}
            {reverseGeocodeMutation.isPending && (
              <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur rounded px-2.5 py-1 text-xs text-muted-foreground flex items-center gap-1.5 shadow-sm z-[1000]">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Resolving address text…
              </div>
            )}
          </div>

          {/* Coordinates readout */}
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 font-mono">
            <span>Latitude: {position[0].toFixed(6)}</span>
            <span>Longitude: {position[1].toFixed(6)}</span>
          </div>

          {/* Address Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="addressLabel" className="text-xs">Location Label *</Label>
              <Input
                id="addressLabel"
                placeholder="e.g. Home, Office, Studio"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs">City *</Label>
              <Input
                id="city"
                placeholder="e.g. Faisalabad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="addressLine" className="text-xs">Physical Street Address *</Label>
              <Input
                id="addressLine"
                placeholder="Street address, house number, area"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="recipientName" className="text-xs">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                placeholder="Leave blank to use account name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="recipientPhone" className="text-xs">Recipient Phone (Optional)</Label>
              <Input
                id="recipientPhone"
                placeholder="+92 300 1234567"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Set as Default checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultAddress"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <Label htmlFor="isDefaultAddress" className="text-xs font-normal cursor-pointer">
              Set as my primary default delivery location
            </Label>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onSelectCoordinates && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                const readableLabel = addressLine.trim()
                  ? (city.trim() ? `${addressLine.trim()}, ${city.trim()}` : addressLine.trim())
                  : (addressLabel.trim() || 'Selected Location');

                onSelectCoordinates({
                  latitude: position[0],
                  longitude: position[1],
                  label: readableLabel,
                  addressLine: addressLine.trim() || undefined,
                  city: city.trim() || undefined,
                });
                onOpenChange(false);
              }}
              className="gap-1.5"
            >
              <Compass className="h-4 w-4" />
              Use This Location
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createAddressMutation.isPending}
            className="gap-1.5"
          >
            {createAddressMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Delivery Location
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
