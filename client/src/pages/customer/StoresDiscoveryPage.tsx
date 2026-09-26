import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Search,
  Compass,
  Filter,
  SlidersHorizontal,
  Map as MapIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Store as StoreIcon,
  Loader2,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '../../components/ui/sheet';
import { StoreCard } from '../../components/discovery/StoreCard';
import { DiscoveryMap } from '../../components/discovery/DiscoveryMap';
import { useAuthoritativeLocation } from '../../hooks/useAuthoritativeLocation';
import { useStoreCategories } from '../../hooks/useCategories';
import { useDiscoveredStores } from '../../hooks/useDiscovery';
import { useAddresses, useReverseGeocode } from '../../hooks/useAddresses';
import { useCurrentUser } from '../../hooks/useAuth';

export function StoresDiscoveryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reverseGeocode = useReverseGeocode();

  // Authoritative Customer Location
  const {
    activeLocation,
    isLocating,
    locationModalOpen,
    setLocationModalOpen,
    handleDetectGPS,
    handleSelectMapLocation,
    setActiveLocation,
  } = useAuthoritativeLocation();

  const { data: user } = useCurrentUser();
  const { refetch: refetchAddresses } = useAddresses({ enabled: !!user });
  const { data: categories } = useStoreCategories();

  // Filters & UI State initialized from URL query params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('storeCategoryId') || 'ALL'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(
    searchParams.get('view') === 'map' ? 'map' : 'grid'
  );
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // If URL has specific coordinates and activeLocation isn't set, reverse-geocode to real address
  useEffect(() => {
    const latParam = searchParams.get('latitude');
    const lngParam = searchParams.get('longitude');
    if (latParam && lngParam && !activeLocation) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) {
        reverseGeocode
          .mutateAsync({ latitude: lat, longitude: lng })
          .then((res) => {
            const loc = res?.location;
            const label = loc?.addressLine
              ? (loc?.city ? `${loc.addressLine}, ${loc.city}` : loc.addressLine)
              : 'Delivery Location';
            setActiveLocation({
              latitude: lat,
              longitude: lng,
              label,
              addressLine: loc?.addressLine,
              city: loc?.city,
              source: 'map',
            });
          })
          .catch(() => {
            setActiveLocation({
              latitude: lat,
              longitude: lng,
              label: 'Selected Delivery Location',
              source: 'map',
            });
          });
      }
    }
  }, [searchParams, activeLocation, setActiveLocation, reverseGeocode]);

  // Sync state changes with URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'ALL') params.set('storeCategoryId', selectedCategory);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (activeLocation) {
      params.set('latitude', activeLocation.latitude.toString());
      params.set('longitude', activeLocation.longitude.toString());
    }
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, viewMode, activeLocation, setSearchParams]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'ALL') count++;
    return count;
  }, [searchQuery, selectedCategory]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setPage(1);
  };

  // Selected category object
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'ALL') return null;
    return categories?.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  // TanStack Query parameters for discovered stores
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

  // Sidebar Filter Panel (Shared between Desktop attached sidebar & Mobile sheet drawer)
  const renderFilterPanel = () => (
    <div className="space-y-6">
      {/* 1. Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filter Stores
        </h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* 2. Merchant Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Store Name
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-8 h-9 text-xs rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Delivery Location */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Delivery Address
        </label>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <p className="font-semibold text-xs text-slate-900 leading-snug">
            {activeLocation?.label || 'No delivery address selected'}
          </p>
          {activeLocation?.city && !activeLocation.label.includes(activeLocation.city) && (
            <p className="text-[11px] font-medium text-emerald-700">
              {activeLocation.city}
            </p>
          )}
          <div className="flex flex-col gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-7 rounded-lg gap-1 border-slate-200"
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="w-3 h-3 text-emerald-600" />
              Change Location
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7 rounded-lg gap-1 text-slate-600 hover:text-emerald-700"
              onClick={handleDetectGPS}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
              ) : (
                <Compass className="w-3 h-3 text-emerald-600" />
              )}
              {isLocating ? 'Detecting...' : 'Use Current GPS'}
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Categories List */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Store Category
        </label>
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setPage(1);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100/80'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'ALL' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          {categories?.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(isSelected ? 'ALL' : cat.id);
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. View Mode Switcher */}
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Display Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-8 gap-1.5 rounded-lg"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-8 gap-1.5 rounded-lg"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Top Banner Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Discover Stores
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Find approved local merchants delivering fresh directly to your location.
            </p>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full items-start">
        {/* Desktop Left Sidebar: Attached flush to the left edge of the screen */}
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0 border-r border-slate-200/80 bg-white p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {renderFilterPanel()}
        </aside>

        {/* Right Main Content Area: Spans to the right edge without large gaps */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Mobile Filter Toggle & Controls Bar */}
          <div className="flex lg:hidden items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl border-slate-200 text-slate-800 font-semibold"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:max-w-md overflow-y-auto">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-left">Store Filters</SheetTitle>
                </SheetHeader>
                <div className="py-2">
                  {renderFilterPanel()}
                </div>
                <div className="pt-6 mt-4 border-t">
                  <SheetClose asChild>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      Apply Filters ({pagination?.total ?? stores.length} stores)
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-1.5">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map
              </Button>
            </div>
          </div>

          {/* Top Status & Active Filter Chips Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm text-slate-600">
                Showing <strong className="text-slate-900">{pagination?.total ?? stores.length}</strong> stores delivering to you
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {searchQuery.trim() && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5 pl-2 pr-1 rounded-lg">
                      Search: "{searchQuery}"
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setPage(1);
                        }}
                        className="hover:bg-slate-200 rounded p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  )}

                  {activeCategoryObj && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0.5 pl-2 pr-1 rounded-lg">
                      Category: {activeCategoryObj.name}
                      <button
                        onClick={() => {
                          setSelectedCategory('ALL');
                          setPage(1);
                        }}
                        className="hover:bg-slate-200 rounded p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </Badge>
                  )}

                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-emerald-700 hover:underline font-semibold ml-1"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => refetchDiscovery()}
                disabled={isFetching}
                title="Refresh stores"
              >
                <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Results Grid / Map */}
          {!activeLocation ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="py-16 text-center">
                <EmptyState
                  icon={Compass}
                  title="Delivery Location Required"
                  description="Please select an address or use your current GPS location in the sidebar to find stores delivering to your area."
                />
              </CardContent>
            </Card>
          ) : discoveryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-5 space-y-4 rounded-2xl">
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
              message="A problem occurred while looking up stores in your delivery area. Please try again."
              onRetry={() => refetchDiscovery()}
            />
          ) : stores.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <CardContent className="py-16">
                <EmptyState
                  icon={StoreIcon}
                  title="No Stores Delivering to Your Location"
                  description={
                    searchQuery
                      ? `No stores found matching "${searchQuery}" in your delivery area.`
                      : 'There are currently no stores available delivering to this location. Try choosing another delivery pin.'
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {viewMode === 'map' ? (
                <div className="space-y-4">
                  <DiscoveryMap
                    customerLocation={activeLocation}
                    stores={stores}
                    onSelectStore={(id) => navigate(`/stores/${id}`)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {stores.map((store) => (
                      <StoreCard key={store.storeId} store={store} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                  {stores.map((store) => (
                    <StoreCard key={store.storeId} store={store} />
                  ))}
                </div>
              )}

              {/* Pagination Bar */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 px-2">
                  <p className="text-xs text-slate-500">
                    Showing Page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
                    <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} stores found)
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs rounded-xl"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs rounded-xl"
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
        </main>
      </div>
    </div>
  );
}
