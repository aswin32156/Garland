'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, cn } from '@/lib/utils';
import { getGarlandPackagingInfo } from '@/lib/garland-utils';
import { Button } from '@/components/ui/Button';

function QuantityControl({ id, quantity }: { id: string; quantity: number }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  return (
    <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => updateQuantity(id, quantity - 1)}
        className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-rose-50 hover:text-rose-500 transition-colors"
      >
        −
      </button>
      <span className="w-8 text-center font-bold text-sm text-gray-900">{quantity}</span>
      <button
        onClick={() => updateQuantity(id, quantity + 1)}
        className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-rose-50 hover:text-rose-500 transition-colors"
      >
        +
      </button>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, getTotal } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const total = getTotal();

  function handleProceedToCheckout() {
    if (!user) {
      openAuthModal(null, '/checkout');
      return;
    }
    router.push('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="text-7xl mb-6 block">🛒</span>
          <h2 className="font-display text-3xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Browse our fresh garlands and add your favourites.</p>
          <Link href="/garlands">
            <Button size="lg">
              <ShoppingBag className="w-5 h-5" /> Browse Garlands
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-gray-900 flex items-center gap-2">
              <span>🛒</span> My Cart
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review your fresh garland pre-orders before selecting pickup
            </p>
          </div>
          <Link
            href="/garlands"
            className="text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Cart Items ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Packaging Reminder Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start sm:items-center gap-2.5 text-xs text-amber-950">
              <span className="text-base shrink-0">💡</span>
              <p className="leading-relaxed">
                <strong className="font-bold">Packaging Reminder:</strong> Wedding garlands come as a <strong className="font-bold">Pair (2 Garlands — Bride & Groom set)</strong>. Other garlands come as <strong className="font-bold">Single (1 Piece)</strong>. You can increase or decrease the count below as required.
              </p>
            </div>

            <AnimatePresence>
              {items.map((item) => {
                const packaging = getGarlandPackagingInfo(item.garland);
                const subtitle = [item.garland.flower_type, item.garland.category?.name]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-card)] border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    {/* Top Row on Mobile: Thumbnail + Info + Delete button */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-rose-100 to-cream-200 flex items-center justify-center shrink-0 text-2xl shadow-inner overflow-hidden">
                        {item.garland.images?.[0] ? (
                          <img
                            src={item.garland.images[0]}
                            alt={item.garland.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          '🌸'
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1">
                          {item.garland.name}
                        </h3>
                        {subtitle && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {subtitle}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                              packaging.isWedding
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            )}
                          >
                            {packaging.badgeLabel}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-rose-600">
                            {formatPrice(item.garland.price)}{' '}
                            <span className="text-[11px] font-normal text-gray-500">
                              / {packaging.unitLabel}
                            </span>
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-600 mt-1">
                          You receive: <strong className="text-gray-900">{packaging.getQuantitySummary(item.quantity)}</strong>
                        </p>
                      </div>

                      {/* Mobile Delete Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="sm:hidden text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
                        aria-label="Remove item"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Row on Mobile / Right Column on Desktop */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                      <div className="flex flex-col items-center sm:items-start gap-1">
                        <QuantityControl id={item.id} quantity={item.quantity} />
                        <span className="text-[10px] text-gray-400 font-medium">
                          Count: {item.quantity}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block sm:hidden">Total</span>
                          <span className="font-bold text-gray-900 min-w-[75px] text-right text-base sm:text-sm font-display">
                            {formatPrice(item.garland.price * item.quantity)}
                          </span>
                        </div>

                        {/* Desktop Delete Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="hidden sm:flex text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          aria-label="Remove item"
                          title="Remove item"
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

          {/* ── Order Summary ── */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] sticky top-28">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const packaging = getGarlandPackagingInfo(item.garland);
                  return (
                    <div key={item.id} className="flex justify-between text-sm gap-2">
                      <div className="truncate flex-1 min-w-0">
                        <span className="text-gray-800 font-medium block truncate">
                          {item.garland.name} × {item.quantity}
                        </span>
                        <span className="text-[11px] text-gray-500 block">
                          {packaging.getQuantitySummary(item.quantity)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800 shrink-0">
                        {formatPrice(item.garland.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Total</span>
                  <span className="text-rose-600 font-display">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Store pickup — no delivery charges</p>
              </div>

              <Button size="lg" className="w-full" onClick={handleProceedToCheckout}>
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Pickup note */}
              <div className="mt-4 p-3 rounded-xl bg-jade-50 border border-jade-100">
                <p className="text-xs text-jade-700 font-medium">
                  📅 You&apos;ll select your pickup date & time at checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
