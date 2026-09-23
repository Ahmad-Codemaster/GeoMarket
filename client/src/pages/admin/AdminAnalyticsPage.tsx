import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Users,
  Store,
  ArrowUpRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { adminApi } from '../../lib/api';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED:        { label: 'Confirmed',         color: 'bg-blue-100 text-blue-800' },
  PROCESSING:       { label: 'Processing',        color: 'bg-purple-100 text-purple-800' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED:        { label: 'Delivered',         color: 'bg-emerald-100 text-emerald-800' },
  CANCELLED:        { label: 'Cancelled',         color: 'bg-red-100 text-red-800' },
};

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const recentOrders = data?.recentOrders ?? [];
  const topStores = data?.topStores ?? [];

  const maxOrders = Math.max(...topStores.map((s) => s.orderCount), 1);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Analytics &amp; Reports"
        description="Platform-wide performance data — orders, revenue, user growth, and store activity."
      />

      <div className="space-y-8">
        {/* ── Revenue Summary ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue Breakdown</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'All-Time Revenue', value: stats?.revenue.total,  icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Monthly Revenue',  value: stats?.revenue.month,  icon: TrendingUp, color: 'text-blue-600',    bg: 'bg-blue-50' },
              { label: 'Weekly Revenue',   value: stats?.revenue.week,   icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: "Today's Revenue",  value: stats?.revenue.today,  icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((item) => (
              <Card key={item.label} className="rounded-2xl shadow-xs border-slate-200/80">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    <div className={`rounded-xl p-1.5 ${item.bg}`}>
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <p className="text-xl font-bold">{formatCurrency(item.value ?? 0)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Orders Timeline ───────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Order Volume</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders',  value: stats?.orders.total, icon: ShoppingBag },
              { label: 'This Month',    value: stats?.orders.month, icon: ShoppingBag },
              { label: 'This Week',     value: stats?.orders.week,  icon: ShoppingBag },
              { label: 'Today',         value: stats?.orders.today, icon: ShoppingBag },
            ].map((item) => (
              <Card key={item.label} className="rounded-2xl shadow-xs border-slate-200/80">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-xl font-bold">{item.value ?? 0}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Users & Stores ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Users &amp; Merchants</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Registered Users', value: stats?.users.total,     icon: Users },
              { label: 'Customers',        value: stats?.users.customers,  icon: Users },
              { label: 'Vendors',          value: stats?.users.vendors,    icon: Store },
              { label: 'Active Stores',    value: stats?.stores.active,    icon: Store },
            ].map((item) => (
              <Card key={item.label} className="rounded-2xl shadow-xs border-slate-200/80">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <p className="text-xl font-bold">{item.value ?? 0}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Top Stores & Recent Orders ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Stores bar chart */}
          <Card className="rounded-2xl shadow-xs border-slate-200/80">
            <CardHeader>
              <CardTitle>Top Stores by Orders</CardTitle>
              <CardDescription>Stores ranked by total order count</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))
                : topStores.length === 0
                ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No store data yet. Orders will appear here once placed.
                  </p>
                )
                : topStores.map((store) => (
                    <StatBar
                      key={store.storeId}
                      label={store.storeName}
                      value={store.orderCount}
                      max={maxOrders}
                    />
                  ))}
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card className="rounded-2xl shadow-xs border-slate-200/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest activity across all stores</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                <Link to="/admin/analytics">
                  All orders <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    ))
                  : recentOrders.slice(0, 7).map((order) => {
                      const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-slate-100 text-slate-700' };
                      return (
                        <div key={order.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{order.customerName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{order.storeName}</p>
                          </div>
                          <p className="text-xs font-bold shrink-0">{formatCurrency(order.totalAmount)}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                {!isLoading && recentOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No orders yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
