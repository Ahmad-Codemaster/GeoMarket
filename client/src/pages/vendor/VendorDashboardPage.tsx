import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Package,
  ShoppingCart,
  Settings,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Star,
  MessageSquare,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useCurrentUser } from '../../hooks/useAuth';
import { useVendorStores } from '../../hooks/useStores';
import { useVendorProducts } from '../../hooks/useProducts';
import { useVendorOrders } from '../../hooks/useOrders';
import { useVendorAnalytics } from '../../hooks/useAnalytics';
import { AnalyticsPeriod } from '@geomarket/shared';

export function VendorDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: stores = [] } = useVendorStores();
  const { data: products = [] } = useVendorProducts();
  const { data: ordersData } = useVendorOrders();

  const [period, setPeriod] = useState<AnalyticsPeriod>('all_time');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  const analyticsQueryStoreId = selectedStoreId === 'all' ? undefined : selectedStoreId;
  const { data: analytics, isLoading: analyticsLoading } = useVendorAnalytics({
    storeId: analyticsQueryStoreId,
    period,
  });

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
        {/* Merchant Operational Overview Banner */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Merchant Workspace
                </span>
                <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                  Live Operations
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome back, {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-xs text-muted-foreground">
                Overview of your storefronts, catalog items, and fulfillments across GeoMarket.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-24">
                <span className="text-slate-500 text-[11px] block">Active Stores</span>
                <span className="font-extrabold text-base text-slate-900">{stores.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-24">
                <span className="text-slate-500 text-[11px] block">Catalog Items</span>
                <span className="font-extrabold text-base text-slate-900">{products.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-24">
                <span className="text-slate-500 text-[11px] block">Accepting Orders</span>
                <span className="font-extrabold text-base text-emerald-600">
                  {stores.filter((s) => s.isActive && s.isAcceptingOrders).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Analytics Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-vendor" />
                Operational Performance Analytics
              </h2>
              <p className="text-xs text-muted-foreground">
                Authoritative metrics aggregated from order fulfillment records and customer reviews
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Store Filter */}
              <div className="w-full sm:w-48">
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owned Stores</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Period Filter */}
              <div className="w-full sm:w-36">
                <Select
                  value={period}
                  onValueChange={(val) => setPeriod(val as AnalyticsPeriod)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_time">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operational Metrics Cards */}
          {analyticsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Completed Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Completed Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">
                    Rs. {(analytics?.revenue ?? 0).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    From {analytics?.deliveredOrders ?? 0} delivered orders
                  </p>
                </CardContent>
              </Card>

              {/* Total Orders */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Order Volume
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">
                    {analytics?.totalOrders ?? 0}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> {analytics?.deliveredOrders ?? 0} dlvd
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-rose-600 font-medium">
                      <XCircle className="h-3 w-3" /> {analytics?.cancelledOrders ?? 0} cld
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Average Order Value */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Avg Order Value (AOV)
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">
                    Rs. {(analytics?.averageOrderValue ?? 0).toFixed(2)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Per qualifying delivered order
                  </p>
                </CardContent>
              </Card>

              {/* Average Rating & Review Count */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Customer Rating
                  </CardTitle>
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground flex items-baseline gap-1.5">
                    {analytics?.averageRating && analytics.averageRating > 0
                      ? analytics.averageRating.toFixed(1)
                      : 'N/A'}
                    {analytics?.averageRating && analytics.averageRating > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Across {analytics?.reviewCount ?? 0}{' '}
                    {analytics?.reviewCount === 1 ? 'customer review' : 'customer reviews'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Reviews Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Recent Customer Reviews
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {analytics?.recentReviews?.length ?? 0} recent
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Latest customer feedback received for your store operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !analytics?.recentReviews || analytics.recentReviews.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-foreground">No Reviews Received Yet</p>
                    <p className="mt-1">
                      Customer reviews will appear here once orders are delivered and rated.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {analytics.recentReviews.map((rev) => (
                      <div key={rev.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {rev.customerName || 'Customer'}
                            </span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${
                                    s <= rev.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-muted stroke-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              {rev.rating}/5
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {rev.comment ? (
                          <p className="text-xs text-foreground/85 leading-relaxed bg-muted/30 p-2 rounded border border-border/40 whitespace-pre-wrap">
                            {rev.comment}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">
                            No comment provided.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Operations Links */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Operational Queues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs" asChild>
                    <Link to="/vendor/orders">
                      <span>Live Order Queue</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs" asChild>
                    <Link to="/vendor/stores">
                      <span>Physical Storefronts</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-between text-xs" asChild>
                    <Link to="/vendor/products">
                      <span>Product Catalog &amp; Stock</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Store Count</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>
                    You currently operate <strong>{stores.length} approved store(s)</strong>.
                    To register a new store branch, visit the physical store management page.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default VendorDashboardPage;
