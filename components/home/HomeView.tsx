'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Clock, MapPin, ShoppingBag, Phone } from 'lucide-react';
import { GarlandCard } from '@/components/garland/GarlandCard';
import { MOCK_OCCASIONS } from '@/lib/mock-data';
import { useGarlandStore } from '@/store/garlandStore';
import { Button } from '@/components/ui/Button';
import { Garland } from '@/types';

// ── Floating Petal ──────────────────────────────────────────────────────────
function FloatingPetal({ style, emoji }: { style: React.CSSProperties; emoji: string }) {
  return (
    <div
      className="absolute pointer-events-none select-none text-2xl animate-float-petal"
      style={style}
      aria-hidden="true"
    >
      {emoji}
    </div>
  );
}

const petals = [
  { emoji: '🌸', style: { left: '10%', top: '20%', animationDuration: '8s', animationDelay: '0s', opacity: 0.6 } },
  { emoji: '🌺', style: { left: '25%', top: '60%', animationDuration: '10s', animationDelay: '2s', opacity: 0.5 } },
  { emoji: '🌼', style: { left: '70%', top: '15%', animationDuration: '7s', animationDelay: '1s', opacity: 0.5 } },
  { emoji: '🌹', style: { left: '85%', top: '50%', animationDuration: '9s', animationDelay: '3s', opacity: 0.4 } },
  { emoji: '🌸', style: { left: '50%', top: '80%', animationDuration: '11s', animationDelay: '0.5s', opacity: 0.3 } },
  { emoji: '🌺', style: { left: '40%', top: '30%', animationDuration: '6s', animationDelay: '4s', opacity: 0.4 } },
  { emoji: '🌷', style: { left: '60%', top: '70%', animationDuration: '8.5s', animationDelay: '1.5s', opacity: 0.3 } },
];

// ── How It Works steps ─────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🔍',
    title: 'Browse & Choose',
    desc: 'Explore our beautiful collection of fresh garlands. Filter by occasion, flower type, or price.',
  },
  {
    step: '02',
    icon: '🛒',
    title: 'Add to Cart',
    desc: 'Select your garlands, choose quantity, and add them to your cart. Mix and match multiple garlands.',
  },
  {
    step: '03',
    icon: '📅',
    title: 'Pick a Time Slot',
    desc: 'Choose a convenient pickup date and time slot. We\'ll have your garlands freshly prepared.',
  },
  {
    step: '04',
    icon: '💳',
    title: 'Pay Securely',
    desc: 'Pay online using UPI, card, or net banking via our secure Razorpay payment gateway.',
  },
  {
    step: '05',
    icon: '🌸',
    title: 'Collect & Smile',
    desc: 'Walk in at your selected time, show your order QR code, and collect your fresh garlands!',
  },
];

interface HomeViewProps {
  initialGarlands: Garland[];
}

