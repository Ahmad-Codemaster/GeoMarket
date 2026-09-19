import { Link } from 'react-router-dom';
import { MapPin, Store, ShoppingBag, ShieldCheck, ArrowRight, Compass } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useCurrentUser } from '../../hooks/useAuth';
import { UserRole } from '@geomarket/shared';

const roleDashboard: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '/dashboard',
  [UserRole.VENDOR]: '/vendor',
  [UserRole.ADMIN]: '/admin',
};

export function HomePage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <MapPin className="h-5 w-5 text-accent" strokeWidth={2.5} />
            <span>GeoMarket</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm">
                <Link to={roleDashboard[user.role]}>Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 border-b bg-gradient-to-b from-secondary/40 to-background">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <Compass className="h-3.5 w-3.5 text-accent" />
              <span>Location-Aware Multi-Vendor Commerce</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground text-balance">
              Hyperlocal marketplace for your neighborhood.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
              Unlike generic e-commerce platforms, GeoMarket dynamically detects your physical delivery
              location and only displays stores capable of fulfilling orders directly to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {user ? (
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link to={roleDashboard[user.role]}>
                    Access {user.role === UserRole.VENDOR ? 'Vendor Portal' : user.role === UserRole.ADMIN ? 'Admin Console' : 'Customer Hub'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="w-full sm:w-auto">
                    <Link to="/register">
                      Explore as Customer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                    <Link to="/register/vendor">Register Your Store</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Architected for spatial precision and trust
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
                Built on PostgreSQL 16 and PostGIS geospatial indexing for deterministic proximity calculation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/60">
                <CardHeader>
                  <div className="rounded-md bg-primary/10 p-2.5 w-fit mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Location-First Filtering</CardTitle>
                  <CardDescription>
                    Customers only see stores within active delivery radii
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  Stores define precise operational boundaries. Orders are only accepted when customer
                  drop-off locations resolve inside authorized fulfillment zones.
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <div className="rounded-md bg-vendor/10 p-2.5 w-fit mb-2">
                    <Store className="h-5 w-5 text-vendor" />
                  </div>
                  <CardTitle className="text-lg">Multi-Vendor Ownership</CardTitle>
                  <CardDescription>
                    Audited USERS → VENDOR_PROFILES → STORES domain hierarchy
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  Each vendor profile administers multiple storefronts with independent inventory,
                  operating hours, and dispatch coordinates under centralized legal ownership.
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <div className="rounded-md bg-admin/10 p-2.5 w-fit mb-2">
                    <ShieldCheck className="h-5 w-5 text-admin" />
                  </div>
                  <CardTitle className="text-lg">Strict Role-Based Security</CardTitle>
                  <CardDescription>
                    HttpOnly SameSite cookies &amp; verified backend token authorization
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  Token storage is locked to secure browser cookies. Sensitive roles like ADMIN are
                  never self-registerable, ensuring zero client privilege escalation.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-secondary/30">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            <span>GeoMarket Hyperlocal Platform</span>
          </div>
          <p>&copy; {new Date().getFullYear()} GeoMarket. Phase 1 Architecture &amp; UI Foundation.</p>
        </div>
      </footer>
    </div>
  );
}
