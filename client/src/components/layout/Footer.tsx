import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { useAuthoritativeLocation } from '../../hooks/useAuthoritativeLocation';

export function Footer() {
  const { setActiveLocation } = useAuthoritativeLocation();

  const handleSetQuickArea = (label: string, lat: number, lng: number) => {
    setActiveLocation({
      latitude: lat,
      longitude: lng,
      label: `${label}, Faisalabad`,
      city: 'Faisalabad',
      source: 'map',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8 text-slate-600 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          {/* Brand Col (2 cols wide) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25">
                <MapPin className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-display">
                Geo<span className="text-emerald-600">Market</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Connecting verified local supermarkets, artisan bakeries, and pharmacies with your neighborhood for doorstep delivery in ~25 minutes with Cash on Delivery.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Node: Faisalabad Hub
              </span>
              <span className="text-slate-400">•</span>
              <span>100% Cash on Delivery</span>
            </div>
          </div>

          {/* Col 2: Explore */}
          <div className="space-y-3.5">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              Explore
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/stores" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Nearby Stores
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Fresh Farm Deals
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Artisan Bakeries
                </Link>
              </li>
              <li>
                <Link to="/orders/track" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  About GeoMarket
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Areas */}
          <div className="space-y-3.5">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              Popular Areas
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => handleSetQuickArea('D Ground Commercial', 31.4124, 73.1098)}
                  className="text-left text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  D Ground Commercial
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSetQuickArea('Peoples Colony', 31.4200, 73.1200)}
                  className="text-left text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  Peoples Colony
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSetQuickArea('Susan Road', 31.4285, 73.1165)}
                  className="text-left text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  Susan Road, Madina Town
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSetQuickArea('Kohinoor City', 31.4172, 73.1032)}
                  className="text-left text-slate-500 hover:text-emerald-600 transition-colors"
                >
                  Kohinoor City
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: For Stores */}
          <div className="space-y-3.5">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              For Stores
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register/vendor" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Register Your Store
                </Link>
              </li>
              <li>
                <Link to="/vendor" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Merchant Portal
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Inventory Support
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-500 hover:text-emerald-600 transition-colors">
                  Delivery Network
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} GeoMarket. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-600">Local Node: Faisalabad, Punjab</span>
            <span>•</span>
            <Link to="/support" className="hover:text-emerald-600 transition-colors">Privacy &amp; Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
