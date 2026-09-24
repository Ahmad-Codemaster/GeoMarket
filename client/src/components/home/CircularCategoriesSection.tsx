import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProductCategories } from '../../hooks/useCategories';

interface CategoryItem {
  id: string;
  name: string;
  image: string;
  queryParam: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-produce',
    name: 'Fresh Produce',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=240',
    queryParam: 'produce',
  },
  {
    id: 'cat-bakery',
    name: 'Artisan Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=240',
    queryParam: 'bakery',
  },
  {
    id: 'cat-meat',
    name: 'Butcher & Meat',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=240',
    queryParam: 'meat',
  },
  {
    id: 'cat-pharmacy',
    name: 'Pharmacy 24/7',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=240',
    queryParam: 'pharmacy',
  },
  {
    id: 'cat-dairy',
    name: 'Dairy & Milk',
    image: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&q=80&w=240',
    queryParam: 'dairy',
  },
  {
    id: 'cat-snacks',
    name: 'Chocolates & Treats',
    image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&q=80&w=240',
    queryParam: 'snacks',
  },
  {
    id: 'cat-personal',
    name: 'Personal Care',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=240',
    queryParam: 'personal_care',
  },
];

export function CircularCategoriesSection() {
  const { data: dbCategories } = useProductCategories();

  // Combine backend categories if available, falling back seamlessly to default visual categories
  const categories: CategoryItem[] =
    dbCategories && dbCategories.length > 0
      ? dbCategories.slice(0, 7).map((c, idx) => ({
          id: c.id,
          name: c.name,
          image:
            DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length]?.image ||
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=240',
          queryParam: c.id,
        }))
      : DEFAULT_CATEGORIES;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Explore Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select a department to view products available in your neighborhood
            </p>
          </div>
          <Link
            to="/products"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Circular Avatars Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-5 sm:gap-6 text-center">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${encodeURIComponent(cat.queryParam)}`}
              className="group flex flex-col items-center gap-2.5 transition-transform duration-200 hover:-translate-y-1.5"
            >
              {/* Circle Avatar */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-white border-2 border-slate-200 p-1 flex items-center justify-center shadow-xs transition-all duration-300 group-hover:border-emerald-600 group-hover:shadow-lg group-hover:shadow-emerald-600/20">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Title */}
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors text-center line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CircularCategoriesSection;
