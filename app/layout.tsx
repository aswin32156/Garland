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
  title: {
    default: 'Malligai Garlands — Fresh Garlands, Pre-Order Online',
    template: '%s | Malligai Garlands',
  },
  description:
    'Order fresh, handcrafted garlands online and pick them up from our store. Perfect for weddings, pooja, temples, birthdays, and festivals.',
  keywords: ['garland', 'flower garland', 'malligai', 'wedding garland', 'pooja garland', 'jasmine garland', 'fresh flowers'],
  openGraph: {
    title: 'Malligai Garlands — Fresh Garlands, Pre-Order Online',
    description: 'Handcrafted fresh garlands for every occasion. Pre-order online, pick up from store.',
    type: 'website',
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
