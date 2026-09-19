import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShoppingBag,
  Clock,
  Compass,
  User as UserIcon,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useCurrentUser } from '../../hooks/useAuth';
import { useAddresses } from '../../hooks/useAddresses';
import { LocationPickerModal } from '../../components/location/LocationPickerModal';

export function CustomerDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: addresses, refetch } = useAddresses();
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const defaultAddress = addresses?.find((a) => a.isDefault) || addresses?.[0];

  return (
    <PageContainer width="wide">
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Customer'}`}
        description="Your personal GeoMarket customer hub"
      />

      <div className="space-y-6">
        {/* Location-First Experience Banner / State */}
        <div className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-accent/10 p-3 shrink-0">
                <Compass className="h-7 w-7 text-accent" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {defaultAddress
                      ? `Active Delivery Location: ${defaultAddress.addressLabel}`
                      : 'Location Required to Discover Stores'}
                  </h2>
                  <Badge
                    variant={defaultAddress ? 'success' : 'warning'}
                    className="text-xs"
                  >
                    {defaultAddress ? 'Location Active' : 'Location Pending'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {defaultAddress
                    ? `${defaultAddress.addressLine}, ${defaultAddress.city} (${defaultAddress.latitude.toFixed(4)}, ${defaultAddress.longitude.toFixed(4)}). In Phase 5, this location will dynamically filter all stores within delivery reach.`
                    : 'GeoMarket is a location-aware multi-vendor marketplace. To see stores that can deliver to you, an active delivery location is required. Configure your delivery pin using the interactive map.'}
                </p>
              </div>
            </div>
            <Button
              variant="accent"
              className="shrink-0 gap-2"
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="h-4 w-4" />
              {defaultAddress ? 'Change Delivery Location' : 'Set Delivery Location'}
            </Button>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">My Profile</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Account credentials &amp; contact info</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1 mb-4">
                <p className="font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-muted-foreground text-xs">{user?.email}</p>
                <p className="text-muted-foreground text-xs">{user?.phone}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/profile">Manage Profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Delivery Locations</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Saved drop-off locations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                {addresses && addresses.length > 0
                  ? `${addresses.length} saved delivery location${addresses.length > 1 ? 's' : ''} configured.`
                  : 'Configure addresses using the interactive Leaflet pin picker.'}
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/addresses">View Saved Addresses</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Orders &amp; Receipts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Historical order tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Order lifecycle tracking and immutable order snapshots activate in Phase 7.
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/orders">Order History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Empty Marketplace Discovery State */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Stores Near You</CardTitle>
            <CardDescription>
              Stores delivering within your geographic perimeter
            </CardDescription>
          </CardHeader>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <div className="rounded-full bg-secondary p-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base">
                {defaultAddress
                  ? `Ready for Store Discovery (${defaultAddress.city})`
                  : 'No active location set'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {defaultAddress
                  ? `Your delivery coordinates are locked to (${defaultAddress.latitude.toFixed(4)}, ${defaultAddress.longitude.toFixed(4)}). Nearby store spatial filtering (ST_DWithin) activates in Phase 5.`
                  : 'GeoMarket filters all stores by real-world delivery boundaries. Without an active location, no stores are displayed.'}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Physical store onboarding arrives in Phase 3; Spatial discovery in Phase 5
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <LocationPickerModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        onAddressCreated={() => refetch()}
      />
    </PageContainer>
  );
}
