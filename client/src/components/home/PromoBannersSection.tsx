import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShoppingBag, Flame } from 'lucide-react';

export function PromoBannersSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Promo Card 1: Farm Harvest */}
          <div className="relative rounded-3xl p-8 sm:p-10 text-white min-h-[250px] flex flex-col justify-between overflow-hidden shadow-lg bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 group hover:shadow-xl transition-all duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-emerald-200" />
              </div>
              <h3 className="text-2xl font-black tracking-tight leading-tight">
                Farm Harvest Fresh Daily
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                Picked at dawn, at your door before dinner.
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <Link
                to="/products?category=produce"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>Explore Farm Deals</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              </Link>
            </div>
          </div>

          {/* Promo Card 2: Supermarket Fast Dispatch */}
          <div className="relative rounded-3xl p-8 sm:p-10 text-white min-h-[250px] flex flex-col justify-between overflow-hidden shadow-lg bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 group hover:shadow-xl transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                <ShoppingBag className="w-5 h-5 text-sky-200" />
              </div>
              <h3 className="text-2xl font-black tracking-tight leading-tight">
                Supermarket Fast Dispatch
              </h3>
              <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed font-medium">
                Zero markup shelf prices on branded home goods.
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <Link
                to="/stores"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>Shop Groceries</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
              </Link>
            </div>
          </div>

          {/* Promo Card 3: Artisan Warm Bakery */}
          <div className="relative rounded-3xl p-8 sm:p-10 text-white min-h-[250px] flex flex-col justify-between overflow-hidden shadow-lg bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 group hover:shadow-xl transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                <Flame className="w-5 h-5 text-rose-200" />
              </div>
              <h3 className="text-2xl font-black tracking-tight leading-tight">
                Artisan Warm Bakery
              </h3>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed font-medium">
                Straight from local neighborhood ovens in 20 mins.
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <Link
                to="/products?category=bakery"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>Discover Bakeries</span>
                <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PromoBannersSection;
