import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Truck,
  Sparkles,
  Store,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ─── Hero Section with 3D Depth ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        {/* Ambient background glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 backdrop-blur-md shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Our Mission &amp; Purpose
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Bridging Local Merchants &amp; <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Neighborhood Communities
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            GeoMarket replaces multi-day shipping bottlenecks with instant spatial discovery. We empower your trusted neighborhood grocers, pharmacies, and artisans with enterprise-grade hyperlocal delivery technology.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="font-bold gap-2 shadow-xl hover-lift bg-emerald-600 hover:bg-emerald-500 text-white">
              <Link to="/stores">
                <Store className="h-4 w-4" />
                Explore Nearby Stores
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-semibold gap-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
              <Link to="/register/vendor">
                <HeartHandshake className="h-4 w-4 text-amber-400" />
                Partner as Merchant
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Metrics Scoreboard ────────────────────────────────────────── */}
      <section className="-mt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Verified Merchants', val: '100+', icon: Store, color: 'text-emerald-600' },
            { label: 'Spatial Accuracy', val: '100m', icon: MapPin, color: 'text-teal-600' },
            { label: 'Average Delivery', val: '45 mins', icon: Clock, color: 'text-amber-600' },
            { label: 'Price Guarantee', val: 'Zero Markup', icon: ShieldCheck, color: 'text-primary' },
          ].map((stat, i) => (
            <Card key={i} className="border-slate-200/80 shadow-md bg-white/95 backdrop-blur-md rounded-2xl hover-lift transition-all">
              <CardContent className="p-5 text-center space-y-1">
                <stat.icon className={`h-6 w-6 mx-auto ${stat.color} mb-1`} />
                <div className="text-xl sm:text-2xl font-black text-slate-900">{stat.val}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Core Pillars ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <Badge variant="outline" className="text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
            Why GeoMarket
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Hyperlocal Transparency
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Traditional marketplaces force you to wait days. GeoMarket uses real-time PostGIS radius queries to deliver directly from physical shops operating in your radius.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Spatial PostGIS Precision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every storefront defines an accurate delivery perimeter. You only see items from approved merchants that are verified to deliver to your exact street.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Vetted Local Retailers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We approve authentic neighborhood supermarkets, pharmacies, organic bakeries, and electronic merchants, verifying tax documents and storefront credentials.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Historical Price Integrity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Order line items and totals are strictly snapshot-locked at purchase time. You pay true merchant prices without unpredictable surge pricing or hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to experience neighborhood commerce?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto">
            Browse authentic local stores delivering fresh directly to your doorstep with cash on delivery.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button size="lg" asChild className="bg-white text-emerald-950 font-bold hover:bg-emerald-50 shadow-md">
              <Link to="/stores">
                Start Shopping Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
