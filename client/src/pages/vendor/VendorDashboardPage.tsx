import { Link } from 'react-router-dom';
import { Store, Package, ShoppingCart, Settings, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useCurrentUser } from '../../hooks/useAuth';
import { useVendorStores } from '../../hooks/useStores';
import { useVendorProducts } from '../../hooks/useProducts';

export function VendorDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: stores = [] } = useVendorStores();
  const { data: products = [] } = useVendorProducts();

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Vendor Operations Portal"
        description={`Manage physical storefronts, inventory, and order fulfillment — ${user?.firstName} ${user?.lastName}`}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/vendor/profile">
              <Settings className="mr-2 h-4 w-4" />
              Vendor Profile
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Architecture & Phase Status Banner */}
        <Alert variant="info">
          <Store className="h-4 w-4" />
          <AlertTitle>Vendor Operations &amp; Inventory Management (Phase 4 Active)</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            Your account is linked 1:1 with a <strong>VendorProfile</strong> (ID:{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
              {user?.vendorProfileId || 'Linked'}
            </code>
            ). You are managing <strong>{stores.length} physical store(s)</strong> and <strong>{products.length} catalog product(s)</strong> with transaction-safe inventory controls.
          </AlertDescription>
        </Alert>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Registered Stores</CardTitle>
              <Store className="h-4 w-4 text-vendor" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stores.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stores.length === 1 ? '1 store registered' : `${stores.length} stores registered`}
              </p>
              <div className="mt-4 pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto text-xs" asChild>
                  <Link to="/vendor/stores">
                    Manage stores
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Catalog Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {products.length === 1 ? '1 product in catalog' : `${products.length} products across stores`}
              </p>
              <div className="mt-4 pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto text-xs" asChild>
                  <Link to="/vendor/products">
                    View catalog
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Incoming Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Order processing arrives in Phase 6
              </p>
              <div className="mt-4 pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto text-xs" asChild>
                  <Link to="/vendor/orders">
                    Order queue
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Management Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Physical Store Management</CardTitle>
              <CardDescription>
                Configure stores, operating hours, and PostGIS delivery radius polygons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Each vendor profile may register and maintain multiple stores. Each store is
                individually reviewed and approved by administrators before appearing in customer
                discovery queries.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/vendor/stores">View Store List (Phase 2)</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Profile &amp; Settlement</CardTitle>
              <CardDescription>
                Legal registration details, tax identifiers, and banking info
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Maintain official business verification records required for vendor credibility and
                marketplace governance.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/vendor/profile">Review Legal Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
