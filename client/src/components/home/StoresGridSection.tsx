import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Clock } from 'lucide-react';
import type { DiscoveredStoreDto } from '@geomarket/shared';

interface StoresGridSectionProps {
  stores: DiscoveredStoreDto[];
  isLoading?: boolean;
}

const DEFAULT_REFERENCE_STORES = [
  {
    id: 'store-jalal-sons',
    name: 'Jalal Sons Gourmet',
    addressLine: 'D Ground Commercial',
    distanceKm: 0.8,
    minOrderAmount: 300,
    baseDeliveryFee: 80,
    estimatedMinutes: 18,
    imageUrl:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'store-alfatah',
    name: 'Al-Fatah Department Store',
    addressLine: 'Susan Road, Madina Town',
    distanceKm: 1.4,
    minOrderAmount: 200,
    baseDeliveryFee: 90,
    estimatedMinutes: 24,
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'store-chase-up',
    name: 'Chase Up Hypermarket',
    addressLine: 'Main Satiana Road',
    distanceKm: 2.2,
    minOrderAmount: 250,
    baseDeliveryFee: 100,
    estimatedMinutes: 32,
    imageUrl:
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=800',
  },
];

export function StoresGridSection({ stores, isLoading }: StoresGridSectionProps) {
  const displayStores =
    stores && stores.length > 0
      ? stores.slice(0, 3).map((s, idx) => ({
          id: s.storeId,
          name: s.storeName,
          addressLine: s.address || s.city || 'Faisalabad',
          distanceKm: s.distanceKm ? Number(s.distanceKm.toFixed(1)) : 1.2,
          minOrderAmount: Number(s.minimumOrderAmount) || 250,
          baseDeliveryFee: Number(s.baseDeliveryFee) || 80,
          estimatedMinutes: (s as any).estimatedMinutes || 20 + idx * 5,
          imageUrl:
            s.imageUrl ||
            DEFAULT_REFERENCE_STORES[idx % DEFAULT_REFERENCE_STORES.length].imageUrl,
        }))
      : DEFAULT_REFERENCE_STORES;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10" id="stores-section">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Verified Stores Delivering to You
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Local neighborhood merchants ready to pack and dispatch
            </p>
          </div>
          <Link
            to="/stores"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>Browse All Stores</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Store Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {displayStores.map((store) => (
            <Link
              key={store.id}
              to={`/stores/${store.id}`}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col hover:-translate-y-1.5"
            >
              {/* Cover Wrap */}
              <div className="relative h-44 sm:h-48 overflow-hidden bg-slate-100">
                <img
                  src={store.imageUrl}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Floating ETA */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-emerald-700 shadow-md flex items-center gap-1">
                  <span>⚡ ~{store.estimatedMinutes} Mins</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {store.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                    <span className="truncate">
                      {store.addressLine} • {store.distanceKm} km away
                    </span>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Min Order:{' '}
                    <strong className="text-slate-900 font-bold">
                      Rs {store.minOrderAmount}
                    </strong>
                  </span>
                  <span>
                    Delivery:{' '}
                    <strong className="text-slate-900 font-bold">
                      Rs {store.baseDeliveryFee}
                    </strong>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StoresGridSection;
