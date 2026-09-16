'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Garland } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { getGarlandPackagingInfo } from '@/lib/garland-utils';
import toast from 'react-hot-toast';

interface GarlandCardProps {
  garland: Garland;
  index?: number;
}

// Beautiful SVG placeholder when no image
function GarlandPlaceholder({ name, index = 0 }: { name: string; index?: number }) {
  const gradients = [
    ['#fda4b8', '#f43f6e'],
    ['#86efac', '#16a34a'],
    ['#fde68a', '#f59e0b'],
    ['#c4b5fd', '#7c3aed'],
    ['#fdba74', '#ea580c'],
    ['#67e8f9', '#0891b2'],
  ];
  const [from, to] = gradients[index % gradients.length];
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${from}22, ${to}44)` }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-2"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        🌸
      </div>
      <p className="text-xs font-semibold text-gray-600 text-center px-4 leading-tight">{name}</p>
    </div>
  );
}

export function GarlandCard({ garland, index = 0 }: GarlandCardProps) {
  const { hasItem, toggleItem } = useWishlistStore();
  const wishlisted = hasItem(garland.id);
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const packaging = getGarlandPackagingInfo(garland);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal({ garland, quantity: 1 });
      return;
    }

    addItem(garland, 1);
    const toastMsg = packaging.isWedding
      ? `${garland.name} (1 Pair / 2 Garlands) added to cart! 💍`
      : `${garland.name} added to cart! 🌸`;
    toast.success(toastMsg, {
      style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
    });
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const isAdded = toggleItem(garland);
    if (isAdded) {
      toast.success(`${garland.name} added to wishlist! 💕`);
    } else {
      toast.success('Removed from wishlist');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden card-hover"
    >
      {/* Image Area */}
      <Link href={`/garlands/${garland.slug}`} className="block relative overflow-hidden bg-rose-50/40" style={{ aspectRatio: '4/3' }}>
        <div className="w-full h-full">
          {garland.images && garland.images.length > 0 && garland.images[0] ? (
            <img
              src={garland.images[0]}
              alt={garland.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <GarlandPlaceholder name={garland.name} index={index} />
          )}
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <span className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-gray-800 shadow-lg">
              <Eye className="w-4 h-4" /> View Details
            </span>
          </motion.div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {garland.is_featured && (
            <Badge variant="rose">⭐ Featured</Badge>
          )}
          {garland.is_popular && (
            <Badge variant="gold">🔥 Popular</Badge>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs backdrop-blur-md border',
              packaging.isWedding
                ? 'bg-amber-600/90 text-white border-amber-400'
                : 'bg-emerald-600/90 text-white border-emerald-500'
            )}
          >
            {packaging.badgeLabel}
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
          aria-label="Add to wishlist"
        >
          <Heart
            className={cn('w-4 h-4 transition-colors', wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-500')}
          />
        </button>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/garlands/${garland.slug}`}>
            <h3 className="font-display font-semibold text-gray-900 text-base leading-tight hover:text-rose-600 transition-colors line-clamp-1">
              {garland.name}
            </h3>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed">
          {garland.description}
        </p>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {garland.category && (
            <Badge variant="jade">{garland.category.name}</Badge>
          )}
          {garland.flower_type && (
            <Badge variant="gray">{garland.flower_type}</Badge>
          )}
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
              packaging.isWedding
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            )}
          >
            {packaging.isWedding ? '💍 1 Pair (2 Garlands)' : '🌸 Single (1 Pc)'}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900 font-display">
                {formatPrice(garland.price)}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                / {packaging.isWedding ? 'Pair (2 pcs)' : 'Single (1 pc)'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">
              {packaging.isWedding
                ? '2 Garlands included • Increase count as required'
                : '1 Garland included • Increase count as required'}
            </p>
            {!garland.is_available && (
              <Badge variant="unavailable" className="mt-1">Unavailable</Badge>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!garland.is_available}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer',
              garland.is_available
                ? 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
