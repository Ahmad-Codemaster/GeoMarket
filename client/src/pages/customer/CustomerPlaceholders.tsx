import { Store, ShoppingBag, ShoppingCart, CreditCard, Clock } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent } from '../../components/ui/card';
import { EmptyState } from '../../components/common/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

export function StoresDiscoveryPlaceholder() {
  return (
    <PageContainer width="wide">
      <PageHeader
        title="Store Discovery"
        description="Browse nearby stores delivering to your selected location"
      />
      <div className="space-y-6">
        <Alert variant="info">
          <Store className="h-4 w-4" />
          <AlertTitle>Phase 5 Geospatial Discovery</AlertTitle>
          <AlertDescription className="text-xs">
            Nearby store discovery queries powered by PostGIS <code>ST_DWithin</code> will populate
            this catalog based on your real-time or chosen delivery location.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Store}
              title="Store Discovery Inactive"
              description="Physical store directory and interactive Leaflet map integration arrive in Phase 5."
              isPlaceholder={true}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export function ProductsCatalogPlaceholder() {
  return (
    <PageContainer width="wide">
      <PageHeader
        title="Products &amp; Items"
        description="Explore products offered by stores within your delivery zone"
      />
      <div className="space-y-6">
        <Alert variant="info">
          <ShoppingBag className="h-4 w-4" />
          <AlertTitle>Phase 4 Catalog Engine</AlertTitle>
          <AlertDescription className="text-xs">
            Product search, category filtering, and store-specific catalog browsing arrive in Phase 4.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={ShoppingBag}
              title="Product Catalog Inactive"
              description="Product listings will activate once vendor inventories are onboarded."
              isPlaceholder={true}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export function CartPlaceholder() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Shopping Cart"
        description="Items selected for delivery from a single store"
      />
      <div className="space-y-6">
        <Alert variant="info">
          <ShoppingCart className="h-4 w-4" />
          <AlertTitle>Single-Store Cart Policy</AlertTitle>
          <AlertDescription className="text-xs">
            In Phase 6, cart validation guarantees all items originate from exactly one store to
            prevent impossible multi-store dispatch conflicts.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={ShoppingCart}
              title="Your Cart is Empty"
              description="Cart state and checkout synchronization will be implemented in Phase 6."
              isPlaceholder={true}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export function CheckoutPlaceholder() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Checkout &amp; Confirmation"
        description="Review immutable price snapshots and Cash-on-Delivery confirmation"
      />
      <div className="space-y-6">
        <Alert variant="info">
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Phase 6 Checkout &amp; COD</AlertTitle>
          <AlertDescription className="text-xs">
            Immutable order address snapshots, delivery fee calculation, and COD selection arrive in Phase 6.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={CreditCard}
              title="Checkout Inactive"
              description="Checkout will activate once the single-store cart flow is functional."
              isPlaceholder={true}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export function CustomerOrdersPlaceholder() {
  return (
    <PageContainer width="wide">
      <PageHeader
        title="My Orders"
        description="Track active deliveries and view past order history"
      />
      <div className="space-y-6">
        <Alert variant="info">
          <Clock className="h-4 w-4" />
          <AlertTitle>Stepped FSM Order Tracking</AlertTitle>
          <AlertDescription className="text-xs">
            Order state transitions (PENDING → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED)
            will be tracked in real-time in Phase 6.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Clock}
              title="No Past Orders"
              description="Order tracking and immutable historical receipts activate in Phase 6."
              isPlaceholder={true}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
