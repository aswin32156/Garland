import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import { AuthModal } from '@/components/ui/AuthModal';
import { CatalogInitializer } from '@/components/catalog/CatalogInitializer';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://malligaigarlands.vercel.app'),
  title: {
    default: 'Malligai Garlands — Fresh Garlands, Pre-Order Online',
    template: '%s | Malligai Garlands',
  },
  description:
    'Order fresh, handcrafted garlands online and pick them up from our store. Perfect for weddings, pooja, temples, birthdays, and festivals.',
  keywords: ['garland', 'flower garland', 'malligai', 'wedding garland', 'pooja garland', 'jasmine garland', 'fresh flowers'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Malligai Garlands — Fresh Garlands, Pre-Order Online',
    description: 'Handcrafted fresh garlands for every occasion. Pre-order online, pick up from store.',
    type: 'website',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'Malligai Garlands' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <CatalogInitializer />
        <Navbar />
        <AuthModal />
        <main className="overflow-x-hidden w-full">{children}</main>
        <Footer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
