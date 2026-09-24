import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Package,
  ShoppingBag,
  Store as StoreIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  X,
  Filter,
  Layers,
  DollarSign,
  Check,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { useDiscoveredProducts, useDiscoveredStores } from '../../hooks/useDiscovery';
import { useProductCategories } from '../../hooks/useCategories';
import { useAddresses } from '../../hooks/useAddresses';
import { useCurrentUser } from '../../hooks/useAuth';
import { useAddToCart } from '../../hooks/useCart';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '../../components/ui/sheet';
import { useToast } from '../../hooks/useToast';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export function ProductsCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const { data: addresses } = useAddresses({ enabled: !!user });

  // Determine user coordinates for stores in range
  const coords = useMemo(() => {
    const latParam = searchParams.get('latitude');
    const lngParam = searchParams.get('longitude');
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
    }
    if (addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      return { latitude: Number(def.latitude), longitude: Number(def.longitude) };
    }
    return { latitude: 31.4200, longitude: 73.1200 }; // Default reference coordinates
  }, [addresses, searchParams]);

  // Filter States initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    searchParams.get('productCategoryId') || undefined
  );
  const [selectedStore, setSelectedStore] = useState<string | undefined>(
    searchParams.get('storeId') || undefined
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(
    searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  );
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    searchParams.get('inStockOnly') === 'true'
  );
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name_asc'>(
    (searchParams.get('sortBy') as any) || 'newest'
  );
  const [page, setPage] = useState(1);

  // Store filter search
  const [storeSearchText, setStoreSearchText] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state changes with URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (selectedCategory) params.set('productCategoryId', selectedCategory);
    if (selectedStore) params.set('storeId', selectedStore);
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    if (inStockOnly) params.set('inStockOnly', 'true');
    if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, selectedStore, minPrice, maxPrice, inStockOnly, sortBy, setSearchParams]);

  // Fetch Categories & Stores in range
  const { data: categoriesData } = useProductCategories();
  const { data: storesData } = useDiscoveredStores({
    latitude: coords.latitude,
    longitude: coords.longitude,
    pageSize: 50,
  });

  const availableStores = storesData?.stores || [];

  // Filtered stores list for sidebar
  const filteredStoresList = useMemo(() => {
    if (!storeSearchText.trim()) return availableStores;
    return availableStores.filter((s) =>
      s.storeName.toLowerCase().includes(storeSearchText.trim().toLowerCase())
    );
  }, [availableStores, storeSearchText]);

  // Fetch Discovered Products
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useDiscoveredProducts({
    search: search.trim() || undefined,
    productCategoryId: selectedCategory,
    storeId: selectedStore,
    minPrice,
    maxPrice,
    inStockOnly: inStockOnly ? true : undefined,
    sortBy,
    page,
    pageSize: 12,
  });

  const addToCartMutation = useAddToCart();

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedStore) count++;
    if (minPrice !== undefined || maxPrice !== undefined) count++;
    if (inStockOnly) count++;
    if (search.trim()) count++;
    return count;
  }, [selectedCategory, selectedStore, minPrice, maxPrice, inStockOnly, search]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearch('');
    setSelectedCategory(undefined);
    setSelectedStore(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStockOnly(false);
    setSortBy('newest');
    setPage(1);
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCartMutation.mutateAsync({
        productId,
        quantity: 1,
      });

      toast({
        title: 'Added to cart',
        description: `${productName} added to your basket.`,
      });
    } catch (err: any) {
      toast({
        title: 'Could not add to cart',
        description: err.message || 'An error occurred while adding this item.',
        variant: 'destructive',
      });
    }
  };

  // Render Sidebar Filter Content (used on desktop sidebar and mobile drawer)
  const renderFilterPanel = () => (
    <div className="space-y-6">
      {/* Header with Clear Action */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-base text-slate-900">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge className="bg-emerald-600 text-white text-xs h-5 px-1.5 rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all
          </button>
        )}
      </div>

      {/* 1. Filter By Store */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
            Filter by Store
          </label>
          {selectedStore && (
            <button
              onClick={() => {
                setSelectedStore(undefined);
                setPage(1);
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {availableStores.length > 4 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search stores..."
              value={storeSearchText}
              onChange={(e) => setStoreSearchText(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        )}

        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          <button
            onClick={() => {
              setSelectedStore(undefined);
              setPage(1);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
              selectedStore === undefined
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100/80'
            }`}
          >
            <span>All Stores ({availableStores.length})</span>
            {selectedStore === undefined && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          {filteredStoresList.map((store) => {
            const isSelected = selectedStore === store.storeId;
            return (
              <button
                key={store.storeId}
                onClick={() => {
                  setSelectedStore(isSelected ? undefined : store.storeId);
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className={`w-2 h-2 rounded-full ${store.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="truncate">{store.storeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Filter By Category */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Category
          </label>
          {selectedCategory && (
            <button
              onClick={() => {
                setSelectedCategory(undefined);
                setPage(1);
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          <button
            onClick={() => {
              setSelectedCategory(undefined);
              setPage(1);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
              selectedCategory === undefined
                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100/80'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === undefined && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          {categoriesData?.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(isSelected ? undefined : cat.id);
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

      {/* 3. Filter By Price Range */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          Price Range (Rs.)
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-500 mb-1 block">Min</span>
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={minPrice ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setMinPrice(val);
                setPage(1);
              }}
              className="h-8 text-xs rounded-lg border-slate-200"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 mb-1 block">Max</span>
            <Input
              type="number"
              placeholder="5000+"
              min="0"
              value={maxPrice ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setMaxPrice(val);
                setPage(1);
              }}
              className="h-8 text-xs rounded-lg border-slate-200"
            />
          </div>
        </div>

        {/* Quick price presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: '< 500', min: undefined, max: 500 },
            { label: '500 - 1.5k', min: 500, max: 1500 },
            { label: '1.5k - 5k', min: 1500, max: 5000 },
            { label: '5k+', min: 5000, max: undefined },
          ].map((preset) => {
            const isPresetActive = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  if (isPresetActive) {
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                  } else {
                    setMinPrice(preset.min);
                    setMaxPrice(preset.max);
                  }
                  setPage(1);
                }}
                className={`text-[11px] px-2 py-1 rounded-md transition-all ${
                  isPresetActive
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Availability / In Stock */}
      <div className="pt-3 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked);
              setPage(1);
            }}
            className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
          />
          <span className="text-xs font-medium text-slate-800">In-Stock items only</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Cross-Store Product Discovery
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Discover Fresh Products
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-2xl">
            Filter authentic groceries, tech items, daily essentials, and pharmacy products across verified local merchants.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-2xl relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search products across all stores by name or keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-12 pr-4 py-5 text-sm sm:text-base rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 border-none shadow-xl focus-visible:ring-2 focus-visible:ring-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Main Full-Width Content Container */}
      <div className="flex flex-1 w-full items-start">
        {/* Desktop Left Sidebar: Attached flush to the left edge of the screen */}
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0 border-r border-slate-200/80 bg-white p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {renderFilterPanel()}
        </aside>

        {/* Right Main Content Area: Spans all the way to the right edge */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Mobile Filter Toggle & Sort Bar */}
          <div className="flex lg:hidden items-center justify-between gap-3 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
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
                  <SheetTitle className="text-left">Filter Catalog</SheetTitle>
                </SheetHeader>
                <div className="py-2">
                  {renderFilterPanel()}
                </div>
                <div className="pt-6 mt-4 border-t">
                  <SheetClose asChild>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      Apply Filters ({productsData?.pagination.total ?? 0} results)
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Top Toolbar: Results count, Active filter tags, Sort dropdown */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm text-slate-600">
                  Showing <strong className="text-slate-900">{productsData?.pagination.total ?? 0}</strong> products
                </div>

                {/* Active Filter Chips */}
                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {search.trim() && (
                      <Badge variant="secondary" className="gap-1 text-xs py-0.5 pl-2 pr-1 rounded-lg">
                        Search: "{search}"
                        <button
                          onClick={() => {
                            setSearch('');
                            setPage(1);
                          }}
                          className="hover:bg-slate-300 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}

                    {selectedStore && (
                      <Badge variant="secondary" className="gap-1 text-xs py-0.5 pl-2 pr-1 rounded-lg bg-emerald-50 text-emerald-800 border-emerald-200">
                        Store: {availableStores.find((s) => s.storeId === selectedStore)?.storeName || 'Selected Store'}
                        <button
                          onClick={() => {
                            setSelectedStore(undefined);
                            setPage(1);
                          }}
                          className="hover:bg-emerald-200 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}

                    {selectedCategory && (
                      <Badge variant="secondary" className="gap-1 text-xs py-0.5 pl-2 pr-1 rounded-lg bg-teal-50 text-teal-800 border-teal-200">
                        Category: {categoriesData?.find((c) => c.id === selectedCategory)?.name || 'Selected'}
                        <button
                          onClick={() => {
                            setSelectedCategory(undefined);
                            setPage(1);
                          }}
                          className="hover:bg-teal-200 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}

                    {(minPrice !== undefined || maxPrice !== undefined) && (
                      <Badge variant="secondary" className="gap-1 text-xs py-0.5 pl-2 pr-1 rounded-lg">
                        Price: Rs. {minPrice ?? 0} - {maxPrice ? `Rs. ${maxPrice}` : 'Any'}
                        <button
                          onClick={() => {
                            setMinPrice(undefined);
                            setMaxPrice(undefined);
                            setPage(1);
                          }}
                          className="hover:bg-slate-300 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}

                    {inStockOnly && (
                      <Badge variant="secondary" className="gap-1 text-xs py-0.5 pl-2 pr-1 rounded-lg">
                        In-Stock Only
                        <button
                          onClick={() => {
                            setInStockOnly(false);
                            setPage(1);
                          }}
                          className="hover:bg-slate-300 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop Sort Dropdown */}
              <div className="hidden lg:flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="py-16">
                <LoadingState label="Discovering products across stores..." />
              </div>
            ) : error ? (
              <EmptyState
                icon={Package}
                title="Could not load products"
                description="We had trouble fetching the catalog. Please try again."
                action={{ label: 'Retry', onClick: () => { refetch(); } }}
              />
            ) : !productsData?.products || productsData.products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products found"
                description={
                  activeFiltersCount > 0
                    ? 'No products matched your active filters. Try adjusting price range, selecting a different store, or clearing filters.'
                    : 'No products are currently available in the catalog.'
                }
                action={{
                  label: 'Clear All Filters',
                  onClick: handleClearAllFilters,
                }}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {productsData.products.map((product) => {
                    const isOutOfStock = product.stockQuantity <= 0;

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover-lift flex flex-col overflow-hidden group transition-all"
                      >
                        <Link
                          to={`/products/${product.slug || product.id}`}
                          className="block relative aspect-square bg-slate-100/70 overflow-hidden"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-12 h-12" />
                            </div>
                          )}

                          {/* Store Badge Tag */}
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xs border border-slate-200/60">
                              <StoreIcon className="w-3 h-3 text-emerald-600" />
                              {product.store.name}
                            </span>
                          </div>

                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                              <Badge variant="destructive" className="rounded-lg shadow-sm font-semibold">
                                Out of Stock
                              </Badge>
                            </div>
                          )}
                        </Link>

                        <div className="p-5 flex flex-col flex-1">
                          {product.category && (
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">
                              {product.category.name}
                            </span>
                          )}

                          <Link
                            to={`/products/${product.slug || product.id}`}
                            className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2"
                          >
                            {product.name}
                          </Link>

                          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="text-xs text-slate-500 font-medium">Price</div>
                              <div className="text-lg font-extrabold text-emerald-700">
                                Rs. {product.price.toLocaleString()}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              disabled={isOutOfStock || addToCartMutation.isPending}
                              onClick={(e) => handleAddToCart(e, product.id, product.name)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-3.5 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {productsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!productsData.pagination.hasPrevPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-xl border-slate-200 text-slate-700 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <span className="text-sm font-medium text-slate-600 px-3">
                      Page {productsData.pagination.page} of {productsData.pagination.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!productsData.pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-xl border-slate-200 text-slate-700 flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
    </div>
  );
}