export function HomeView({ initialGarlands }: HomeViewProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { garlands, setGarlands, fetchGarlands } = useGarlandStore();

  useEffect(() => {
    if (initialGarlands && initialGarlands.length > 0) {
      setGarlands(initialGarlands);
    }
    fetchGarlands();
  }, [initialGarlands, setGarlands, fetchGarlands]);

  const currentGarlands = garlands.length > 0 ? garlands : initialGarlands;
  const featuredGarlands = currentGarlands.filter((g) => g.is_featured && g.is_available).slice(0, 4);
  const popularGarlands = currentGarlands.filter((g) => g.is_popular && !g.is_featured && g.is_available).slice(0, 4);

  return (
    <div className="bg-floral-pattern">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #fff1f5 0%, #fefdf8 35%, #f0fdf4 70%, #fff1f5 100%)',
        }}
      >
        {/* Floating petals */}
        {petals.map((p, i) => (
          <FloatingPetal key={i} emoji={p.emoji} style={p.style as React.CSSProperties} />
        ))}

        {/* Large decorative circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-rose-100/50 blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-jade-100/50 blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-24 pb-16"
        >
          {/* Pre-headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 border border-rose-200 mb-6"
          >
            <span className="text-rose-600 text-sm font-semibold">🌸 Pre-Order Online · Pickup Fresh</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.15]"
          >
            Fresh Garlands,{' '}
            <span className="text-gradient-rose">Beautifully</span>{' '}
            <br className="hidden sm:block" />
            <span className="text-gradient-rose">Crafted</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Choose your garland, pre-order online, and collect it fresh from our store.
            Perfect for weddings, pooja, temples, and every special occasion.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/garlands">
              <Button size="lg" className="group shadow-[var(--shadow-glow-rose)] hover:shadow-[var(--shadow-glow-rose)]">
                Explore Garlands
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/garlands?tab=occasions">
              <Button size="lg" variant="outline">
                View Collections
              </Button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-500"
          >
            {[
              { icon: '✓', text: 'Always Fresh' },
              { icon: '✓', text: 'Handcrafted' },
              { icon: '✓', text: 'Online Pre-Order' },
              { icon: '✓', text: 'Secure Payment' },
            ].map((item) => (
              <span key={item.text} className="flex items-center gap-1.5">
                <span className="text-jade-600 font-bold">{item.icon}</span>
                {item.text}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 border-gray-300 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-gray-400 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURED GARLANDS ─────────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-3">
            ⭐ Featured
          </div>
          <h2 className="font-display text-4xl font-bold text-gray-900">Our Finest Garlands</h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">
            Handpicked bestsellers — each one crafted with the freshest blooms.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredGarlands.map((garland, i) => (
            <GarlandCard key={garland.id} garland={garland} index={i} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/garlands">
            <Button variant="outline" size="lg">
              View All Garlands <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── OCCASIONS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-jade-100 text-jade-700 text-xs font-semibold uppercase tracking-wider mb-3">
              🌿 Occasions
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900">What are you looking for?</h2>
            <p className="text-gray-500 mt-3">Find the perfect garland for every celebration</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {MOCK_OCCASIONS.map((occ, i) => (
              <motion.div
                key={occ.id}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={`/garlands?occasion=${occ.slug}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border-2 border-transparent hover:border-rose-200 hover:shadow-lg transition-all duration-300 text-center"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">
                    {occ.icon}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-rose-600 transition-colors">
                    {occ.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR ───────────────────────────────────────────────────── */}
      {popularGarlands.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold uppercase tracking-wider mb-3">
              🔥 Popular
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900">Customer Favourites</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularGarlands.map((garland, i) => (
              <GarlandCard key={garland.id} garland={garland} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
              Simple Process
            </div>
            <h2 className="font-display text-4xl font-bold">How Ordering Works</h2>
            <p className="text-gray-400 mt-3 max-w-md mx-auto">
              From browsing to pickup — it takes less than 5 minutes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="glass-dark rounded-2xl p-6 h-full flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{step.icon}</span>
                    <span className="text-xs font-bold text-rose-400 font-mono">STEP {step.step}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="w-5 h-5 text-rose-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual side */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-rose-100 to-jade-100 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="text-8xl mb-4">🌸</div>
                  <p className="font-display text-2xl font-bold text-gray-700">Since 1998</p>
                  <p className="text-gray-500 text-sm mt-1">Crafting with love</p>
                </div>
                {/* Founder Badge */}
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xs rounded-2xl px-4 py-2.5 shadow-md border border-rose-100 flex items-center gap-2.5">
                  <span className="text-xl">🌸</span>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Founder</p>
                    <p className="text-xs font-bold text-gray-900">Saravanan Mani</p>
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 bg-white rounded-2xl px-4 py-3 shadow-lg text-center">
                  <p className="font-bold text-2xl text-jade-600">100%</p>
                  <p className="text-xs text-gray-500">Fresh daily</p>
                </div>
              </div>
            </motion.div>

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-4">
                🌺 Our Story
              </div>
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-2">
                A Legacy of Fresh Flowers
              </h2>
              <p className="text-base font-semibold text-rose-600 mb-4">
                Handcrafted by <span className="text-gray-900 font-bold">Saravanan Mani</span>
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Founded and masterfully led by <strong>Saravanan Mani</strong>, Malligai Garlands is the trusted destination for authentic, handcrafted flower garlands at <strong>Gandhi Market, Trichy</strong>. Every garland is hand-tied with passion, using only the freshest blooms selected every morning from direct flower markets.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                From grand wedding celebrations and temple festivals to sacred home poojas, our pre-order platform ensures your garlands are tied fresh to perfection and ready on time for your store pickup at Gandhi Market.
              </p>

              {/* Direct Store Contact Box */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-rose-500 shrink-0 shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Store Pickup Location</span>
                    <span className="font-semibold text-gray-900">Gandhi Market, Trichy</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-jade-600 shrink-0 shadow-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Direct Call & WhatsApp</span>
                    <a href="tel:9344676293" className="font-bold text-gray-900 hover:text-rose-600 font-mono text-sm">
                      +91 93446 76293
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <CheckCircle2 className="w-5 h-5 text-jade-600" />, label: 'Fresh Daily' },
                  { icon: <Clock className="w-5 h-5 text-rose-500" />, label: 'On-time Ready' },
                  { icon: <MapPin className="w-5 h-5 text-blush-500" />, label: 'Easy Pickup' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-center">
                    {item.icon}
                    <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #be1139 0%, #f43f6e 50%, #fb7195 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 text-center py-16 px-8">
            <span className="text-5xl mb-4 block">🌸</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Order Your Garlands?
            </h2>
            <p className="text-rose-100 mb-8 text-lg">
              Browse our collection, pick your time, and we&apos;ll have them fresh and ready.
            </p>
            <Link href="/garlands">
              <button className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-600 font-bold rounded-xl text-lg hover:bg-rose-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0">
                <ShoppingBag className="w-5 h-5" />
                Order Now
              </button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
