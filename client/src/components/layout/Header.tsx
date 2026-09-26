import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useCurrentUser } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useUiStore } from '../../store/ui.store';
import { useAuthoritativeLocation } from '../../hooks/useAuthoritativeLocation';
import { UserRole } from '@geomarket/shared';

function dashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.VENDOR:
      return '/vendor';
    case UserRole.ADMIN:
      return '/admin';
    default:
      return '/dashboard';
  }
}

export function Header() {
  const { data: user } = useCurrentUser();
  const { data: cart } = useCart();
  const { mobileNavOpen, toggleMobileNav, setMobileNavOpen, toggleCartDrawer } = useUiStore();
  const { activeLocation, setLocationModalOpen } = useAuthoritativeLocation();
  const navigate = useNavigate();

  const [searchCategory, setSearchCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const itemCount = cart?.itemCount ?? 0;
  const isCustomerOrGuest = !user || user.role === UserRole.CUSTOMER || (user as any).isGuest;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && searchCategory === 'all') return;

    if (searchCategory === 'stores') {
      navigate(`/stores?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      const catParam = searchCategory !== 'all' ? `&category=${encodeURIComponent(searchCategory)}` : '';
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}${catParam}`);
    }
  };

  const displayLocation =
    activeLocation?.label?.split(',')[0] || 'D Ground, Faisalabad';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* ─── 1. TOP ANNOUNCEMENT BAR ────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-2 text-xs text-slate-500 hidden md:flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse-ring" />
            Delivering to {displayLocation}
          </span>
          <span className="text-slate-300">•</span>
          <span>Same In-Store Prices Guaranteed</span>
          <span className="text-slate-300">•</span>
          <span>⚡ Direct Doorstep Delivery</span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/orders/track" className="hover:text-emerald-700 transition-colors">
            Order Status
          </Link>
          <Link to="/register/vendor" className="hover:text-emerald-700 transition-colors">
            Become a Partner Store
          </Link>
          <span className="font-semibold text-slate-700">English (PKR - Rs)</span>
        </div>
      </div>

      {/* ─── 2. MAIN NAVIGATION HEADER ─────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 lg:gap-6">
        {/* Brand */}
        <Link
          to={user && !(user as any).isGuest ? dashboardPath(user.role) : '/'}
          className="flex items-center gap-2.5 text-decoration-none shrink-0"
          onClick={() => setMobileNavOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
            <MapPin className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="font-display font-black text-2xl tracking-tight text-slate-900">
            Geo<span className="text-emerald-600">Market</span>
          </span>
        </Link>

        {/* Location Selector */}
        <button
          type="button"
          onClick={() => setLocationModalOpen(true)}
          className="hidden sm:flex items-center gap-2.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 px-3.5 py-1.5 rounded-xl transition-all text-left shrink-0"
          title="Change delivery location"
        >
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
          <div className="text-left">
            <small className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              Delivering to
            </small>
            <strong className="text-xs font-bold text-slate-800 flex items-center gap-1 max-w-[130px] truncate">
              {displayLocation}
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </strong>
          </div>
        </button>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-xl relative items-stretch border-2 border-emerald-600 rounded-full overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-emerald-500/20"
        >
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="border-none bg-slate-50 px-3.5 text-xs font-bold text-slate-700 border-r border-slate-200 outline-none cursor-pointer hover:bg-slate-100"
          >
            <option value="all">All Local Shops</option>
            <option value="groceries">Fresh Groceries</option>
            <option value="bakery">Bakeries</option>
            <option value="pharmacy">Pharmacies</option>
            <option value="produce">Farm Produce</option>
            <option value="stores">Stores Only</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fresh sourdough, milk, berries, medicines in your area..."
            className="flex-1 border-none py-2 px-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 flex items-center justify-center transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </form>

        {/* User Actions */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          {/* Account */}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex flex-col items-center gap-0.5 text-slate-700 hover:text-emerald-600 transition-colors font-bold text-[11px]"
            >
              <UserIcon className="w-5 h-5" strokeWidth={2} />
              <span>Account</span>
            </Link>
          )}

          {/* Saved / Wishlist */}
          <Link
            to="/products"
            className="hidden sm:flex flex-col items-center gap-0.5 text-slate-700 hover:text-rose-500 transition-colors font-bold text-[11px] relative"
            title="Saved items"
          >
            <Heart className="w-5 h-5" strokeWidth={2} />
            <span>Saved</span>
            <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-4 text-center">
              2
            </span>
          </Link>

          {/* Cart Trigger */}
          {isCustomerOrGuest && (
            <button
              type="button"
              onClick={toggleCartDrawer}
              className="flex flex-col items-center gap-0.5 text-slate-700 hover:text-emerald-600 transition-colors font-bold text-[11px] relative cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" strokeWidth={2} />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4.5 text-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="p-2 -mr-1 rounded-lg md:hidden text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={toggleMobileNav}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── 3. SUB-CATEGORIES / DEPARTMENT STRIP ───────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 border-t border-slate-100 bg-white overflow-x-auto text-xs font-semibold no-scrollbar">
        <div className="flex items-center justify-between gap-6 whitespace-nowrap min-w-max">
          <div className="flex items-center gap-6">
            <Link
              to="/products"
              className="text-slate-800 hover:text-emerald-600 flex items-center gap-1.5 font-bold transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Departments</span>
            </Link>
            <Link
              to="/stores"
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Nearby Supermarkets
            </Link>
            <Link
              to="/products?category=produce"
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Fresh Farm Produce
            </Link>
            <Link
              to="/products?category=bakery"
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Artisan Bakeries
            </Link>
            <Link
              to="/products?category=meat"
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Butchery &amp; Poultry
            </Link>
            <Link
              to="/products?category=pharmacy"
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              24/7 Pharmacy
            </Link>
            <Link
              to="/products?category=snacks"
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              Chocolates &amp; Gourmet
            </Link>
          </div>

          <div className="hidden lg:flex items-center">
            <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[11px] px-3 py-1 rounded-full border border-emerald-200/80">
              ⚡ Doorstep Dispatch
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. MOBILE DRAWER NAVIGATION ───────────────────────────────── */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-5 py-4 space-y-3">
          {/* Location button inside mobile nav */}
          <button
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              setLocationModalOpen(true);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-left"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Delivery Area
                </span>
                <span className="text-xs font-bold text-slate-800">{displayLocation}</span>
              </div>
            </div>
            <span className="text-xs text-emerald-600 font-bold">Change</span>
          </button>

          {/* Search inside mobile nav */}
          <form onSubmit={handleSearchSubmit} className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores or items..."
              className="flex-1 px-3 py-2 text-xs bg-transparent outline-none"
            />
            <button type="submit" className="p-2 text-emerald-600">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Links */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <Link
              to="/"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Home
            </Link>
            <Link
              to="/stores"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Nearby Stores
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Product Catalog
            </Link>
            <Link
              to="/orders/track"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Track Order
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileNavOpen(false)}
              className="block px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              About GeoMarket
            </Link>
          </div>

          {/* Auth options in mobile */}
          {!user || (user as any)?.isGuest ? (
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="text-center py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileNavOpen(false)}
                  className="text-center py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  Sign Up
                </Link>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileNavOpen(false)}
                className="block text-center py-2 text-xs font-bold bg-slate-100 rounded-xl text-slate-800 hover:bg-slate-200"
              >
                Guest Dashboard
              </Link>
              <p className="text-[11px] text-center text-slate-400">
                Logging in transfers your active cart &amp; delivery pins
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <Link
                to={dashboardPath(user.role)}
                onClick={() => setMobileNavOpen(false)}
                className="block text-center py-2 text-xs font-bold bg-slate-100 rounded-xl text-slate-800"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
