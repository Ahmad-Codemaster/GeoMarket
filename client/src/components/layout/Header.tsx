import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, ShoppingBag, ShoppingCart, X } from 'lucide-react';
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

  const isCustomerOrGuest = !user || user.role === UserRole.CUSTOMER;
  const itemCount = cart?.itemCount ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          to={user ? dashboardPath(user.role) : '/'}
          className="flex items-center gap-2 font-bold text-xl text-primary"
          onClick={() => setMobileNavOpen(false)}
        >
          <MapPin className="h-5 w-5 text-accent" strokeWidth={2.5} />
          <span>GeoMarket</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/stores">Browse Stores</Link>
          </Button>

          {isCustomerOrGuest && (
            <Button variant="outline" size="sm" asChild className="relative gap-2">
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4" />
                <span>Cart</span>
                {itemCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {user ? (
            <UserMenu user={user} />
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
          {user ? (
            <MobileAuthNav user={user} onClose={() => setMobileNavOpen(false)} />
          ) : (
            <>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login" onClick={() => setMobileNavOpen(false)}>Sign in</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link to="/register" onClick={() => setMobileNavOpen(false)}>Get started</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function MobileAuthNav({ user, onClose }: { user: NonNullable<ReturnType<typeof useCurrentUser>['data']>; onClose: () => void }) {
  const navigate = useNavigate();
  const links = getMobileNavLinks(user.role);
  return (
    <div className="space-y-1">
      <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
    ];
  }
  return [
    { href: '/dashboard', label: 'Home' },
    { href: '/stores', label: 'Discover Stores' },
    { href: '/orders', label: 'My Orders' },
    { href: '/cart', label: 'My Cart' },
    { href: '/addresses', label: 'My Addresses' },
    { href: '/profile', label: 'My Profile' },
  ];
}

