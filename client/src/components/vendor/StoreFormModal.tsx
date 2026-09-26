import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Store,
  MapPin,
  Search,
  Loader2,
  Compass,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Sparkles,
  X,
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
import { getActiveMapTileProvider } from '../../lib/maps/mapTileProvider';
import { useReverseGeocode, useForwardGeocode } from '../../hooks/useAddresses';
import { useStoreCategories } from '../../hooks/useCategories';
import { useCreateStore, useUpdateStore } from '../../hooks/useStores';
import { toast } from '../../hooks/useToast';
import { uploadApi } from '../../lib/api';
import type { StoreDto, GeocodingResultDto } from '@geomarket/shared';

const PRESET_STORE_COVERS = [
  { label: 'Supermarket', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Fresh Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Grocery Store', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Artisan Cafe', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Pharmacy & Care', url: 'https://images.unsplash.com/photo-1586015555751-63c25b39bfdb?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Meat & Butchery', url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1200&q=80' },
];

interface StoreFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreDto | null;
  onSuccess?: () => void;
}

// Default initial centroid: Faisalabad, Pakistan
const DEFAULT_LAT = 31.4124;
const DEFAULT_LON = 73.1091;

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

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export function StoreFormModal({
  open,
  onOpenChange,
  store,
  onSuccess,
}: StoreFormModalProps) {
  const isEditing = !!store;
  const tileProvider = useMemo(() => getActiveMapTileProvider(), []);
  const tileConfig = tileProvider.getTileConfig();

  const { data: categories = [], isLoading: loadingCategories } = useStoreCategories();
  const createStoreMutation = useCreateStore();
  const updateStoreMutation = useUpdateStore();
  const reverseGeocodeMutation = useReverseGeocode();
  const forwardGeocodeMutation = useForwardGeocode();

  const [name, setName] = useState('');
  const [storeCategoryId, setStoreCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [position, setPosition] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LON]);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number>(5);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number>(100);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(500);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResultDto[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const markerRef = useRef<L.Marker | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Store cover image size cannot exceed 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingCover(true);
      const res = await uploadApi.uploadImage(file);
      setImageUrl(res.url);
      toast({
        title: 'Cover Image Uploaded',
        description: 'Store cover image uploaded successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not upload cover image.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Store logo image size cannot exceed 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingLogo(true);
      const res = await uploadApi.uploadImage(file);
      setLogoUrl(res.url);
      toast({
        title: 'Logo Uploaded',
        description: 'Store logo uploaded successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not upload store logo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Sync state whenever dialog opens or editing store changes
  useEffect(() => {
    if (open) {
      setValidationError(null);
      setSearchResults([]);
      setSearchQuery('');

      if (store) {
        setName(store.name || '');
        setStoreCategoryId(store.storeCategoryId || '');
        setDescription(store.description || '');
        setImageUrl(store.imageUrl || '');
        setLogoUrl(store.logoUrl || '');
        setAddressLine(store.addressLine || '');
        setCity(store.city || '');
        setPosition([Number(store.latitude) || DEFAULT_LAT, Number(store.longitude) || DEFAULT_LON]);
        setDeliveryRadiusKm(Number(store.deliveryRadiusKm) || 5);
        setBaseDeliveryFee(Number(store.baseDeliveryFee) || 0);
        setMinOrderAmount(Number(store.minOrderAmount) || 0);
      } else {
        setName('');
        setStoreCategoryId(categories[0]?.id || '');
        setDescription('');
        setImageUrl('');
        setLogoUrl('');
        setAddressLine('');
        setCity('Faisalabad');
        setPosition([DEFAULT_LAT, DEFAULT_LON]);
        setDeliveryRadiusKm(5);
        setBaseDeliveryFee(100);
        setMinOrderAmount(500);
      }
    }
  }, [open, store, categories]);

  // If category is not set yet and categories load, select the first category
  useEffect(() => {
    if (!storeCategoryId && categories.length > 0) {
      setStoreCategoryId(categories[0].id);
    }
  }, [categories, storeCategoryId]);

  const handlePositionChange = async (lat: number, lon: number) => {
    setPosition([lat, lon]);
    try {
      const res = await reverseGeocodeMutation.mutateAsync({ latitude: lat, longitude: lon });
      if (res?.location) {
        setAddressLine(res.location.addressLine || addressLine);
        if (res.location.city) {
          setCity(res.location.city);
        }
      }
    } catch {
      // Retain manual entry if reverse geocoding is unavailable
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation unavailable', description: 'Browser does not support geolocation.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionChange(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        toast({ title: 'Location access denied', description: 'Please pick location on the map manually.' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

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
        toast({ title: 'No results found', description: 'Try another search query.' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Store Name is required.');
      return;
    }
    if (!storeCategoryId) {
      setValidationError('Please select a Store Category.');
      return;
    }
    if (!addressLine.trim() || !city.trim()) {
      setValidationError('Physical street address and city are required.');
      return;
    }
    if (deliveryRadiusKm <= 0) {
      setValidationError('Delivery radius must be greater than 0 km.');
      return;
    }

    try {
      if (isEditing && store) {
        await updateStoreMutation.mutateAsync({
          id: store.id,
          data: {
            name: name.trim(),
            storeCategoryId,
            description: description.trim() || undefined,
            imageUrl: imageUrl.trim() || null,
            logoUrl: logoUrl.trim() || null,
            addressLine: addressLine.trim(),
            city: city.trim(),
            latitude: position[0],
            longitude: position[1],
            deliveryRadiusKm: Number(deliveryRadiusKm),
            baseDeliveryFee: Number(baseDeliveryFee) || 0,
            minOrderAmount: Number(minOrderAmount) || 0,
          },
        });

        toast({
          variant: 'success',
          title: 'Store updated',
          description: `"${name.trim()}" details have been successfully saved.`,
        });
      } else {
        await createStoreMutation.mutateAsync({
          name: name.trim(),
          storeCategoryId,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || null,
          logoUrl: logoUrl.trim() || null,
          addressLine: addressLine.trim(),
          city: city.trim(),
          latitude: position[0],
          longitude: position[1],
          deliveryRadiusKm: Number(deliveryRadiusKm),
          baseDeliveryFee: Number(baseDeliveryFee) || 0,
          minOrderAmount: Number(minOrderAmount) || 0,
        });

        toast({
          variant: 'success',
          title: 'Store registered',
          description: `"${name.trim()}" has been submitted for administrative review.`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save store. Please check the form.');
    }
  };

  const isSaving = createStoreMutation.isPending || updateStoreMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            {isEditing ? `Edit Store: ${store?.name}` : 'Register New Physical Storefront'}
          </DialogTitle>
          <DialogDescription>
            Configure storefront identity, physical centroid coordinates, and delivery boundary radius.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {validationError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Store Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="storeName" className="text-xs font-medium">
                Store Name *
              </Label>
              <Input
                id="storeName"
                placeholder="e.g. Al-Madina Fresh Grocers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="storeCategory" className="text-xs font-medium">
                Store Category *
              </Label>
              <select
                id="storeCategory"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={storeCategoryId}
                onChange={(e) => setStoreCategoryId(e.target.value)}
                disabled={loadingCategories}
                required
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="storeDescription" className="text-xs font-medium">
                Description / Highlights
              </Label>
              <Input
                id="storeDescription"
                placeholder="Briefly describe products, specialties, and storefront highlights"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section: Store Visual Identity & Imagery */}
          <div className="space-y-4 pt-2 border-t">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-primary" />
                Store Visual Identity &amp; Imagery
              </h4>
              <p className="text-xs text-muted-foreground">
                Upload custom storefront imagery or pick from curated merchant presets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cover Banner */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center justify-between">
                  <span>Store Cover Banner (Recommended: 1200×400)</span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </Label>

                {imageUrl ? (
                  <div className="relative h-28 rounded-lg overflow-hidden border border-border group bg-muted">
                    <img
                      src={imageUrl}
                      alt="Store Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="h-28 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-1 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors text-xs text-muted-foreground"
                  >
                    {isUploadingCover ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Upload Cover Banner</span>
                        <span className="text-[10px] text-muted-foreground/80">JPG, PNG, WEBP up to 5MB</span>
                      </>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />

                <Input
                  placeholder="Or paste image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="text-xs h-8"
                />

                {/* Presets */}
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Quick Presets:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_STORE_COVERS.map((preset) => (
                      <button
                        type="button"
                        key={preset.label}
                        onClick={() => setImageUrl(preset.url)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          imageUrl === preset.url
                            ? 'bg-primary text-primary-foreground border-primary font-semibold'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border/50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Store Logo */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center justify-between">
                  <span>Store Logo / Avatar (Square)</span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[11px] text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </Label>

                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                      <img
                        src={logoUrl}
                        alt="Store Logo Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                        title="Remove logo"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="h-20 w-20 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center shrink-0 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <>
                          <Store className="h-5 w-5" />
                          <span className="text-[10px] mt-1 font-medium">Upload</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="w-full text-xs h-8 gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isUploadingLogo ? 'Uploading…' : 'Choose Logo File'}</span>
                    </Button>
                    <Input
                      placeholder="Or logo URL (https://...)"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Spatial Location & Delivery Boundary Map Visualizer */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  Physical Location &amp; Delivery Radius Visualizer
                </h4>
                <p className="text-xs text-muted-foreground">
                  Drag the marker to pinpoint the store centroid. The blue circle represents your active delivery area.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDetectLocation}
                className="gap-1.5 text-xs h-8"
              >
                <Compass className="h-3.5 w-3.5 text-primary" />
                Use GPS
              </Button>
            </div>

            {/* Address Search Bar */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search address or landmark to move pin..."
                    className="pl-9 text-xs h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(e);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleSearch}
                  disabled={forwardGeocodeMutation.isPending}
                  className="h-9 text-xs px-3"
                >
                  {forwardGeocodeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {/* Autocomplete list */}
              {searchResults.length > 0 && (
                <div className="absolute z-[1001] left-0 right-0 top-11 border rounded-md divide-y bg-background shadow-lg max-h-36 overflow-y-auto">
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
            </div>

            {/* Interactive Leaflet Map with Circle Component */}
            <div className="h-72 w-full rounded-lg border overflow-hidden relative shadow-inner">
              {open && (
                <MapContainer
                  center={position}
                  zoom={13}
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
                  <Circle
                    center={position}
                    radius={Math.max(100, Number(deliveryRadiusKm) * 1000)}
                    pathOptions={{
                      color: '#2563eb',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.22,
                      weight: 2,
                    }}
                  />
                  <MapEventHandler onPositionChange={handlePositionChange} />
                  <MapCenterController center={position} />
                  <MapResizer />
                </MapContainer>
              )}

              {reverseGeocodeMutation.isPending && (
                <div className="absolute bottom-2 left-2 bg-background/95 backdrop-blur rounded px-2.5 py-1 text-xs text-muted-foreground flex items-center gap-1.5 shadow-md z-[1000]">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Updating address from pin…
                </div>
              )}
            </div>

            {/* Coordinates & Delivery Radius Slider Controls */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="deliveryRadius" className="text-xs font-semibold">
                      Delivery Boundary Radius:
                    </Label>
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {deliveryRadiusKm} km ({Math.round(deliveryRadiusKm * 1000)} meters)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Only customer delivery coordinates located within this circle can discover and order from this store.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="deliveryRadiusSlider"
                    min="1"
                    max="30"
                    step="0.5"
                    value={deliveryRadiusKm}
                    onChange={(e) => setDeliveryRadiusKm(parseFloat(e.target.value) || 1)}
                    className="w-36 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <Input
                    type="number"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={deliveryRadiusKm}
                    onChange={(e) => setDeliveryRadiusKm(parseFloat(e.target.value) || 1)}
                    className="w-20 text-xs h-8 text-center"
                  />
                  <span className="text-xs text-muted-foreground">km</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1 border-t">
                <span>Centroid Latitude: {position[0].toFixed(6)}</span>
                <span>Centroid Longitude: {position[1].toFixed(6)}</span>
              </div>
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="storeAddressLine" className="text-xs font-medium">
                  Physical Street Address *
                </Label>
                <Input
                  id="storeAddressLine"
                  placeholder="Street address, shop number, market"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="storeCity" className="text-xs font-medium">
                  City *
                </Label>
                <Input
                  id="storeCity"
                  placeholder="e.g. Faisalabad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Policy (Delivery Fee & Min Order) */}
          <div className="pt-2 border-t space-y-3">
            <h4 className="text-sm font-semibold">Fulfillment &amp; Order Policies</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="baseDeliveryFee" className="text-xs font-medium">
                  Base Delivery Fee (PKR)
                </Label>
                <Input
                  id="baseDeliveryFee"
                  type="number"
                  min="0"
                  step="10"
                  placeholder="100"
                  value={baseDeliveryFee}
                  onChange={(e) => setBaseDeliveryFee(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[11px] text-muted-foreground">
                  Default fee charged for delivery within the configured radius.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minOrderAmount" className="text-xs font-medium">
                  Minimum Order Amount (PKR)
                </Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="500"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[11px] text-muted-foreground">
                  Minimum checkout subtotal required to place an order.
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditing ? 'Save Store Changes' : 'Submit Store for Review'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
