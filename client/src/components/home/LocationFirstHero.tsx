import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  DollarSign,
  Zap,
  Store,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AddressAutocompleteInput,
  type ActiveLocation,
} from './AddressAutocompleteInput';
import { Interactive3DHero } from './Interactive3DHero';

interface LocationFirstHeroProps {
  activeLocation: ActiveLocation | null;
  onSelectLocation: (loc: ActiveLocation) => void;
  onOpenMapPicker: () => void;
}

export function LocationFirstHero({
  activeLocation,
  onSelectLocation,
  onOpenMapPicker,
}: LocationFirstHeroProps) {
  const navigate = useNavigate();

  // Helper to ensure label never exposes raw coordinates
  const cleanDisplayLocation = React.useMemo(() => {
    if (!activeLocation?.label) return null;
    const isCoordinatePattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(activeLocation.label.trim());
    return isCoordinatePattern ? 'Current Delivery Pin' : activeLocation.label;
  }, [activeLocation?.label]);

  const handleExploreStores = () => {
    if (activeLocation && activeLocation.latitude && activeLocation.longitude) {
      navigate(`/stores?latitude=${activeLocation.latitude}&longitude=${activeLocation.longitude}`);
    } else {
      navigate('/stores');
    }
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b bg-gradient-to-b from-primary/5 via-secondary/15 to-background">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Location-First Value Proposition & Search Controls */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Differentiator Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
              <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Verified Local Stores • Real-Time Spatial Delivery</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15] text-balance">
              Shop from stores <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                near you
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed text-balance">
              Discover groceries, bakery items, pharmacy products, and everyday essentials
              from verified local stores that deliver to your doorstep.
            </p>

            {/* Location Entry & Selection Card */}
            <div className="pt-2 max-w-xl mx-auto lg:mx-0 space-y-3">
              {/* Active Location Indicator (Always original readable location, never coordinates) */}
              {cleanDisplayLocation && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Delivering to: <strong className="font-bold text-foreground">{cleanDisplayLocation}</strong></span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch gap-2 p-2.5 rounded-2xl bg-card border shadow-lg">
                {/* Autocomplete Input */}
                <AddressAutocompleteInput
                  currentAddressLabel={cleanDisplayLocation || undefined}
                  onSelectLocation={onSelectLocation}
                  placeholder="Enter your street, sector, or address..."
                />

                {/* Direct Actions: Map Picker & Explore Stores */}
                <div className="flex items-center justify-end gap-1.5 pt-1 sm:pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenMapPicker}
                    aria-label="Choose delivery location on map"
                    title="Choose delivery location on map"
                    className="h-10 px-3 shrink-0 hover:bg-amber-500/10 hover:border-amber-500/30"
                  >
                    <Navigation className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-xs font-medium">Map</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleExploreStores}
                    className="h-10 px-4 font-bold shrink-0 shadow-md hover-lift bg-primary text-primary-foreground"
                  >
                    <Store className="mr-1.5 h-4 w-4" />
                    <span>Explore Stores</span>
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  No Login Required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Cash on Delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Direct Local Dispatch
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Radar Card (Concealed on mobile to prioritize location discovery) */}
          <div className="lg:col-span-5 hidden lg:flex justify-center">
            <Interactive3DHero />
          </div>
        </div>
      </div>
    </section>
  );
}
