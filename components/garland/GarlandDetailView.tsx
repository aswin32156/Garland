'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Heart, ShoppingCart, Zap, CheckCircle,
  Maximize2, ZoomIn, ZoomOut, RotateCcw, X,
  ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GarlandCard } from '@/components/garland/GarlandCard';
import toast from 'react-hot-toast';
import { Garland } from '@/types';

function GarlandPlaceholderLarge({ name, index }: { name: string; index: number }) {
  const gradients = [
    ['#fda4b8', '#f43f6e'],
    ['#86efac', '#16a34a'],
    ['#fde68a', '#f59e0b'],
    ['#c4b5fd', '#7c3aed'],
    ['#fdba74', '#ea580c'],
    ['#67e8f9', '#0891b2'],
  ];
  const [from, to] = gradients[index % gradients.length];
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${from}22, ${to}33)` }}
    >
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center text-5xl shadow-xl mb-3"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        🌸
      </div>
      <p className="text-sm font-semibold text-gray-600 text-center px-8">{name}</p>
    </div>
  );
}

interface GarlandDetailViewProps {
  garland: Garland;
  allGarlands: Garland[];
}

export function GarlandDetailView({ garland, allGarlands }: GarlandDetailViewProps) {
  const idx = allGarlands.findIndex((g) => g.id === garland.id || g.slug === garland.slug);
  const [quantity, setQuantity] = useState(1);
  const images = Array.isArray(garland.images)
    ? garland.images.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    : [];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const currentImage = images[selectedImageIndex] || images[0] || null;

  // Full-size image lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');

  // Keyboard navigation for full size lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
        setZoomLevel(1);
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoomLevel(1);
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(3, z + 0.25));
      } else if (e.key === '-') {
        setZoomLevel((z) => Math.max(0.75, z - 0.25));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    }

    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, images.length]);

  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const { hasItem, toggleItem } = useWishlistStore();
  const wishlisted = hasItem(garland.id);

  const related = allGarlands.filter(
    (g) => g.id !== garland.id && (g.category_id === garland.category_id || g.occasion_id === garland.occasion_id)
  ).slice(0, 4);

  function handleAddToCart() {
    if (!user) {
      openAuthModal({ garland, quantity });
      return;
    }
    addItem(garland, quantity);
    toast.success(`${quantity}× ${garland.name} added to cart! 🌸`);
  }

  function handleBuyNow() {
    if (!user) {
      openAuthModal({ garland, quantity }, '/cart');
      return;
    }
    addItem(garland, quantity);
    window.location.href = '/cart';
  }

  function handleWishlistToggle() {
    const added = toggleItem(garland);
    toast.success(added ? `${garland.name} added to wishlist! 💕` : 'Removed from wishlist');
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back link */}
        <Link
          href="/garlands"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Garlands
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Image Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main image container */}
            <div
              onClick={() => {
                if (currentImage) {
                  setIsLightboxOpen(true);
                  setZoomLevel(1);
                }
              }}
              className="group aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-cream-100 via-rose-50/20 to-cream-200 relative shadow-sm border border-rose-100/60 cursor-zoom-in transition-all hover:shadow-xl"
              title="Click to view full picture in full size"
            >
              {currentImage ? (
                <>
                  {/* Subtle blur background for tall/wide uploaded garlands */}
                  {imageFitMode === 'contain' && (
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-110 pointer-events-none"
                      style={{ backgroundImage: `url(${currentImage})` }}
                    />
                  )}
                  <img
                    src={currentImage}
                    alt={garland.name}
                    className={`relative z-10 w-full h-full transition-all duration-300 group-hover:scale-[1.02] ${
                      imageFitMode === 'contain' ? 'object-contain p-3' : 'object-cover'
                    }`}
                  />
                </>
              ) : (
                <GarlandPlaceholderLarge name={garland.name} index={idx >= 0 ? idx : 0} />
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {garland.is_featured && (
                  <Badge variant="rose">⭐ Featured</Badge>
                )}
                {garland.is_popular && (
                  <Badge variant="gold">🔥 Popular</Badge>
                )}
              </div>

              {/* Top-Right: Fit Mode toggle & Fullscreen trigger */}
              {currentImage && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFitMode((m) => (m === 'contain' ? 'cover' : 'contain'));
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-gray-700 text-[11px] font-bold backdrop-blur-md shadow-xs border border-gray-200/80 transition-all cursor-pointer"
                    title={imageFitMode === 'contain' ? 'Fill frame' : 'Fit entire uploaded garland'}
                  >
                    {imageFitMode === 'contain' ? 'Crop to Fill' : 'Fit Entire Garland'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                      setZoomLevel(1);
                    }}
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center backdrop-blur-md shadow-xs border border-gray-200/80 transition-all hover:scale-110 cursor-pointer"
                    title="View Full Size Picture"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              )}

              {/* Hover overlay hint */}
              {currentImage && (
                <div className="absolute inset-x-0 bottom-0 z-20 p-3.5 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-gray-900 text-xs font-bold shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5 text-rose-500" />
                    Click to view full picture in full size
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(i);
                      setZoomLevel(1);
                    }}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                      selectedImageIndex === i ? 'border-rose-500 shadow-md scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${garland.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Details Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {garland.category && <Badge variant="jade">{garland.category.name}</Badge>}
              {garland.occasion && <Badge variant="rose">{garland.occasion.icon} {garland.occasion.name}</Badge>}
              {garland.flower_type && <Badge variant="gray">{garland.flower_type}</Badge>}
            </div>

            {/* Name */}
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {garland.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-4xl font-bold text-gray-900">
                {formatPrice(garland.price)}
              </span>
              {garland.is_available ? (
                <Badge variant="available">
                  <CheckCircle className="w-3 h-3" /> In Stock
                </Badge>
              ) : (
                <Badge variant="unavailable">Unavailable</Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-6">{garland.description}</p>

            {/* Garland details */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { label: 'Flower Type', value: garland.flower_type || 'Mixed' },
                { label: 'Occasion', value: garland.occasion?.name || 'All Occasions' },
                { label: 'Category', value: garland.category?.name || 'General' },
                { label: 'Collection', value: garland.collection_tag || 'Regular' },
              ].map((detail) => (
                <div key={detail.label} className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{detail.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{detail.value}</p>
                </div>
              ))}
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-gray-700">Quantity:</span>
              <div className="flex items-center gap-1 border-2 border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-rose-50 hover:text-rose-500 transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-rose-50 hover:text-rose-500 transition-colors"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">
                Subtotal: <strong className="text-gray-800">{formatPrice(garland.price * quantity)}</strong>
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!garland.is_available}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={!garland.is_available}
                size="lg"
                className="flex-1"
              >
                <Zap className="w-5 h-5" />
                Buy Now
              </Button>
              <button
                onClick={handleWishlistToggle}
                className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-rose-300 transition-colors shrink-0"
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 transition-colors ${wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
              </button>
            </div>

            {/* Guarantees */}
            <div className="mt-6 p-4 rounded-2xl bg-jade-50 border border-jade-100">
              <div className="flex flex-col gap-2">
                {[
                  { icon: '🌸', text: 'Always fresh — prepared on the day of pickup' },
                  { icon: '📅', text: 'Pre-order up to 7 days in advance' },
                  { icon: '⏰', text: 'Choose a convenient pickup time slot' },
                  { icon: '✅', text: 'Secure online payment via Razorpay' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-jade-800">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Related Garlands ── */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-gray-900">You May Also Like</h2>
              <Link href="/garlands" className="text-sm font-semibold text-rose-500 hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((g, i) => (
                <GarlandCard key={g.id} garland={g} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Fullscreen Lightbox Modal (Full Picture Cover & Full Size) ── */}
      <AnimatePresence>
        {isLightboxOpen && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none"
            onClick={() => {
              setIsLightboxOpen(false);
              setZoomLevel(1);
            }}
          >
            {/* Top Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10 text-white"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xl shrink-0">
                  🌸
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">
                    {garland.name}
                  </h3>
                  <p className="text-xs text-rose-300 truncate">
                    {garland.flower_type || 'Handcrafted Fresh Blooms'} • {formatPrice(garland.price)}
                    {images.length > 1 && ` • Photo ${selectedImageIndex + 1} of ${images.length}`}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/10 mr-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono px-2 text-gray-300">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {zoomLevel !== 1 && (
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Reset Zoom (0)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <a
                  href={currentImage}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  title="Open original high-res image in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-medium">Original File</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomLevel(1);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer flex items-center gap-1"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs font-medium pr-1">Esc</span>
                </button>
              </div>
            </div>

            {/* Central Viewport */}
            <div
              className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }
              }}
            >
              {/* Previous Image Arrow */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    setZoomLevel(1);
                  }}
                  className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110 cursor-pointer shadow-2xl"
                  title="Previous photo (←)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* The Full Size Image */}
              <motion.img
                key={`${currentImage}-${selectedImageIndex}`}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: zoomLevel, opacity: 1 }}
                transition={{ duration: 0.2 }}
                src={currentImage}
                alt={garland.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel((z) => (z === 1 ? 1.5 : 1));
                }}
                className={`max-h-[82vh] max-w-[92vw] w-auto h-auto object-contain rounded-2xl shadow-2xl transition-transform duration-200 select-none ${
                  zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                style={{
                  transform: `scale(${zoomLevel})`,
                }}
              />

              {/* Next Image Arrow */}
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev + 1) % images.length);
                    setZoomLevel(1);
                  }}
                  className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110 cursor-pointer shadow-2xl"
                  title="Next photo (→)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Bar: Thumbnails & Navigation Hint */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full px-4 py-3 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-2 z-10"
            >
              {images.length > 1 && (
                <div className="flex gap-2 max-w-full overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedImageIndex(i);
                        setZoomLevel(1);
                      }}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        selectedImageIndex === i
                          ? 'border-rose-500 scale-105 shadow-xl ring-2 ring-rose-400/50'
                          : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-400 text-center">
                Click image to zoom • Use arrow keys (← →) to flip • Press Esc or click backdrop to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
