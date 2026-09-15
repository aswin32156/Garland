'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'rose' | 'jade' | 'gold' | 'gray' | 'available' | 'unavailable';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  rose: 'bg-rose-100 text-rose-700 border border-rose-200',
  jade: 'bg-jade-100 text-jade-700 border border-jade-200',
  gold: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unavailable: 'bg-red-50 text-red-600 border border-red-200',
};

export function Badge({ variant = 'rose', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
