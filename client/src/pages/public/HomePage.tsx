import React from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { HeroVideoSection } from '../../components/home/HeroVideoSection';
import { CircularCategoriesSection } from '../../components/home/CircularCategoriesSection';
import { StoresGridSection } from '../../components/home/StoresGridSection';
import { ProductsGridSection } from '../../components/home/ProductsGridSection';
import { PromoBannersSection } from '../../components/home/PromoBannersSection';
import { TrustBarSection } from '../../components/home/TrustBarSection';
import { useAuthoritativeLocation } from '../../hooks/useAuthoritativeLocation';
import { useDiscoveredStores } from '../../hooks/useDiscovery';

export function HomePage() {
  const { activeLocation } = useAuthoritativeLocation();

  // Query verified stores delivering to the customer's authoritative location
  const { data: storesData, isLoading: storesLoading } = useDiscoveredStores(
    activeLocation
      ? {
          latitude: activeLocation.latitude,
          longitude: activeLocation.longitude,
          pageSize: 6,
        }
      : null
  );

  const stores = storesData?.stores || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* ─── 1. TOP BAR, BRAND HEADER & CATEGORY NAVIGATION ────────────────── */}
      <Header />

      <main className="flex-1">
        {/* ─── 2. CINEMATIC VIDEO HERO SECTION ─────────────────────────────── */}
        <HeroVideoSection />

        {/* ─── 3. POPULAR CIRCULAR CATEGORIES ──────────────────────────────── */}
        <CircularCategoriesSection />

        {/* ─── 4. VERIFIED STORES DELIVERING TO YOU ────────────────────────── */}
        <StoresGridSection stores={stores} isLoading={storesLoading} />

        {/* ─── 5. IN-STOCK PRODUCT DEALS ───────────────────────────────────── */}
        <ProductsGridSection />

        {/* ─── 6. PROMOTIONAL SPOTLIGHTS ───────────────────────────────────── */}
        <PromoBannersSection />

        {/* ─── 7. TRUST & VALUE PROPOSITION MATRIX ─────────────────────────── */}
        <TrustBarSection />
      </main>

      {/* ─── 8. MEGA FOOTER ──────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}

export default HomePage;
