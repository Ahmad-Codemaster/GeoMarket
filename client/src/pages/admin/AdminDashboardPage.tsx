import { Link } from 'react-router-dom';
import { ShieldCheck, Store, Tags, BarChart3, Database, Users, ArrowUpRight } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useCurrentUser } from '../../hooks/useAuth';

export function AdminDashboardPage() {
  const { data: user } = useCurrentUser();

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Platform Administration"
        description="Global system administration, category taxonomies, and store governance"
      />

      <div className="space-y-6">
        {/* System Health / Status Banner */}
        <Alert variant="info">
          <Database className="h-4 w-4" />
          <AlertTitle>Core Infrastructure Active</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            PostgreSQL 16 + PostGIS 3.4 container is operational. Authentication &amp; RBAC module is
            active. Admin actions are secured with role validation derived from the backend JWT.
          </AlertDescription>
        </Alert>

        {/* Administration Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Store Approvals</CardTitle>
              <Store className="h-4 w-4 text-admin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending verification queue (Phase 3)
              </p>
              <div className="mt-4 pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto text-xs" asChild>
                  <Link to="/admin/stores">
                    Review stores
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Category Taxonomies</CardTitle>
              <Tags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 Tables</div>
              <p className="text-xs text-muted-foreground mt-1">
                Store &amp; Product Categories (DB ready)
              </p>
              <div className="mt-4 pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto text-xs" asChild>
                  <Link to="/admin/categories">
                    Manage categories
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Platform Metrics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Phase 1</div>
              <p className="text-xs text-muted-foreground mt-1">
                Telemetry &amp; Audit Logs
              </p>
              <div className="mt-4 pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto text-xs" asChild>
                  <Link to="/admin/analytics">
                    View analytics
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Administration Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Governance</CardTitle>
              <CardDescription>
                Review newly onboarded stores, audit delivery radius polygons, and approve storefronts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                In Phase 3, admins can review store registrations, verify business tax IDs against
                Vendor Profiles, and toggle store active status.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/stores">Open Store Approvals</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Category Hierarchy</CardTitle>
              <CardDescription>
                Manage store classifications and product hierarchy definitions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Schema tables for Store Categories (Grocery, Bakery, Pharmacy, etc.) and Product
                Categories are established in PostgreSQL. Admin curation UI activates in Phase 3.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/categories">Open Category Manager</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
