import React from 'react';
import {
  MapPin,
  Crosshair,
  Navigation,
  ChevronDown,
  Loader2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { CustomerAddressDto } from '@geomarket/shared';
import type { ActiveLocation } from './AddressAutocompleteInput';

interface DeliveryLocationBarProps {
  activeLocation: ActiveLocation | null;
  savedAddresses?: CustomerAddressDto[];
  isAuthenticated: boolean;
  isLocating: boolean;
  onDetectGPS: () => void;
  onOpenMapPicker: () => void;
  onSelectSavedAddress: (address: CustomerAddressDto) => void;
  className?: string;
}

export function DeliveryLocationBar({
  activeLocation,
  savedAddresses,
  isAuthenticated,
  isLocating,
  onDetectGPS,
  onOpenMapPicker,
  onSelectSavedAddress,
  className = '',
}: DeliveryLocationBarProps) {
  const isDemo = activeLocation?.source === 'demo';
  const hasSavedAddresses = isAuthenticated && savedAddresses && savedAddresses.length > 0;

  const displayLabel = React.useMemo(() => {
    if (!activeLocation?.label) return 'Selected Location';
    const isCoordinatePattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(activeLocation.label.trim());
    return isCoordinatePattern
      ? (activeLocation.addressLine || 'Current Delivery Location')
      : activeLocation.label;
  }, [activeLocation]);

  return (
    <div
      className={`w-full border-b bg-secondary/30 backdrop-blur-md px-4 py-2.5 transition-colors ${className}`}
    >
      <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        {/* Left side: Location status & label */}
        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 font-medium text-xs text-muted-foreground uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>Delivering to:</span>
          </div>

          {activeLocation ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1 max-w-[280px] sm:max-w-md">
                {displayLabel}
              </span>

              {isDemo && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium py-0 px-1.5"
                >
                  Demo Location
                </Badge>
              )}

              {activeLocation.source === 'gps' && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium py-0 px-1.5"
                >
                  GPS Verified
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Set your delivery location to see stores near you</span>
            </div>
          )}
        </div>

        {/* Right side: Location Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {hasSavedAddresses ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold gap-1.5 px-3 bg-background/80 hover:bg-background"
                >
                  <span>Change location</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1">
                <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Saved Delivery Addresses
                </DropdownMenuLabel>
                {savedAddresses.map((addr) => (
                  <DropdownMenuItem
                    key={addr.id}
                    onClick={() => onSelectSavedAddress(addr)}
                    className="flex flex-col items-start gap-0.5 cursor-pointer py-2 px-2.5"
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {addr.addressLabel || 'Address'}
                      </span>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 ml-auto">
                          Default
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {addr.addressLine}, {addr.city}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDetectGPS}
                  disabled={isLocating}
                  className="text-xs cursor-pointer gap-2 py-2 text-primary font-medium"
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" />
                  )}
                  <span>Use Current GPS Location</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onOpenMapPicker}
                  className="text-xs cursor-pointer gap-2 py-2 text-foreground font-medium"
                >
                  <Navigation className="h-3.5 w-3.5 text-amber-500" />
                  <span>Choose Location on Map</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDetectGPS}
                disabled={isLocating}
                title="Detect current location using GPS"
                className="h-8 text-xs font-semibold gap-1.5 px-3 bg-background/80"
              >
                {isLocating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5 text-primary" />
                )}
                <span>{isLocating ? 'Locating you...' : 'Use my location'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenMapPicker}
                title="Choose delivery location on map"
                className="h-8 text-xs font-semibold gap-1.5 px-3 bg-background/80"
              >
                <Navigation className="h-3.5 w-3.5 text-amber-500" />
                <span>Choose on map</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
