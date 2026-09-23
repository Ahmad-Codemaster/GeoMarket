import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, ShoppingBag, ShoppingCart, X, Package, Store, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { UserMenu } from './UserMenu';
import { useCurrentUser } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useUiStore } from '../../store/ui.store';
import { UserRole } from '@geomarket/shared';
import { cn } from '../../lib/utils';

function dashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.VENDOR: return '/vendor';
    case UserRole.ADMIN: return '/admin';
    default: return '/dashboard';
  }
}

export function Header() {
  const { data: user } = useCurrentUser();
  const { data: cart } = useCart();
  const { mobileNavOpen, toggleMobileNav, setMobileNavOpen } = useUiStore();
  const navigate = useNavigate();

  const isCustomerOrGuest = !user || user.role === UserRole.CUSTOMER || (user as any).isGuest;
  const itemCount = cart?.itemCount ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo & Brand */}
        <Link
          to={user && !(user as any).isGuest ? dashboardPath(user.role) : '/'}
          className="flex items-center gap-2 font-black text-xl text-primary tracking-tight"
          onClick={() => setMobileNavOpen(false)}
        >
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <MapPin className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span>Geo<span className="text-amber-500">Market</span></span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
            <Link to="/stores">Stores</Link>
          </Button>

          <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
            <Link to="/products">Products</Link>
          </Button>

          <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            <Link to="/orders/track">Track Order</Link>
          </Button>

          {isCustomerOrGuest && (
            <Button variant="outline" size="sm" asChild className="relative gap-2 font-semibold shadow-xs hover-lift ml-1">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span>Cart</span>
                {itemCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary-foreground bg-primary rounded-full min-w-5 h-5">
                    {itemCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          <div className="ml-2 flex items-center gap-2">
            {user && !(user as any).isGuest ? (
              <UserMenu user={user} />
            ) : (user as any)?.isGuest ? (
              /* Guest session — no auth buttons; user must use back button */
              <span className="text-xs text-muted-foreground font-medium px-2 py-1 rounded-lg bg-secondary">
                Guest
              </span>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="text-xs font-semibold shadow-xs">
                  <Link to="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Mobile items */}
        <div className="flex items-center gap-2 md:hidden">
          {isCustomerOrGuest && (
            <Button variant="ghost" size="sm" asChild className="relative p-2">
              <Link to="/cart" aria-label="Shopping Cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground bg-primary rounded-full min-w-4 h-4">
                    {itemCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          <button
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-2">
          <div className="space-y-1 pb-2 border-b">
            <Button variant="ghost" className="w-full justify-start text-sm" asChild>
              <Link to="/stores" onClick={() => setMobileNavOpen(false)}>Explore Stores</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm" asChild>
              <Link to="/products" onClick={() => setMobileNavOpen(false)}>Product Catalog</Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm" asChild>
              <Link to="/orders/track" onClick={() => setMobileNavOpen(false)}>Track Guest Order</Link>
            </Button>
          </div>

          {user && !(user as any).isGuest ? (
            <MobileAuthNav user={user} onClose={() => setMobileNavOpen(false)} />
          ) : (user as any)?.isGuest ? (
            /* Guest in mobile — no auth buttons */
            <div className="pt-2">
              <p className="text-xs text-center text-muted-foreground py-2">
                You are browsing as a guest. Use your browser's back button to go back.
              </p>
            </div>
          ) : (
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login" onClick={() => setMobileNavOpen(false)}>Sign in</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link to="/register" onClick={() => setMobileNavOpen(false)}>Get started</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function MobileAuthNav({ user, onClose }: { user: NonNullable<ReturnType<typeof useCurrentUser>['data']>; onClose: () => void }) {
  const links = getMobileNavLinks(user.role);
  return (
    <div className="space-y-1 pt-1">
      <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {user.firstName} {user.lastName}
      </p>
      {links.map((link) => (
        <Button key={link.href} variant="ghost" className="w-full justify-start" asChild>
          <Link to={link.href} onClick={onClose}>{link.label}</Link>
        </Button>
      ))}
    </div>
  );
}

function getMobileNavLinks(role: UserRole) {
  if (role === UserRole.VENDOR) {
    return [
      { href: '/vendor', label: 'Dashboard' },
      { href: '/vendor/stores', label: 'My Stores' },
      { href: '/vendor/products', label: 'Products' },
      { href: '/vendor/orders', label: 'Orders' },
      { href: '/vendor/profile', label: 'Profile' },
    ];
  }
  if (role === UserRole.ADMIN) {
    return [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/stores', label: 'Store Approvals' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/analytics', label: 'Analytics' },
      { href: '/admin/users', label: 'User Management' },
      { href: '/admin/settings', label: 'Admin Settings' },
    ];
  }
  return [
    { href: '/dashboard', label: 'Home' },
    { href: '/stores', label: 'Discover Stores' },
    { href: '/products', label: 'Browse Products' },
    { href: '/orders', label: 'My Orders' },
    { href: '/cart', label: 'My Cart' },
    { href: '/addresses', label: 'My Addresses' },
    { href: '/profile', label: 'My Profile' },
  ];
}

export default Header;
