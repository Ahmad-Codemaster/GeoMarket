import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Search,
  Compass,
  Filter,
  Layers,
  Map as MapIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RotateCw,
  Store as StoreIcon,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LocationPickerModal } from '../../components/location/LocationPickerModal';
import { StoreCard } from '../../components/discovery/StoreCard';
import { DiscoveryMap } from '../../components/discovery/DiscoveryMap';
import { useAddresses } from '../../hooks/useAddresses';
import { useCurrentUser } from '../../hooks/useAuth';
import { useStoreCategories } from '../../hooks/useCategories';
import { useDiscoveredStores } from '../../hooks/useDiscovery';
import { toast } from '../../hooks/useToast';
import type { CustomerAddressDto } from '@geomarket/shared';

export function StoresDiscoveryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Current user & saved addresses
  const { data: user } = useCurrentUser();
  const { data: addresses, isLoading: addressesLoading, refetch: refetchAddresses } = useAddresses({ enabled: !!user });
  const { data: categories, isLoading: categoriesLoading } = useStoreCategories();

  // Active coordinates
  const [selectedAddressId, setSelectedAddressId] = useState<string>('default');
  const [activeLocation, setActiveLocation] = useState<{
    latitude: number;
    longitude: number;
    label: string;
    addressLine?: string;
  } | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Initialize active location from default address or first saved address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !activeLocation) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
      setActiveLocation({
        latitude: Number(def.latitude),
        longitude: Number(def.longitude),
        label: def.addressLabel,
        addressLine: def.addressLine,
      });
    }
  }, [addresses, activeLocation]);

  // Handle address change from dropdown
  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    const found = addresses?.find((a) => a.id === id);
    if (found) {
      setActiveLocation({
        latitude: Number(found.latitude),
        longitude: Number(found.longitude),
        label: found.addressLabel,
        addressLine: found.addressLine,
      });
      setPage(1);
    }
  };

  // Detect current location via browser GPS
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support GPS location detection.',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedAddressId('gps');
        setActiveLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: 'Current GPS Location',
        });
        setPage(1);
        toast({
          title: 'Location Updated',
          description: `Locked to coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
          variant: 'default',
        });
      },
      (err) => {
        toast({
          title: 'Location access denied',
          description: 'Please select a saved address or allow browser location access.',
          variant: 'destructive',
        });
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  // Build query params for TanStack Query
  const discoveryParams = useMemo(() => {
    if (!activeLocation) return null;
    return {
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
      storeCategoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      search: searchQuery.trim() ? searchQuery.trim() : undefined,
      page,
      pageSize: 12,
    };
  }, [activeLocation, selectedCategory, searchQuery, page]);

  const {
    data: discoveryData,
    isLoading: discoveryLoading,
    isError: discoveryError,
    refetch: refetchDiscovery,
    isFetching,
  } = useDiscoveredStores(discoveryParams);

  const stores = discoveryData?.stores || [];
  const pagination = discoveryData?.pagination;

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Discover Stores"
        description="Find approved local merchants delivering directly to your exact location."
      />

      <div className="space-y-6">
        {/* ─── Location Toolbar ────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-card p-4 md:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Active Delivery Coordinates Display */}
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2.5 shrink-0 text-primary mt-0.5">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Delivery Zone
                  </span>
                  {activeLocation && (
                    <Badge variant="success" className="text-[10px] py-0">
                      Coordinates Locked
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-base text-foreground">
                  {activeLocation
                    ? `${activeLocation.label}${activeLocation.addressLine ? ` — ${activeLocation.addressLine}` : ''}`
                    : 'No Location Selected'}
                </p>
                {activeLocation && (
                  <p className="text-xs text-muted-foreground font-mono">
                    ({activeLocation.latitude.toFixed(4)}, {activeLocation.longitude.toFixed(4)})
                  </p>
                )}
              </div>
            </div>

            {/* Address Switcher & GPS Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {addresses && addresses.length > 0 && (
                <div className="w-full sm:w-56">
                  <Select
                    value={selectedAddressId}
                    onValueChange={handleSelectAddress}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose saved address" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id} className="text-xs">
                          {addr.addressLabel} ({addr.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-9"
                onClick={handleDetectCurrentLocation}
              >
                <Compass className="h-3.5 w-3.5 text-accent" />
                <span>Use Current GPS</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs h-9"
                onClick={() => setLocationModalOpen(true)}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Change Pin</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => refetchDiscovery()}
                disabled={isFetching}
                title="Refresh stores"
              >
                <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
              </Button>
            </div>
          </div>

          {/* ─── Search, Category Filters & View Toggle ──────────────────────── */}
          <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search eligible stores by name…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 h-9 text-xs"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 h-9 text-xs"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>Map Perimeter</span>
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          {categories && categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                All Categories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Content Area ────────────────────────────────────────────────── */}
        {!activeLocation ? (
          <Card>
            <CardContent className="py-16 text-center">
              <EmptyState
                icon={Compass}
                title="Delivery Location Required"
                description="GeoMarket relies on PostGIS straight-line perimeter filtering. Please select an address or use your current location above to find eligible stores."
              />
            </CardContent>
          </Card>
        ) : discoveryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full" />
              </Card>
            ))}
          </div>
        ) : discoveryError ? (
          <ErrorState
            title="Unable to load nearby stores"
            message="A problem occurred while querying the geospatial discovery engine. Please try again."
            onRetry={() => refetchDiscovery()}
          />
        ) : stores.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={StoreIcon}
                title="No Stores Delivering to Your Location"
                description={
                  searchQuery
                    ? `No eligible stores found matching "${searchQuery}" within delivery range.`
                    : 'There are currently no approved stores whose delivery radius covers your selected coordinates. Try selecting another drop-off pin.'
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* View Mode Rendering */}
            {viewMode === 'map' ? (
              <div className="space-y-4">
                <DiscoveryMap
                  customerLocation={activeLocation}
                  stores={stores}
                  onSelectStore={(id) => navigate(`/stores/${id}`)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((store) => (
                    <StoreCard key={store.storeId} store={store} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {stores.map((store) => (
                  <StoreCard key={store.storeId} store={store} />
                ))}
              </div>
            )}

            {/* ─── Pagination Bar ──────────────────────────────────────────── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 px-2">
                <p className="text-xs text-muted-foreground">
                  Showing Page <span className="font-semibold">{pagination.page}</span> of{' '}
                  <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total} stores found)
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Picker Modal for creating or changing addresses / picking temporary pins */}
      <LocationPickerModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        onAddressCreated={() => {
          refetchAddresses();
        }}
        onSelectCoordinates={(coords) => {
          setSelectedAddressId('custom_pin');
          setActiveLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            label: coords.label,
            addressLine: coords.addressLine,
          });
          setPage(1);
          toast({
            title: 'Pin Selected',
            description: `Delivery coordinates set to (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
            variant: 'default',
          });
        }}
      />
    </PageContainer>
  );
}
