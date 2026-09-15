'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flower2, Mail, Lock, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { findDemoUser } from '@/lib/demo-auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, pendingItem, redirectAfterAuth, setUser } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      // 1. Check demo credentials
      const demoUser = findDemoUser(email, password);

      if (demoUser) {
        setUser({
          id: demoUser.id,
          full_name: mode === 'REGISTER' && fullName ? fullName : demoUser.full_name,
          phone: mode === 'REGISTER' && phone ? phone : demoUser.phone,
          email: demoUser.email,
          role: demoUser.role,
          loyalty_points: 0,
          avatar_url: null,
          created_at: new Date().toISOString(),
        });

        toast.success(`Welcome back, ${demoUser.full_name}! 🌸`);

        // If there was a garland waiting to be added to cart, add it now!
        if (pendingItem) {
          addItem(pendingItem.garland, pendingItem.quantity);
          toast.success(`${pendingItem.garland.name} added to your cart! 🛒`);
        }

        closeAuthModal();

        // Handle routing based on role or redirect parameter
        if (demoUser.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (demoUser.role === 'OWNER') {
          router.push('/owner/dashboard');
        } else if (redirectAfterAuth) {
          router.push(redirectAfterAuth);
        }
        return;
      }

      // 2. Supabase auth fallback if configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('your-project')) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        let userRole: any = 'CUSTOMER';
        let resolvedName = fullName || 'Customer';
        let resolvedPhone = phone || '';

        if (mode === 'LOGIN') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            resolvedName = data.user.user_metadata?.full_name || 'Customer';
            resolvedPhone = data.user.user_metadata?.phone || '';

            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name, phone')
                .eq('id', data.user.id)
                .single();

              if (profile) {
                if (profile.role) userRole = profile.role;
                if (profile.full_name) resolvedName = profile.full_name;
                if (profile.phone) resolvedPhone = profile.phone;
              }
            } catch (e) {
              // ignore
            }

            const emailLower = (data.user.email || email).toLowerCase();
            if (emailLower.startsWith('admin') || emailLower.includes('admin@')) {
              userRole = 'ADMIN';
            } else if (emailLower.startsWith('owner') || emailLower.includes('owner@')) {
              userRole = 'OWNER';
            }

            setUser({
              id: data.user.id,
              full_name: resolvedName,
              phone: resolvedPhone,
              email: data.user.email || email,
              role: userRole,
              loyalty_points: 0,
              avatar_url: null,
              created_at: new Date().toISOString(),
            });
          }
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, phone },
            },
          });

          if (error) throw error;

          if (data.user) {
            setUser({
              id: data.user.id,
              full_name: fullName || 'Customer',
              phone: phone || '',
              email: data.user.email || email,
              role: 'CUSTOMER',
              loyalty_points: 0,
              avatar_url: null,
              created_at: new Date().toISOString(),
            });
          }
        }

        toast.success(`Signed in successfully! Welcome, ${resolvedName} 🌸`);

        if (pendingItem) {
          addItem(pendingItem.garland, pendingItem.quantity);
          toast.success(`${pendingItem.garland.name} added to your cart! 🛒`);
        }

        closeAuthModal();

        // Direct based on role
        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (userRole === 'OWNER') {
          router.push('/owner/dashboard');
        } else if (redirectAfterAuth) {
          router.push(redirectAfterAuth);
        }
        return;
      }

      toast.error('Invalid credentials. Please check your email and password.');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 text-white text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
            🌸
          </div>
          <h3 className="font-display text-2xl font-bold text-white">
            {mode === 'LOGIN' ? 'Sign In to Pre-Order' : 'Create Customer Account'}
          </h3>
          <p className="text-rose-100 text-xs mt-1 max-w-xs mx-auto">
            {pendingItem ? (
              <span>
                Please sign in to add <strong className="text-white underline">{pendingItem.garland.name}</strong> to your cart and proceed to checkout.
              </span>
            ) : (
              'Sign in to select fresh garlands and schedule your store pickup.'
            )}
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-white/20 p-1 rounded-xl mt-4 max-w-xs mx-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('LOGIN')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'LOGIN' ? 'bg-white text-rose-600 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('REGISTER')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mode === 'REGISTER' ? 'bg-white text-rose-600 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Priya Subramaniam"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-hidden"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-hidden"
              />
            </div>
          </div>

          <Button type="submit" size="lg" loading={loading} className="w-full py-3 mt-1">
            {mode === 'LOGIN' ? 'Sign In & Continue' : 'Create Account & Continue'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          <p className="text-[11px] text-gray-400 text-center">
            By continuing, you agree to our store pickup and pre-order guidelines.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
