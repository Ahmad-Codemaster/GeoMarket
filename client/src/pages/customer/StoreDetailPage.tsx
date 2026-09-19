import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Clock,
  Navigation,
  DollarSign,
  Package,
  Search,
  ArrowLeft,
  Info,
  Star,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useDiscoveredStore, useStoreProducts } from '../../hooks/useDiscovery';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [productSearch, setProductSearch] = useState('');

  const {
    data: store,
    isLoading: storeLoading,
    isError: storeError,
  } = useDiscoveredStore(id || '');

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useStoreProducts(id || '', {
    search: productSearch.trim() || undefined,
  });

  const products = productsData?.products || [];

  if (storeLoading) {
    return (
      <PageContainer width="wide">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (storeError || !store) {
    return (
      <PageContainer width="wide">
        <ErrorState
          title="Store Unavailable"
          message="This merchant could not be found or is currently not active in the marketplace."
        />
        <div className="mt-4 text-center">
          <Button variant="outline" asChild>
            <Link to="/stores">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Store Discovery
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const categoryName =
    typeof store.storeCategory === 'string'
      ? store.storeCategory
      : store.storeCategory?.name || 'General Merchant';

  return (
    <PageContainer width="wide">
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
            <Link to="/stores">
              <ArrowLeft className="h-4 w-4" />
              Back to Stores
            </Link>
          </Button>
        </div>

        {/* Store Header Card */}
        <Card className="overflow-hidden border-border/80 shadow-2xs">
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {categoryName}
                  </Badge>
                  <Badge
                    variant={store.isOpen ? 'success' : 'destructive'}
                    className="text-xs gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {store.isOpen ? 'Open Now' : 'Closed'}
                  </Badge>
                  <Badge
                    variant={store.isAcceptingOrders ? 'default' : 'warning'}
                    className="text-xs"
                  >
                    {store.isAcceptingOrders ? 'Accepting Orders' : 'Orders Paused'}
                  </Badge>
                  {store.averageRating > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{store.averageRating.toFixed(1)}</span>
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {store.storeName}
                </h1>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>{store.address}, {store.city}</span>
                </div>
              </div>
            </div>

            {store.description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {store.description}
              </p>
            )}

            {/* Store Fulfillment Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground">Delivery Radius:</span>
                <p className="font-semibold text-foreground">
                  Up to {store.deliveryRadiusKm} km
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground">Base Delivery Fee:</span>
                <p className="font-semibold text-foreground">
                  {store.baseDeliveryFee > 0 ? `Rs. ${store.baseDeliveryFee}` : 'Free Delivery'}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground">Minimum Order:</span>
                <p className="font-semibold text-foreground">
                  {store.minimumOrderAmount > 0 ? `Rs. ${store.minimumOrderAmount}` : 'None'}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground">Store Timezone:</span>
                <p className="font-semibold text-foreground">
                  {store.timezone || 'Asia/Karachi'}
                </p>
              </div>
            </div>
          </div>

          {/* Operating Hours Dropdown / Summary */}
          {store.operatingHours && store.operatingHours.length > 0 && (
            <div className="border-t bg-muted/20 px-6 py-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Weekly Operating Hours</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                {store.operatingHours.map((h) => (
                  <div key={h.dayOfWeek} className="p-2 rounded bg-background/80 border text-center space-y-0.5">
                    <p className="font-medium text-foreground">{DAYS_OF_WEEK[h.dayOfWeek]?.slice(0, 3)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {h.isClosed ? (
                        <span className="text-destructive font-medium">Closed</span>
                      ) : (
                        `${h.openingTime} - ${h.closingTime}`
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Phase 5 Strict Boundary Notice */}
        <Alert variant="info" className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-xs font-semibold">Phase 5 Catalog Browsing Mode</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            You are exploring the active catalog of this merchant. Cart persistence and checkout confirmation arrive in Phase 6.
          </AlertDescription>
        </Alert>

        {/* Products Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Products &amp; Items</h2>
              <p className="text-xs text-muted-foreground">
                Active inventory items available from {store.storeName}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products in store…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : productsError ? (
            <ErrorState
              title="Failed to load products"
              message="Unable to fetch products for this store."
            />
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Package}
                  title="No Products Available"
                  description={
                    productSearch
                      ? `No products found matching "${productSearch}".`
                      : 'This merchant currently has no active products listed in their catalog.'
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="flex flex-col justify-between overflow-hidden hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                      {product.category && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-2 pb-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-foreground">
                        Rs. {product.price.toFixed(2)}
                      </span>
                      {product.unit && (
                        <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <span className="text-muted-foreground">Stock:</span>
                      <Badge
                        variant={product.stockQuantity > 0 ? 'success' : 'destructive'}
                        className="text-[10px] py-0"
                      >
                        {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
