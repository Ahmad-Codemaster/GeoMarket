import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Loader2,
  Compass,
  Check,
  CheckCircle2,
  Star,
  Navigation,
} from 'lucide-react';
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
import { Badge } from '../ui/badge';
import { getActiveMapTileProvider } from '../../lib/maps/mapTileProvider';
import {
  useReverseGeocode,
  useForwardGeocode,
  useCreateAddress,
  useAddresses,
} from '../../hooks/useAddresses';
import { useLocationStore, DEFAULT_REFERENCE_LOCATION } from '../../store/location.store';
import { toast } from '../../hooks/useToast';
import type { GeocodingResultDto, CustomerAddressDto } from '@geomarket/shared';

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

const DEFAULT_LAT = DEFAULT_REFERENCE_LOCATION.latitude;
const DEFAULT_LON = DEFAULT_REFERENCE_LOCATION.longitude;

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
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
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

  // Authoritative store hooks
  const activeLocation = useLocationStore((s) => s.activeLocation);
  const setLocationFromSavedAddress = useLocationStore((s) => s.setLocationFromSavedAddress);
  const setLocationFromMap = useLocationStore((s) => s.setLocationFromMap);

  // Address database queries
  const { data: addresses, refetch: refetchAddresses } = useAddresses();

  const [position, setPosition] = useState<[number, number]>([
    activeLocation?.latitude ?? DEFAULT_LAT,
    activeLocation?.longitude ?? DEFAULT_LON,
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResultDto[]>([]);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Faisalabad');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const reverseGeocodeMutation = useReverseGeocode();
  const forwardGeocodeMutation = useForwardGeocode();
  const createAddressMutation = useCreateAddress();

  const markerRef = useRef<L.Marker | null>(null);

  // Synchronize modal state whenever modal is opened
  useEffect(() => {
    if (open) {
      const lat = activeLocation?.latitude ?? DEFAULT_LAT;
      const lon = activeLocation?.longitude ?? DEFAULT_LON;
      setPosition([lat, lon]);

      const initialQuery =
        activeLocation?.label ||
        (activeLocation?.addressLine
          ? `${activeLocation.addressLine}${activeLocation.city ? `, ${activeLocation.city}` : ''}`
          : '');

      setSearchQuery(initialQuery);
      setAddressLine(activeLocation?.addressLine || '');
      setCity(activeLocation?.city || 'Faisalabad');
      setSearchResults([]);
    }
  }, [open, activeLocation]);

  // Trigger reverse geocoding when position changes via click or drag
  const handlePositionChange = async (lat: number, lon: number) => {
    setPosition([lat, lon]);
    try {
      const res = await reverseGeocodeMutation.mutateAsync({ latitude: lat, longitude: lon });
      if (res?.location) {
        const addr = res.location.addressLine || '';
        const c = res.location.city || '';
        setAddressLine(addr);
        setCity(c || 'Faisalabad');

        const readable = addr ? (c ? `${addr}, ${c}` : addr) : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setSearchQuery(readable);
      }
    } catch {
      // Keep manual inputs available if geocoder service has latency
    }
  };

  // High-Accuracy Hardware & Wi-Fi GPS detection (No stale IP caching)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation unavailable',
        description: 'Browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setPosition([lat, lon]);

          const res = await reverseGeocodeMutation.mutateAsync({ latitude: lat, longitude: lon });
          if (res?.location) {
            const addr = res.location.addressLine || '';
            const c = res.location.city || '';
            setAddressLine(addr);
            setCity(c || 'Faisalabad');

            const readable = addr ? (c ? `${addr}, ${c}` : addr) : `GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
            setSearchQuery(readable);

            toast({
              title: 'Location detected',
              description: readable,
              variant: 'default',
            });
          } else {
            const readable = `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
            setSearchQuery(readable);
          }
        } catch {
          setSearchQuery(`Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        let msg = 'Please choose on the map manually.';
        if (err.code === 1) msg = 'Location access was denied. Please allow location permissions in browser.';
        else if (err.code === 2) msg = 'Location information is unavailable from device sensors.';
        else if (err.code === 3) msg = 'Location request timed out. Please try again.';
        toast({ title: 'Location detection failed', description: msg, variant: 'destructive' });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
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
        setCity(first.city || 'Faisalabad');
      } else {
        toast({ title: 'No results found', description: 'Try another landmark or road name.' });
      }
    } catch {
      toast({
        title: 'Search error',
        description: 'Could not connect to geocoding service.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectSearchResult = (loc: GeocodingResultDto) => {
    setPosition([loc.latitude, loc.longitude]);
    setAddressLine(loc.addressLine || '');
    setCity(loc.city || 'Faisalabad');
    setSearchQuery(loc.formattedAddress || `${loc.addressLine}, ${loc.city}`);
    setSearchResults([]);
  };

  // Select one of the user's previously saved delivery addresses from dashboard
  const handleSelectSavedAddress = (addr: CustomerAddressDto) => {
    const lat = Number(addr.latitude);
    const lon = Number(addr.longitude);
    setPosition([lat, lon]);
    setAddressLabel(addr.addressLabel || 'Home');
    setAddressLine(addr.addressLine || '');
    setCity(addr.city || 'Faisalabad');
    setRecipientName(addr.recipientName || '');
    setRecipientPhone(addr.recipientPhone || '');
    setIsDefault(addr.isDefault);

    const readable = `${addr.addressLabel}: ${addr.addressLine}${addr.city ? `, ${addr.city}` : ''}`;
    setSearchQuery(readable);

    // Update authoritative location store
    setLocationFromSavedAddress(addr);

    if (onSelectCoordinates) {
      onSelectCoordinates({
        latitude: lat,
        longitude: lon,
        label: readable,
        addressLine: addr.addressLine,
        city: addr.city,
      });
    }

    toast({
      title: 'Delivery location active',
      description: `Now delivering to ${addr.addressLabel} (${addr.city})`,
      variant: 'default',
    });

    onOpenChange(false);
  };

  // Use current pin without saving to address book
  const handleUseCurrentPin = () => {
    const readable = addressLine.trim()
      ? (city.trim() ? `${addressLine.trim()}, ${city.trim()}` : addressLine.trim())
      : (addressLabel.trim() || `Delivery Pin (${position[0].toFixed(4)}, ${position[1].toFixed(4)})`);

    setLocationFromMap({
      latitude: position[0],
      longitude: position[1],
      label: readable,
      addressLine: addressLine.trim() || undefined,
      city: city.trim() || undefined,
    });

    if (onSelectCoordinates) {
      onSelectCoordinates({
        latitude: position[0],
        longitude: position[1],
        label: readable,
        addressLine: addressLine.trim() || undefined,
        city: city.trim() || undefined,
      });
    }

    toast({
      title: 'Location activated',
      description: `Showing stores delivering to ${readable}`,
    });

    onOpenChange(false);
  };

  // Save address to database and immediately activate it
  const handleSave = async () => {
    if (!addressLabel.trim()) {
      toast({ variant: 'destructive', title: 'Label required', description: 'e.g. Home, Work, Office' });
      return;
    }
    if (!addressLine.trim() || !city.trim()) {
      toast({
        variant: 'destructive',
        title: 'Address incomplete',
        description: 'Please provide address line and city.',
      });
      return;
    }

    try {
      const res = await createAddressMutation.mutateAsync({
        addressLabel: addressLabel.trim(),
        addressLine: addressLine.trim(),
        city: city.trim(),
        latitude: position[0],
        longitude: position[1],
        recipientName: recipientName.trim() || undefined,
        recipientPhone: recipientPhone.trim() || undefined,
        isDefault,
      });

      const readableLabel = `${addressLabel.trim()} (${city.trim()})`;

      const savedAddress = (res as any)?.address;
      if (savedAddress) {
        setLocationFromSavedAddress(savedAddress);
      } else {
        setLocationFromMap({
          latitude: position[0],
          longitude: position[1],
          label: readableLabel,
          addressLine: addressLine.trim(),
          city: city.trim(),
        });
      }

      if (onSelectCoordinates) {
        onSelectCoordinates({
          latitude: position[0],
          longitude: position[1],
          label: readableLabel,
          addressLine: addressLine.trim(),
          city: city.trim(),
        });
      }

      toast({
        variant: 'success',
        title: 'Delivery location saved & active',
        description: `${addressLabel} is now set as your active delivery destination.`,
      });

      onOpenChange(false);
      onAddressCreated?.();
      refetchAddresses();
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
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Set Delivery Location
          </DialogTitle>
          <DialogDescription className="text-xs">
            Search an area, select from your saved locations, or click &amp; drag the map pin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar & Detect GPS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search landmark, colony, or road (e.g. D Ground, Susan Road, Peoples Colony)"
                  className="pl-9 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={forwardGeocodeMutation.isPending}
                className="font-bold text-xs"
              >
                {forwardGeocodeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="shrink-0 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
            >
              {isDetectingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <Compass className="h-4 w-4 text-emerald-600" />
              )}
              {isDetectingLocation ? 'Detecting GPS…' : 'Use My Location'}
            </Button>
          </div>

          {/* Search suggestions dropdown */}
          {searchResults.length > 0 && (
            <div className="border rounded-xl divide-y bg-background shadow-md max-h-40 overflow-y-auto">
              {searchResults.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(loc)}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-emerald-50/60 transition-colors flex items-center justify-between"
                >
                  <span className="truncate mr-2 font-medium text-slate-800">{loc.formattedAddress}</span>
                  <span className="text-muted-foreground shrink-0 text-[11px]">{loc.city}</span>
                </button>
              ))}
            </div>
          )}

          {/* Saved Delivery Locations from Dashboard (if available) */}
          {addresses && addresses.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Your Saved Delivery Locations ({addresses.length})
                </Label>
                <span className="text-[11px] text-slate-400">Click any address to select</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {addresses.map((addr) => {
                  const isActive =
                    activeLocation?.latitude &&
                    Math.abs(Number(addr.latitude) - activeLocation.latitude) < 0.0001 &&
                    Math.abs(Number(addr.longitude) - activeLocation.longitude) < 0.0001;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 truncate">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{addr.addressLabel}</span>
                          {addr.isDefault && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-white text-slate-600 border-slate-300">
                              Default
                            </Badge>
                          )}
                        </div>
                        {isActive && (
                          <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-bold">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{addr.addressLine}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>{addr.city}</span>
                        <span className="font-bold text-emerald-700">Deliver Here &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaflet Interactive Map Container */}
          <div className="h-60 sm:h-64 w-full rounded-xl border border-slate-200 overflow-hidden relative shadow-xs">
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
              <div className="absolute bottom-2 left-2 bg-background/95 backdrop-blur rounded-lg px-2.5 py-1 text-xs text-muted-foreground flex items-center gap-1.5 shadow-md z-[1000] border border-slate-200">
                <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                Resolving address text…
              </div>
            )}
          </div>

          {/* Coordinates readout */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono">
            <span>Latitude: {position[0].toFixed(6)}</span>
            <span>Longitude: {position[1].toFixed(6)}</span>
          </div>

          {/* Address Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label htmlFor="addressLabel" className="text-xs font-semibold">Location Label *</Label>
              <Input
                id="addressLabel"
                placeholder="e.g. Home, Office, Studio"
                className="text-xs"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs font-semibold">City *</Label>
              <Input
                id="city"
                placeholder="e.g. Faisalabad"
                className="text-xs"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="addressLine" className="text-xs font-semibold">Physical Street Address *</Label>
              <Input
                id="addressLine"
                placeholder="Street address, house number, area"
                className="text-xs"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="recipientName" className="text-xs">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                placeholder="Leave blank to use account name"
                className="text-xs"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="recipientPhone" className="text-xs">Recipient Phone (Optional)</Label>
              <Input
                id="recipientPhone"
                placeholder="+92 300 1234567"
                className="text-xs"
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
              className="h-4 w-4 rounded border-input text-emerald-600 focus:ring-emerald-500"
            />
            <Label htmlFor="isDefaultAddress" className="text-xs font-normal cursor-pointer text-slate-700">
              Set as my primary default delivery location
            </Label>
          </div>
        </div>

        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2 border-t border-slate-100 pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>

          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleUseCurrentPin}
            className="gap-1.5 font-bold text-xs"
          >
            <Compass className="h-4 w-4 text-emerald-600" />
            Use This Location
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={createAddressMutation.isPending}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            {createAddressMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save &amp; Set Active
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LocationPickerModal;
