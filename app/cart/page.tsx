'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
            🛒 My Cart
          </h1>
          <Link href="/garlands" className="text-sm text-gray-500 hover:text-rose-500 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Cart Items ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl p-4 shadow-[var(--shadow-card)] flex gap-4"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-rose-100 to-cream-200 flex items-center justify-center shrink-0 text-2xl">
                    🌸
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.garland.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.garland.flower_type} · {item.garland.category?.name}
                    </p>
                    <p className="text-sm font-bold text-rose-600 mt-1">{formatPrice(item.garland.price)} each</p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <QuantityControl id={item.id} quantity={item.quantity} />
                      <span className="font-bold text-gray-900 min-w-[70px] text-right text-sm">
                        {formatPrice(item.garland.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Order Summary ── */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-[var(--shadow-card)] sticky top-28">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.garland.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-800 shrink-0">
                      {formatPrice(item.garland.price * item.quantity)}
                    </span>
                  </div>
                ))}
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
