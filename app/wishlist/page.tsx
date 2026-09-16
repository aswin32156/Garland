'use client';

import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, cn } from '@/lib/utils';
import { getGarlandPackagingInfo } from '@/lib/garland-utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Garland } from '@/types';

export default function WishlistPage() {
  const { items: wishlist, removeItem } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  function remove(id: string) {
    removeItem(id);
    toast.success('Removed from wishlist');
  }

  function moveToCart(garland: Garland) {
    if (!user) {
      openAuthModal({ garland, quantity: 1 });
      return;
    }
    addItem(garland, 1);
    removeItem(garland.id);
    toast.success(`${garland.name} moved to cart! 🛒`);
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-300" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tap the heart icon on any wedding, temple, or pooja garland to save it for your celebration.
          </p>
          <Link href="/garlands">
            <Button size="lg" className="rounded-full">
              Explore Fresh Garlands
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'linear-gradient(180deg, #fff7f9 0%, #fcfbf9 100%)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-900">My Saved Garlands</h1>
              <p className="text-xs text-gray-500">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved in your wishlist
              </p>
            </div>
          </div>
          <Link
            href="/garlands"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {wishlist.map((garland) => {
              const packaging = getGarlandPackagingInfo(garland);
              return (
                <motion.div
                  key={garland.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-2xl shadow-[var(--shadow-card)] border border-rose-50 flex gap-4 p-4 hover:border-rose-200 transition-all group"
                >
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-rose-100 to-cream-100 flex items-center justify-center text-3xl shrink-0 shadow-inner overflow-hidden">
                    {garland.images?.[0] ? (
                      <img src={garland.images[0]} alt={garland.name} className="w-full h-full object-cover" />
                    ) : (
                      '🌸'
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link href={`/garlands/${garland.slug}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-rose-600 transition-colors line-clamp-1 text-sm sm:text-base">
                          {garland.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {garland.category?.name || 'Garland'} · {garland.flower_type || 'Fresh Flowers'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            packaging.isWedding
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          )}
                        >
                          {packaging.badgeShort}
                        </span>
                        <p className="font-bold text-rose-600 font-display text-sm">
                          {formatPrice(garland.price)}{' '}
                          <span className="text-[10px] font-normal text-gray-500">
                            / {packaging.unitLabel}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => moveToCart(garland)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition-colors shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                      </button>
                      <button
                        onClick={() => remove(garland.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
