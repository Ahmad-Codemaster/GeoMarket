import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, ShoppingBag, X } from 'lucide-react';
import { Button } from '../ui/button';
import { UserMenu } from './UserMenu';
import { useCurrentUser } from '../../hooks/useAuth';
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
  const { mobileNavOpen, toggleMobileNav, setMobileNavOpen } = useUiStore();
  const navigate = useNavigate();

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
        <nav className="hidden md:flex items-center gap-1">
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

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
          onClick={toggleMobileNav}
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
    { href: '/profile', label: 'My Profile' },
  ];
}
