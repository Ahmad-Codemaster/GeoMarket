import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

/**
 * AuthLayout — centered card layout for login and registration pages.
 * Clean, focused, no navigation distractions.
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      {/* Branding */}
      <Link to="/" className="flex items-center gap-2 mb-8 text-primary font-bold text-2xl">
        <MapPin className="h-6 w-6 text-accent" strokeWidth={2.5} />
        GeoMarket
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-card rounded-xl border shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        </div>
        {children}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} GeoMarket. All rights reserved.
      </p>
    </div>
  );
}
