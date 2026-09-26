import React from 'react';
import { Check, Clock, CreditCard, ShieldCheck } from 'lucide-react';

export function TrustBarSection() {
  return (
    <div className="bg-white border-y border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Item 1 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
              Verified Neighborhood Stores
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Only real deliverable in-stock items
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
              Direct Doorstep Delivery
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct from local store counters
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
              100% Cash on Delivery
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect your goods before paying
            </p>
          </div>
        </div>

        {/* Item 4 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
              Same In-Store Prices
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Guaranteed authentic shelf pricing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrustBarSection;
