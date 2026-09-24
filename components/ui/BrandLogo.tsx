import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export function BrandLogo({ size = 36, className, withGlow = true }: BrandLogoProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full select-none transition-transform duration-300',
        withGlow && 'drop-shadow-[0_2px_8px_rgba(225,29,72,0.25)]',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Malligai Garlands Logo"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain rounded-full"
        priority
      />
    </div>
  );
}
