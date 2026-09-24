import React from 'react';
import { Link } from 'react-router-dom';
import {
  Store as StoreIcon,
  MapPin,
  ArrowRight,
  Map as MapIcon,
  RefreshCw,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { StoreCard } from '../discovery/StoreCard';
import type { DiscoveredStoreDto } from '@geomarket/shared';
import type { ActiveLocation } from './AddressAutocompleteInput';

interface NearbyStoresSectionProps {
  activeLocation: ActiveLocation | null;
  stores: DiscoveredStoreDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpenLocationPicker: () => void;
}

export function NearbyStoresSection({
  activeLocation,
  stores,
  isLoading,
  isError,
  onRetry,
  onOpenLocationPicker,
}: NearbyStoresSectionProps) {
  const storesQueryUrl = activeLocation
    ? `/stores?latitude=${activeLocation.latitude}&longitude=${activeLocation.longitude}`
    : '/stores';

  const storesMapQueryUrl = activeLocation
    ? `/stores?latitude=${activeLocation.latitude}&longitude=${activeLocation.longitude}&view=map`
    : '/stores?view=map';

  return (
    <section className="py-14 md:py-20 bg-secondary/20 border-b">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified Local Merchants
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Stores delivering to you now
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              {activeLocation ? (
                <span>Showing stores eligible for <strong className="text-foreground font-semibold">{activeLocation.label}</strong></span>
              ) : (
                <span>Showing sample stores. Set your address to filter by delivery radius.</span>
              )}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Link to={storesMapQueryUrl}>
                <MapIcon className="h-3.5 w-3.5 text-amber-500" />
                <span>View on map</span>
              </Link>
            </Button>

            <Button
              size="sm"
              asChild
              className="text-xs font-bold gap-1.5 shadow-xs hover-lift"
            >
              <Link to={storesQueryUrl}>
                <span>View all stores</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Store Grid Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border bg-card space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-3/4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-14 w-full rounded-md" />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-dashed p-8 text-center bg-card/60">
            <StoreIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-base">Unable to load nearby stores</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              We encountered a temporary network issue finding stores for this location.
            </p>
            <Button size="sm" onClick={onRetry} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </Button>
          </Card>
        ) : stores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.slice(0, 6).map((store) => (
              <StoreCard key={store.storeId} store={store} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="border-dashed p-8 sm:p-12 text-center bg-card/60 max-w-2xl mx-auto">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-foreground">
              No stores currently deliver to this location
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2 mb-6 leading-relaxed">
              Stores on GeoMarket define a custom delivery radius and operating hours. Try choosing another address or exploring the full marketplace catalog.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="sm" variant="default" onClick={onOpenLocationPicker}>
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                <span>Change location</span>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/stores">View all stores</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
