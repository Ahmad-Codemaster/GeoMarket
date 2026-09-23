import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Store,
  Users,
  TrendingUp,
  ArrowUpRight,
  Package,
  Tags,
  BarChart3,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Settings,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { adminApi } from '../../lib/api';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const statusStyles: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  PENDING:          { label: 'Pending',          icon: Clock,        className: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:        { label: 'Confirmed',         icon: CheckCircle2, className: 'bg-blue-100 text-blue-700' },
  PROCESSING:       { label: 'Processing',        icon: Package,      className: 'bg-purple-100 text-purple-700' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  icon: Truck,        className: 'bg-indigo-100 text-indigo-700' },
  DELIVERED:        { label: 'Delivered',         icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:        { label: 'Cancelled',         icon: XCircle,      className: 'bg-red-100 text-red-700' },
};

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    staleTime: 60_000,
  });

  const stats = data?.stats;
  const recentOrders = data?.recentOrders ?? [];
  const topStores = data?.topStores ?? [];

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Platform Overview"
        description="Real-time snapshot of GeoMarket — orders, revenue, users, and store activity."
      />

      <div className="space-y-8">
        {/* ── KPI Row 1 — Revenue ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Revenue</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: stats?.revenue.total, format: 'currency', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'This Month',    value: stats?.revenue.month, format: 'currency', icon: TrendingUp, color: 'text-blue-600',    bg: 'bg-blue-50' },
              { label: 'This Week',     value: stats?.revenue.week,  format: 'currency', icon: TrendingUp, color: 'text-purple-600',  bg: 'bg-purple-50' },
              { label: 'Today',         value: stats?.revenue.today, format: 'currency', icon: TrendingUp, color: 'text-orange-600',  bg: 'bg-orange-50' },
            ].map((kpi) => (
              <Card key={kpi.label} className="rounded-2xl border-slate-200/80 shadow-xs">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <div className={`rounded-xl p-2 ${kpi.bg}`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28" />
                  ) : (
                    <p className="text-2xl font-bold tracking-tight">
                      {kpi.format === 'currency'
                        ? formatCurrency(kpi.value ?? 0)
                        : formatNumber(kpi.value ?? 0)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── KPI Row 2 — Orders, Users, Stores ─────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Platform Activity</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Orders',   value: stats?.orders.total,      icon: ShoppingBag, color: 'text-slate-600',  bg: 'bg-slate-100' },
              { label: 'Orders Today',   value: stats?.orders.today,      icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Orders / Week',  value: stats?.orders.week,       icon: ShoppingBag, color: 'text-blue-600',   bg: 'bg-blue-50' },
              { label: 'Registered Users', value: stats?.users.total,     icon: Users,       color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Active Stores',  value: stats?.stores.active,     icon: Store,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Vendors',        value: stats?.users.vendors,     icon: UserCheck,   color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((kpi) => (
              <Card key={kpi.label} className="rounded-2xl border-slate-200/80 shadow-xs">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">{kpi.label}</p>
                    <div className={`rounded-lg p-1.5 ${kpi.bg}`}>
                      <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-xl font-bold">{formatNumber(kpi.value ?? 0)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Two-column: Recent Orders + Top Stores ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-3 rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Orders</CardTitle>
                <CardDescription>Latest 10 orders across the platform</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                <Link to="/admin/analytics">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
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
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))
                  : recentOrders.slice(0, 8).map((order) => {
                      const s = statusStyles[order.status] ?? { label: order.status, icon: Clock, className: 'bg-slate-100 text-slate-600' };
                      const Icon = s.icon;
                      return (
                        <div key={order.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {order.customerName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {order.storeName} · {new Date(order.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <p className="text-xs font-semibold shrink-0">{formatCurrency(order.totalAmount)}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.className}`}>
                            <Icon className="h-3 w-3" />
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                {!isLoading && recentOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">No orders yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Stores + Quick Links */}
          <div className="lg:col-span-2 space-y-4">
            {/* Top Stores */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Stores</CardTitle>
                <CardDescription>By total order volume</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3">
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))
                    : topStores.map((store, idx) => (
                        <div key={store.storeId} className="flex items-center gap-3 px-5 py-3">
                          <span className="text-xs font-bold text-muted-foreground w-4">#{idx + 1}</span>
                          <p className="text-xs font-medium flex-1 truncate">{store.storeName}</p>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold">{store.orderCount} orders</p>
                            <p className="text-[11px] text-muted-foreground">{formatCurrency(store.revenue)}</p>
                          </div>
                        </div>
                      ))}
                  {!isLoading && topStores.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">No data yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin Navigation Links */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Administration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {[
                  { to: '/admin/stores',     icon: Store,    label: 'Store Management',    desc: 'Approve, suspend & manage stores' },
                  { to: '/admin/categories', icon: Tags,     label: 'Category Taxonomies', desc: 'Store & product categories' },
                  { to: '/admin/users',      icon: Users,    label: 'User Management',      desc: 'Customers, vendors & admins' },
                  { to: '/admin/analytics',  icon: BarChart3,label: 'Analytics',            desc: 'Platform metrics & reports' },
                  { to: '/admin/settings',   icon: Settings, label: 'Admin Settings',       desc: 'Account & system preferences' },
                ].map((item) => (
                  <Button key={item.to} variant="ghost" size="sm" className="w-full justify-start gap-2 h-auto py-2 px-3 rounded-xl hover:bg-slate-50" asChild>
                    <Link to={item.to}>
                      <div className="rounded-lg bg-slate-100 p-1.5">
                        <item.icon className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <ArrowUpRight className="h-3 w-3 ml-auto text-muted-foreground" />
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
