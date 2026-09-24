'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterForm) {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      // Local demo registration
      const newCustomer = {
        id: `cust_${Math.random().toString(36).substring(2, 9)}`,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        role: 'CUSTOMER' as const,
        loyalty_points: 0,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      const { useAuthStore } = await import('@/store/authStore');
      const { useCartStore } = await import('@/store/cartStore');
      const { setUser, pendingItem, closeAuthModal } = useAuthStore.getState();

      setUser(newCustomer);

      if (pendingItem) {
        useCartStore.getState().addItem(pendingItem.garland, pendingItem.quantity);
        toast.success(`${pendingItem.garland.name} added to cart! 🛒`);
        closeAuthModal();
      }

      toast.success('Account created! Welcome to Malligai Garlands 🌸');
      router.push(redirectTo);
      return;
    }

    const supabase = createClient();

    // Sign up
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone: data.phone,
        },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      return;
    }

    // Insert profile
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        role: 'CUSTOMER',
        loyalty_points: 0,
      });

      const { useAuthStore } = await import('@/store/authStore');
      const { useCartStore } = await import('@/store/cartStore');
      const { setUser, pendingItem, closeAuthModal } = useAuthStore.getState();

      setUser({
        id: authData.user.id,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        role: 'CUSTOMER',
        loyalty_points: 0,
        avatar_url: null,
        created_at: new Date().toISOString(),
      });

      if (pendingItem) {
        useCartStore.getState().addItem(pendingItem.garland, pendingItem.quantity);
        toast.success(`${pendingItem.garland.name} added to cart! 🛒`);
        closeAuthModal();
      }
    }

    toast.success('Account created! Welcome to Malligai Garlands 🌸');
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div
      className="min-h-screen pt-20 flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #fff1f5 0%, #fefdf8 50%, #f0fdf4 100%)' }}
    >
      <div className="absolute top-20 right-10 text-4xl opacity-20 animate-float-petal" style={{ animationDuration: '9s' }}>🌼</div>
      <div className="absolute bottom-20 left-10 text-4xl opacity-20 animate-float-petal" style={{ animationDuration: '7s', animationDelay: '3s' }}>🌹</div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <BrandLogo size={64} className="mx-auto mb-4 hover:scale-105 transition-transform" />
            <h1 className="font-display text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 mt-1 text-sm">Join Malligai Garlands today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="Priya Subramaniam"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="9876543210"
              leftIcon={<Phone className="w-4 h-4" />}
              hint="Required — the shop will contact you on this number"
              error={errors.phone?.message}
              {...register('phone')}
            />

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
              placeholder="Min. 8 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              Create Account 🌸
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href={`/login${redirectTo !== '/' ? `?redirectTo=${redirectTo}` : ''}`} className="text-rose-500 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 text-center">Loading...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
