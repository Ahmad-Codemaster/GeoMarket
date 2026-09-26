import React, { useRef, useState } from 'react';
import { Sparkles, ArrowRight, Clock, Check, CreditCard, Volume2, VolumeX, MapPin } from 'lucide-react';
import { useAuthoritativeLocation } from '../../hooks/useAuthoritativeLocation';

export function HeroVideoSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const { setLocationModalOpen, activeLocation } = useAuthoritativeLocation();

  const toggleSound = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const scrollToStores = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('stores-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayLocation = activeLocation?.label?.split(',')[0] || 'D Ground, Faisalabad';

  return (
    <section className="px-4 sm:px-6 lg:px-8 pt-5 pb-3">
      <div className="max-w-7xl mx-auto relative min-h-[520px] rounded-3xl overflow-hidden flex items-center bg-slate-900 border border-slate-200/80 shadow-2xl shadow-slate-900/10">
        {/* Background Cinematic Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center z-0"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/hero_section.mp4" type="video/mp4" />
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-and-fruits-on-display-40546-large.mp4"
            type="video/mp4"
          />
        </video>

        {/* Ambient Dark Gradient Layer for Pristine Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/65 to-transparent z-10" />

        {/* Hero Content */}
        <div className="relative z-20 max-w-2xl px-6 sm:px-12 lg:px-16 py-14 sm:py-20 text-white">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-emerald-900 mb-6 shadow-sm border border-white/95">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Direct From Local Store Shelves</span>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5"
            >
              <MapPin className="w-3 h-3" />
              <span>{displayLocation}</span>
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5 text-white">
            Fresh goods from your neighborhood,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
              delivered in minutes.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-8 max-w-xl font-medium">
            Enjoy hand-picked produce, artisan bakery, and daily essentials straight from verified physical stores near you, delivered right to your door.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={scrollToStores}
              className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-100 text-slate-950 px-7 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base shadow-xl shadow-black/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <span>Shop Nearby Stores</span>
              <ArrowRight className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
            </button>
          </div>

          {/* Feature Mini Pills */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              <span>Fast Direct Dispatch</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              <span>Same Shelf Pricing</span>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Floating Sound Toggle Pill */}
        <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-20">
          <button
            type="button"
            onClick={toggleSound}
            className="bg-white/85 hover:bg-white text-slate-800 text-xs font-bold px-3.5 py-2 rounded-full border border-white/90 backdrop-blur-md shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            aria-label={isMuted ? 'Turn Sound On' : 'Mute Video'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-slate-600" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="text-emerald-700">Sound On</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroVideoSection;
