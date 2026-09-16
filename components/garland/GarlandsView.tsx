'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { GarlandCard } from '@/components/garland/GarlandCard';
import { MOCK_CATEGORIES, MOCK_OCCASIONS } from '@/lib/mock-data';
import { useGarlandStore } from '@/store/garlandStore';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { Garland } from '@/types';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';

interface GarlandsViewProps {
  initialGarlands: Garland[];
}

export function GarlandsView({ initialGarlands }: GarlandsViewProps) {
  const searchParams = useSearchParams();
  const { garlands, setGarlands, fetchGarlands } = useGarlandStore();

  useEffect(() => {
    if (initialGarlands && initialGarlands.length > 0) {
      setGarlands(initialGarlands);
    }
    fetchGarlands();
  }, [initialGarlands, setGarlands, fetchGarlands]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedOccasion, setSelectedOccasion] = useState(searchParams.get('occasion') || '');
  const [priceMax, setPriceMax] = useState(5000);
  const [sort, setSort] = useState<SortOption>('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const activeTab = searchParams.get('tab') || 'all';

  const sourceGarlands = garlands.length > 0 ? garlands : initialGarlands;

  const filtered = useMemo(() => {
    // Only available garlands for customer public view
    let result = sourceGarlands.filter((g) => g.is_available);

    // Tab filters
    if (activeTab === 'featured') result = result.filter((g) => g.is_featured);
    if (activeTab === 'popular') result = result.filter((g) => g.is_popular);

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.flower_type?.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory) {
      result = result.filter((g) => g.category?.slug === selectedCategory);
    }

    // Occasion
    if (selectedOccasion) {
      result = result.filter((g) => g.occasion?.slug === selectedOccasion);
    }

    // Price
    result = result.filter((g) => g.price <= priceMax);

    // Sort
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [sourceGarlands, search, selectedCategory, selectedOccasion, priceMax, sort, activeTab]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedOccasion('');
    setPriceMax(5000);
    setSort('default');
  };

  const hasFilters = search || selectedCategory || selectedOccasion || priceMax < 5000 || sort !== 'default';

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            {activeTab === 'featured' ? '⭐ Featured Garlands' :
             activeTab === 'popular' ? '🔥 Popular Garlands' :
             activeTab === 'occasions' ? '🎉 By Occasion' :
             'Our Garland Collection'}
          </h1>
          <p className="text-gray-500 text-lg">
            {filtered.length} garland{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* ── Occasions tabs (when tab=occasions) ── */}
        {activeTab === 'occasions' && (
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {MOCK_OCCASIONS.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(selectedOccasion === occ.slug ? '' : occ.slug)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all',
                  selectedOccasion === occ.slug
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'
                )}
              >
                {occ.icon} {occ.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Packaging Information Guide Banner ── */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50/40 to-emerald-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0 mt-0.5">ℹ️</span>
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Garland Packaging & Quantity Guide
              </p>
              <div className="text-xs text-gray-600 mt-1 space-y-1 leading-relaxed">
                <p className="flex items-start gap-1.5">
                  <span className="shrink-0">💍</span>
                  <span>
                    All <strong className="text-gray-900">Wedding Garlands</strong> come as <strong className="text-gray-900">1 Pair (2 Garlands — Bride & Groom set)</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="shrink-0">🌸</span>
                  <span>
                    All other pooja, temple, festival & function garlands come as <strong className="text-gray-900">Single (1 Piece)</strong>.
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-amber-200/70 text-[11px] font-semibold text-gray-800 self-start sm:self-auto">
            ✨ As required, you can increase count for each item
          </div>
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <Input
              placeholder="Search garlands, flowers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              rightIcon={
                search ? (
                  <button onClick={() => setSearch('')}>
                    <X className="w-4 h-4 hover:text-rose-500" />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
          >
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name: A–Z</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
              filterOpen || hasFilters
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {hasFilters && '•'}
          </button>
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Category */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                            selectedCategory === cat.slug
                              ? 'bg-jade-600 text-white border-jade-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-jade-300'
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Occasion */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Occasion</p>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_OCCASIONS.map((occ) => (
                        <button
                          key={occ.id}
                          onClick={() => setSelectedOccasion(selectedOccasion === occ.slug ? '' : occ.slug)}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                            selectedOccasion === occ.slug
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                          )}
                        >
                          {occ.icon} {occ.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Max Price: ₹{priceMax.toLocaleString('en-IN')}
                    </p>
                    <input
                      type="range"
                      min={100}
                      max={5000}
                      step={100}
                      value={priceMax}
                      onChange={(e) => setPriceMax(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>₹100</span><span>₹5,000</span>
                    </div>
                  </div>
                </div>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-sm text-rose-500 font-semibold hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🌿</span>
            <h3 className="font-display text-2xl font-bold text-gray-700 mb-2">No garlands found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search term</p>
            <button onClick={clearFilters} className="text-rose-500 font-semibold hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((garland, i) => (
              <GarlandCard key={garland.id} garland={garland} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
