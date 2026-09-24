import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Sparkles, Store, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import type { ActiveLocation } from './AddressAutocompleteInput';

interface ProductDiscoveryBridgeProps {
  activeLocation: ActiveLocation | null;
}

export function ProductDiscoveryBridge({ activeLocation }: ProductDiscoveryBridgeProps) {
  const productsUrl = activeLocation
    ? `/products`
    : `/products`;

  return (
    <section className="py-12 border-b bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-amber-500/5">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="rounded-2xl border bg-card/70 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Direct Store Inventory</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Looking for specific everyday items?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Every item on GeoMarket is stocked directly inside physical stores near you with real-time inventory locking. Single-store carts ensure freshness and fast dispatch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <Button asChild size="sm" className="font-semibold gap-1.5 shadow-xs">
              <Link to={productsUrl}>
                <span>Browse All Products</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="font-semibold">
              <Link to="/stores">Find Nearby Stores</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
