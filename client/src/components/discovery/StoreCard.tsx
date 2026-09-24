import { Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  ShieldCheck,
  Star,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { DiscoveredStoreDto } from '@geomarket/shared';

interface StoreCardProps {
  store: DiscoveredStoreDto;
}

export function StoreCard({ store }: StoreCardProps) {
  const categoryName =
    typeof store.storeCategory === 'string'
      ? store.storeCategory
      : store.storeCategory?.name || 'General';

  return (
    <Card className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md overflow-hidden group">
      {/* Store Banner Image */}
      <div className="relative h-32 w-full bg-muted overflow-hidden">
        {store.imageUrl ? (
          <img
            src={store.imageUrl}
            alt={store.storeName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/10 via-muted to-secondary/25 flex items-center justify-center">
            <Store className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Store Logo Thumbnail */}
        {store.logoUrl && (
          <div className="absolute bottom-2 left-3 h-10 w-10 rounded-lg border-2 border-background bg-card shadow-sm overflow-hidden">
            <img
              src={store.logoUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <Badge
            variant={store.isOpen ? 'success' : 'destructive'}
            className="text-[11px] gap-1 py-0.5 shadow-xs"
          >
            <Clock className="h-3 w-3" />
            {store.isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2 space-y-2">
        {/* Category & Rating Row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <Badge variant="secondary" className="text-[11px] font-medium tracking-wide truncate max-w-[65%]">
            {categoryName}
          </Badge>
          {store.averageRating > 0 && (
            <Badge variant="outline" className="text-[11px] gap-1 py-0.5 shrink-0 font-medium">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{store.averageRating.toFixed(1)}</span>
              {store.totalReviews > 0 && (
                <span className="text-muted-foreground">({store.totalReviews})</span>
              )}
            </Badge>
          )}
        </div>

        {/* Store Title & Address */}
        <div className="space-y-1">
          <h3 className="font-bold text-base sm:text-lg leading-snug line-clamp-1 text-slate-900 group-hover:text-primary transition-colors" title={store.storeName}>
            {store.storeName}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate" title={`${store.address}, ${store.city}`}>
              {store.address}, {store.city}
            </span>
          </div>
        </div>

        {/* Operating & Acceptance Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge
            variant={store.isAcceptingOrders ? 'default' : 'warning'}
            className="text-[11px] py-0.5"
          >
            {store.isAcceptingOrders ? 'Accepting Orders' : 'Orders Paused'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-3">
        {store.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {store.description}
          </p>
        )}

        {/* Spatial & Order Metadata */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Distance:</span>
            <p className="font-semibold text-foreground flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              {store.distanceKm.toFixed(1)} km away
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-muted-foreground">Delivery Reach:</span>
            <p className="font-medium text-foreground">
              Up to {store.deliveryRadiusKm} km
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-muted-foreground">Delivery Fee:</span>
            <p className="font-medium text-foreground">
              {store.baseDeliveryFee > 0 ? `Rs. ${store.baseDeliveryFee}` : 'Free Delivery'}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-muted-foreground">Min. Order:</span>
            <p className="font-medium text-foreground">
              {store.minimumOrderAmount > 0 ? `Rs. ${store.minimumOrderAmount}` : 'None'}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full gap-2" size="sm">
          <Link to={`/stores/${store.storeId}`}>
            <ShoppingBag className="h-4 w-4" />
            <span>Browse Products</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
