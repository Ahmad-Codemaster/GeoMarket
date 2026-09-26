import React, { useState, useRef } from 'react';
import { MapPin, Compass } from 'lucide-react';

export function Interactive3DHero() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(-4);
  const [rotY, setRotY] = useState(6);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;

    setRotX(tiltX);
    setRotY(tiltY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(-4);
    setRotY(6);
  };

  return (
    <div
      className="relative w-full max-w-md lg:max-w-lg mx-auto select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute -top-8 -left-8 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main 3D Card Surface */}
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/20 dark:border-white/10 bg-gradient-to-br from-card/90 via-card/80 to-background/90 backdrop-blur-xl shadow-2xl p-6 transition-transform duration-200 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) ${isHovered ? 'scale(1.02)' : 'scale(1)'}`,
        }}
      >
        {/* Holographic Border Shine */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/10 via-transparent to-amber-500/15 pointer-events-none" />

        {/* Header Radar Status */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              Neighborhood Radar
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Compass className="h-3 w-3 animate-spin" style={{ animationDuration: '10s' }} />
            PostGIS Spatial Filter
          </span>
        </div>

        {/* Radar Sphere & Store Map Pin */}
        <div className="relative h-48 sm:h-52 rounded-xl bg-gradient-to-b from-secondary/80 to-secondary/30 border border-border/50 overflow-hidden flex items-center justify-center">
          {/* Concentric Radar Wave Rings */}
          <div className="absolute w-36 h-36 rounded-full border border-emerald-500/20 animate-pulse" />
          <div className="absolute w-56 h-56 rounded-full border border-emerald-500/15" />
          <div className="absolute w-72 h-72 rounded-full border border-emerald-500/10" />

          {/* Center User Pin */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-2.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="mt-1.5 px-2 py-0.5 bg-background/90 backdrop-blur-md rounded text-[10px] font-bold shadow-xs border">
              Delivery Destination
            </div>
          </div>

          {/* Floating Store Node 1 */}
          <div className="absolute top-4 left-6 flex items-center gap-1.5 p-1.5 bg-card/90 backdrop-blur-md rounded-lg shadow-md border text-[11px]">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">Local Fresh Mart</span>
            <span className="text-[9px] text-muted-foreground">0.8 km</span>
          </div>

          {/* Floating Store Node 2 */}
          <div className="absolute bottom-4 right-6 flex items-center gap-1.5 p-1.5 bg-card/90 backdrop-blur-md rounded-lg shadow-md border text-[11px]">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">City Pharmacy</span>
            <span className="text-[9px] text-muted-foreground">1.4 km</span>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 pt-3.5 mt-2 text-center border-t border-border/40">
          <div className="p-2 rounded-lg bg-background/60 border text-center">
            <p className="text-[10px] text-muted-foreground">Dispatch</p>
            <p className="text-xs font-bold text-foreground">Fast &amp; Direct</p>
          </div>
          <div className="p-2 rounded-lg bg-background/60 border text-center">
            <p className="text-[10px] text-muted-foreground">Payment</p>
            <p className="text-xs font-bold text-amber-500">Cash on Delivery</p>
          </div>
          <div className="p-2 rounded-lg bg-background/60 border text-center">
            <p className="text-[10px] text-muted-foreground">Stores</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">100% Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
}
