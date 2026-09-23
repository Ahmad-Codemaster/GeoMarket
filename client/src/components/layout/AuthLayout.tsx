import React from 'react';
import { MapPin, ShoppingBag, ShieldCheck, Sparkles, Truck, Store, ArrowRight, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useGuestSession } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  showGuestOption?: boolean;
}

export function AuthLayout({ children, title, description, showGuestOption = true }: AuthLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const guestSessionMutation = useGuestSession();

  const handleContinueAsGuest = async () => {
    try {
      await guestSessionMutation.mutateAsync();
      toast({
        title: 'Guest Session Active',
        description: 'You can now browse and place orders without an account.',
      });
      navigate('/stores');
    } catch (err: any) {
      navigate('/stores');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left side banner: Brand & Hyperlocal Value Proposition (Visible on lg screens) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight text-white group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
              <MapPin className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span>Geo<span className="text-amber-400">Market</span></span>
          </Link>
          <p className="text-xs text-emerald-200/80 mt-1 uppercase tracking-widest font-semibold">
            Hyperlocal Commerce Platform
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-8 my-auto py-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Fresh groceries & essentials delivered from your neighborhood stores.
            </h2>
            <p className="text-emerald-100/70 text-sm leading-relaxed">
              Order directly from verified local merchants with fast door-to-door delivery and Cash on Delivery.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Ultra-Fast Local Dispatch</h3>
                <p className="text-xs text-emerald-100/70 mt-0.5">
                  Direct delivery from the nearest grocery or supermarket in your vicinity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Cash on Delivery & Instant Review</h3>
                <p className="text-xs text-emerald-100/70 mt-0.5">
                  Pay with confidence at your doorstep and rate verified store products.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-emerald-200/60 flex items-center justify-between border-t border-white/10 pt-6">
          <span>&copy; {new Date().getFullYear()} GeoMarket. All rights reserved.</span>
          <Link to="/products" className="hover:text-white transition-colors">
            Explore Catalog &rarr;
          </Link>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-16 py-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-black text-primary">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <span>Geo<span className="text-accent">Market</span></span>
            </Link>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              &larr; Back to Home
            </Link>
          </div>

          {/* Card Container */}
          <div className="bg-card rounded-2xl border border-border/80 shadow-md p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
              <p className="text-muted-foreground text-sm mt-1">{description}</p>
            </div>

            {children}

            {/* Guest Checkout Option */}
            {showGuestOption && (
              <div className="mt-6 pt-6 border-t border-border/80">
                <div className="relative flex py-1 items-center justify-center mb-4">
                  <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Or skip sign-in
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs h-10"
                  onClick={handleContinueAsGuest}
                  disabled={guestSessionMutation.isPending}
                >
                  <UserCheck className="h-4 w-4" />
                  {guestSessionMutation.isPending ? 'Starting guest session…' : 'Continue as Guest (No Login Required)'}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  Browse products, add items to cart, and check out with Cash on Delivery.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
