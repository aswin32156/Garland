'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { findDemoUser } from '@/lib/demo-auth';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(4, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || null;
  const [showPassword, setShowPassword] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const pendingItem = useAuthStore((s) => s.pendingItem);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const addItem = useCartStore((s) => s.addItem);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    // 1. Check demo credentials first (handles admin, owner, and flexible customer accounts)
    const demoUser = findDemoUser(data.email, data.password);
    if (demoUser) {
      setUser({
        id: demoUser.id,
        full_name: demoUser.full_name,
        phone: demoUser.phone,
        email: demoUser.email,
        role: demoUser.role,
        loyalty_points: 0,
        avatar_url: null,
        created_at: new Date().toISOString(),
      });

      toast.success(`Welcome, ${demoUser.full_name}! 🌸`);

      // If there was a pending garland awaiting user login, add to cart!
      if (pendingItem) {
        addItem(pendingItem.garland, pendingItem.quantity);
        toast.success(`${pendingItem.garland.name} added to your cart! 🛒`);
        closeAuthModal();
      }

      // Route based on role
      if (demoUser.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (demoUser.role === 'OWNER') {
        router.push('/owner/dashboard');
      } else {
        router.push(redirectTo || '/');
      }
      return;
    }

    // 2. Fall back to Supabase auth (when configured)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      toast.error('Invalid email or password. Please check your credentials.');
      return;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: authResult, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (authResult.user) {
        let userRole: any = authResult.user.user_metadata?.role || 'CUSTOMER';
        let fullName = authResult.user.user_metadata?.full_name || 'Valued User';
        let phone = authResult.user.user_metadata?.phone || '';

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, phone')
            .eq('id', authResult.user.id)
            .single();

          if (profile) {
            if (profile.role) userRole = profile.role;
            if (profile.full_name) fullName = profile.full_name;
            if (profile.phone) phone = profile.phone;
          }
        } catch (e) {
          // fallback
        }

        const emailLower = (authResult.user.email || data.email).toLowerCase();
        if (emailLower.startsWith('admin') || emailLower.includes('admin@')) {
          userRole = 'ADMIN';
        } else if (emailLower.startsWith('owner') || emailLower.includes('owner@')) {
          userRole = 'OWNER';
        }

        setUser({
          id: authResult.user.id,
          full_name: fullName,
          phone: phone,
          email: authResult.user.email || data.email,
          role: userRole,
          loyalty_points: 0,
          avatar_url: null,
          created_at: new Date().toISOString(),
        });

        toast.success(`Welcome back, ${fullName}! 🌸`);

        if (pendingItem) {
          addItem(pendingItem.garland, pendingItem.quantity);
          toast.success(`${pendingItem.garland.name} added to your cart! 🛒`);
          closeAuthModal();
        }

        // Direct to dashboard based on role
        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (userRole === 'OWNER') {
          router.push('/owner/dashboard');
        } else {
          router.push(redirectTo || '/');
        }
        router.refresh();
      }
    } catch {
      toast.error('Login failed. Please try again.');
    }
  }

  return (
    <div
      className="min-h-screen pt-20 flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #fff1f5 0%, #fefdf8 50%, #f0fdf4 100%)' }}
    >
      {/* Decorative floating petals */}
      <div className="absolute top-20 left-10 text-4xl opacity-20 animate-float-petal" style={{ animationDuration: '8s' }}>🌸</div>
      <div className="absolute bottom-20 right-10 text-4xl opacity-20 animate-float-petal" style={{ animationDuration: '10s', animationDelay: '2s' }}>🌺</div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-rose-50 p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <BrandLogo size={64} className="mx-auto mb-4 hover:scale-105 transition-transform" />
            <h1 className="font-display text-3xl font-bold text-gray-900">Sign In</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Sign in to manage your garland pre-orders and pickup times
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-rose-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-xs text-rose-500 font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2 py-3">
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">New to Malligai Garlands?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              href={`/register${redirectTo ? `?redirectTo=${redirectTo}` : ''}`}
              className="text-rose-600 font-bold hover:underline"
            >
              Create one now
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 text-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
