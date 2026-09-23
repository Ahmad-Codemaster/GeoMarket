import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Store as StoreIcon,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Compass,
  Navigation,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Star,
  DollarSign,
  ChevronRight,
  Crosshair,
  TrendingUp,
  Boxes,
  Zap,
  Loader2,
  Package,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Header } from '../../components/layout/Header';
import { useCurrentUser } from '../../hooks/useAuth';
import { useStoreCategories } from '../../hooks/useCategories';
import { useDiscoveredStores } from '../../hooks/useDiscovery';
import { useAddresses } from '../../hooks/useAddresses';
import { LocationPickerModal } from '../../components/location/LocationPickerModal';
import { StoreCard } from '../../components/discovery/StoreCard';
import { UserRole } from '@geomarket/shared';

const roleDashboard: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: '/dashboard',
  [UserRole.VENDOR]: '/vendor',
  [UserRole.ADMIN]: '/admin',
};

// Interactive 3D Tilt Card for Hero Display
function Interactive3DHero() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(-4);
  const [rotY, setRotY] = useState(6);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -12;
    const tiltY = ((x - centerX) / centerX) * 12;

    setRotX(tiltX);
    setRotY(tiltY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(-4);
    setRotY(6);
  };

  return (
    <div
      className="relative w-full max-w-lg mx-auto perspective-1000 py-6 select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main 3D Card Surface */}
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/20 dark:border-white/10 bg-gradient-to-br from-card/90 via-card/80 to-background/90 backdrop-blur-xl shadow-2xl p-6 transition-transform duration-200 ease-out preserve-3d hover-lift"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) ${isHovered ? 'scale(1.02)' : 'scale(1)'}`,
        }}
      >
        {/* Holographic Border Shine */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-transparent to-amber-500/15 pointer-events-none" />

        {/* Floating 3D Badge 1: Real-Time Radar Status */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-4 mb-5 translate-z-24">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Neighborhood Store Radar
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Compass className="h-3 w-3 animate-spin" style={{ animationDuration: '8s' }} />
            Active Delivery Radius
          </span>
        </div>

        {/* 3D Visual Radar Sphere & Store Map Pin */}
        <div className="relative h-56 rounded-xl bg-gradient-to-b from-secondary/80 to-secondary/30 border border-border/50 overflow-hidden flex items-center justify-center translate-z-12">
          {/* Concentric Radar Wave Rings */}
          <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20 animate-pulse-radar" />
          <div className="absolute w-64 h-64 rounded-full border border-emerald-500/15 animate-pulse-radar" style={{ animationDelay: '1s' }} />
          <div className="absolute w-80 h-80 rounded-full border border-emerald-500/10 animate-pulse-radar" style={{ animationDelay: '2s' }} />

          {/* Center User Pin */}
          <div className="relative z-10 flex flex-col items-center translate-z-40">
            <div className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 animate-bounce">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="mt-2 px-2.5 py-1 bg-background/90 backdrop-blur-md rounded-md text-[11px] font-bold shadow-xs border">
              Your Delivery Location
            </div>
          </div>

          {/* Floating Store Node A */}
          <div className="absolute top-6 left-8 flex items-center gap-1.5 p-2 bg-card/90 backdrop-blur-md rounded-lg shadow-md border text-xs translate-z-24 animate-float-slow">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">Al-Fatah Supermarket</span>
            <span className="text-[10px] text-muted-foreground">0.8 km</span>
          </div>

          {/* Floating Store Node B */}
          <div className="absolute bottom-6 right-8 flex items-center gap-1.5 p-2 bg-card/90 backdrop-blur-md rounded-lg shadow-md border text-xs translate-z-24 animate-float-reverse">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">Green Valley Mart</span>
            <span className="text-[10px] text-muted-foreground">1.5 km</span>
          </div>
        </div>

        {/* 3D Floating Bottom Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 pt-4 mt-2 text-center translate-z-24">
          <div className="p-2.5 rounded-lg bg-background/70 border">
            <p className="text-xs text-muted-foreground">Avg Speed</p>
            <p className="text-sm font-bold text-foreground">~25 Mins</p>
          </div>
          <div className="p-2.5 rounded-lg bg-background/70 border">
            <p className="text-xs text-muted-foreground">Payment</p>
            <p className="text-sm font-bold text-amber-500">Cash on Delivery</p>
          </div>
          <div className="p-2.5 rounded-lg bg-background/70 border">
            <p className="text-xs text-muted-foreground">Verification</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Verified Stores</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: addresses } = useAddresses({ enabled: !!user });
  const { data: categories, isLoading: categoriesLoading } = useStoreCategories();

  // Location search state
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize with user default address or default Islamabad/Faisalabad coordinates
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setActiveCoords({ lat: Number(def.latitude), lng: Number(def.longitude) });
      setAddressInput(def.addressLabel ? `${def.addressLabel} (${def.city})` : def.addressLine);
    } else {
      setActiveCoords({ lat: 33.6844, lng: 73.0479 });
      setAddressInput('Sector F-7/2, Islamabad (33.6844, 73.0479)');
    }
  }, [addresses]);

  // Query stores for featured grid
  const { data: storesData, isLoading: storesLoading } = useDiscoveredStores(
    activeCoords
      ? {
          latitude: activeCoords.lat,
          longitude: activeCoords.lng,
          pageSize: 6,
        }
      : null
  );

  const featuredStores = storesData?.stores || [];

  // GPS detection handler with spinner
  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setActiveCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddressInput(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSearchStores = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCoords) {
      navigate(`/stores?latitude=${activeCoords.lat}&longitude=${activeCoords.lng}`);
    } else {
      navigate('/stores');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* ─── STICKY HEADER ────────────────────────────────────────────────────────── */}
      <Header />

      <main className="flex-1">
        {/* ─── HERO SECTION ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b bg-gradient-to-b from-primary/5 via-secondary/20 to-background">
          {/* Subtle Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Value Prop & Location Search */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
                  <Zap className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
                  <span>Hyperlocal Commerce • Delivered Fast from Local Stores</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground text-balance leading-tight">
                  Your Neighborhood Stores, <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 bg-clip-text text-transparent">
                    Delivered to Your Door.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed text-balance">
                  Order fresh groceries, bakery treats, daily essentials, and pharmacy supplies directly from verified local shops with rapid doorstep delivery.
                </p>

                {/* ── Interactive Location Bar ── */}
                <form onSubmit={handleSearchStores} className="pt-2 max-w-xl mx-auto lg:mx-0 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-2xl bg-card border shadow-lg">
                    <div className="flex-1 flex items-center gap-2.5 px-3 py-2 text-sm bg-background/80 rounded-xl border">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <input
                        type="text"
                        placeholder="Enter delivery area, street or GPS..."
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDetectGPS}
                        title="Use Current GPS"
                        disabled={isLocating}
                        className="px-2.5 h-10 shrink-0"
                      >
                        {isLocating ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Crosshair className="h-4 w-4 text-primary" />
                        )}
                        <span className="hidden sm:inline ml-1 text-xs">
                          {isLocating ? 'Locating…' : 'GPS'}
                        </span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLocationModalOpen(true)}
                        title="Choose on Map"
                        className="px-2.5 h-10 shrink-0"
                      >
                        <Navigation className="h-4 w-4 text-amber-500" />
                        <span className="hidden sm:inline ml-1 text-xs">Map</span>
                      </Button>

                      <Button type="submit" size="sm" className="h-10 px-5 font-bold shrink-0 shadow-xs hover-lift">
                        Explore Stores
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      No Login Required
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Cash on Delivery
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Direct Local Dispatch
                    </span>
                  </div>
                </form>
              </div>

              {/* Right Column: 3D Interactive Card Component */}
              <div className="lg:col-span-5 flex justify-center">
                <Interactive3DHero />
              </div>
            </div>
          </div>
        </section>

        {/* ─── POPULAR CATEGORIES ─────────────────────────────────────────────────── */}
        <section id="categories" className="py-16 md:py-20 border-b">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Browse Department</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  Explore by Category
                </h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link to="/stores">
                  View All Stores <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {categoriesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {categories && categories.length > 0 ? (
                  categories.map((cat, idx) => {
                    const icons = ['🥖', '🥦', '🥛', '🥩', '💊', '🍰', '☕', '🛒'];
                    const icon = icons[idx % icons.length];
                    return (
                      <Link
                        key={cat.id}
                        to={`/stores?storeCategoryId=${cat.id}`}
                        className="group relative p-5 rounded-2xl border bg-card/60 hover:bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 flex flex-col items-center text-center justify-center gap-3"
                      >
                        <div className="text-3xl p-3 rounded-2xl bg-secondary/70 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-inner">
                          {icon}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {cat.description || 'Local shops'}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    Discover thousands of fresh items across local stores.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ─── FEATURED NEARBY STORES ─────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 bg-secondary/20 border-b">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stores Open for Orders
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Featured Neighborhood Stores
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Active storefronts delivering right to your doorstep
                </p>
              </div>

              <Button asChild size="sm" className="font-bold shadow-xs hover-lift">
                <Link to="/stores">
                  See All Nearby Stores <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {storesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : featuredStores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredStores.slice(0, 3).map((store) => (
                  <StoreCard key={store.storeId} store={store} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed p-8 text-center">
                <StoreIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-base">Explore All Marketplace Stores</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                  Set your location on the map to find verified stores delivering to your area.
                </p>
                <Button asChild size="sm">
                  <Link to="/stores">Open Store Catalog</Link>
                </Button>
              </Card>
            )}
          </div>
        </section>

        {/* ─── HOW IT WORKS ───────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 md:py-24 border-b">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center space-y-3 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Simple &amp; Transparent</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                How GeoMarket Works
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
                No complex shipping. Real neighborhood stores dispatching directly to your location.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="relative p-6 rounded-2xl border bg-card hover:shadow-lg transition-all space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                  1
                </div>
                <h3 className="text-lg font-bold">Set Your Delivery Location</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Use GPS or pick your doorstep on our map to instantly view stores delivering to your address.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative p-6 rounded-2xl border bg-card hover:shadow-lg transition-all space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                  2
                </div>
                <h3 className="text-lg font-bold">Pick Store &amp; Fill Cart</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Browse fresh bakery, produce, or daily essentials. Single-store baskets ensure fresh and fast delivery.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative p-6 rounded-2xl border bg-card hover:shadow-lg transition-all space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
                  3
                </div>
                <h3 className="text-lg font-bold">Pay Cash on Delivery</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Track the store's dispatch in real time. Inspect your items at your doorstep and pay safely in cash.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── VENDOR ONBOARDING BANNER ────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="rounded-3xl border bg-card/80 backdrop-blur-md p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center lg:text-left">
                <Badge variant="vendor" className="px-3 py-1 text-xs">
                  Merchant Partnership
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Do You Own a Physical Store?
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  Reach thousands of customers in your immediate neighborhood. Define your own custom delivery radius, control store hours, and manage live inventory with ease.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover-lift">
                  <Link to="/register/vendor">
                    Register as Vendor <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Merchant Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────────── */}
      <footer className="border-t py-12 bg-secondary/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 font-black text-lg text-primary">
                <MapPin className="h-5 w-5 text-amber-500" />
                <span>GeoMarket Hyperlocal Commerce</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Connecting customers with verified neighborhood merchants for fast doorstep delivery with Cash on Delivery.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Customers</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/stores" className="hover:text-primary">Discover Stores</Link></li>
                <li><Link to="/products" className="hover:text-primary">Browse Products</Link></li>
                <li><Link to="/orders/track" className="hover:text-primary">Track Order</Link></li>
                <li><Link to="/cart" className="hover:text-primary">My Cart</Link></li>
                <li><Link to="/login" className="hover:text-primary">Customer Sign In</Link></li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Merchants &amp; Admin</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/register/vendor" className="hover:text-primary">Register Store</Link></li>
                <li><Link to="/vendor" className="hover:text-primary">Vendor Operations</Link></li>
                <li><Link to="/admin" className="hover:text-primary">Platform Admin</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} GeoMarket. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Hyperlocal Commerce</span>
              <span>•</span>
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Location Picker Modal */}
      {locationModalOpen && (
        <LocationPickerModal
          open={locationModalOpen}
          onOpenChange={setLocationModalOpen}
          onSelectCoordinates={(result) => {
            setActiveCoords({ lat: result.latitude, lng: result.longitude });
            setAddressInput(
              result.addressLine
                ? `${result.addressLine}${result.city ? `, ${result.city}` : ''}`
                : `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`
            );
            setLocationModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default HomePage;
