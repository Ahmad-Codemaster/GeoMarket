import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { useStoreCategories } from '../../hooks/useCategories';
import type { ActiveLocation } from './AddressAutocompleteInput';

interface CategoryBrowseSectionProps {
  activeLocation: ActiveLocation | null;
}

const CATEGORY_ICON_MAP: Record<string, string> = {
  grocery: '🥦',
  groceries: '🥦',
  bakery: '🥖',
  pharmacy: '💊',
  meat: '🥩',
  dairy: '🥛',
  produce: '🍎',
  sweets: '🍰',
  beverages: '☕',
  household: '🧼',
  electronics: '🔌',
  general: '🛒',
};

function getCategoryIcon(name: string, index: number): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  const fallbackIcons = ['🥦', '🥖', '💊', '🥩', '🥛', '🛒', '☕', '🍰'];
  return fallbackIcons[index % fallbackIcons.length];
}

export function CategoryBrowseSection({ activeLocation }: CategoryBrowseSectionProps) {
  const { data: categories, isLoading } = useStoreCategories();

  const buildCategoryUrl = (categoryId: string) => {
    const sp = new URLSearchParams();
    sp.append('storeCategoryId', categoryId);
    if (activeLocation) {
      sp.append('latitude', String(activeLocation.latitude));
      sp.append('longitude', String(activeLocation.longitude));
    }
    return `/stores?${sp.toString()}`;
  };

  return (
    <section id="categories" className="py-14 md:py-20 border-b bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Browse Departments
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Explore specialized neighborhood shops catering to your everyday needs
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary hover:text-primary/80 font-semibold"
          >
            <Link to={activeLocation ? `/stores?latitude=${activeLocation.latitude}&longitude=${activeLocation.longitude}` : '/stores'}>
              <span>All Stores</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {categories.map((cat, idx) => {
              const icon = getCategoryIcon(cat.name, idx);
              return (
                <Link
                  key={cat.id}
                  to={buildCategoryUrl(cat.id)}
                  className="group relative p-4 rounded-2xl border bg-card/60 hover:bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1 flex flex-col items-center text-center justify-center gap-2.5"
                >
                  <div
                    className="text-2xl sm:text-3xl p-2.5 rounded-xl bg-secondary/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200"
                    aria-hidden="true"
                  >
                    {icon}
                  </div>
                  <div className="space-y-0.5 w-full">
                    <p className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {cat.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {cat.description || 'Verified local stores'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No store categories available at this moment.
          </div>
        )}
      </div>
    </section>
  );
}
