import Link from 'next/link';
import { Flower2, Phone, Mail, MapPin, User } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Malligai <span className="text-rose-400">Garlands</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Handcrafted with love. Fresh garlands for every occasion — pre-order online and pick up fresh from our store.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/garlands', label: 'All Garlands' },
                { href: '/garlands?featured=true', label: 'Featured' },
                { href: '/garlands?tab=occasions', label: 'By Occasion' },
                { href: '/#how-it-works', label: 'How It Works' },
                { href: '/#about', label: 'About Us' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Occasions */}
          <div>
            <h4 className="text-white font-semibold mb-4">Occasions</h4>
            <ul className="space-y-2.5">
              {['Wedding', 'Pooja', 'Temple', 'Birthday', 'Festival', 'Function'].map((occ) => (
                <li key={occ}>
                  <Link href={`/garlands?occasion=${occ.toLowerCase()}`} className="text-sm text-gray-400 hover:text-rose-400 transition-colors">
                    {occ}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Visit Us */}
          <div>
            <h4 className="text-white font-semibold mb-4">Visit Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-rose-300 font-semibold">
                <User className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Saravanan Mani</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <a
                  href="https://maps.google.com/?q=Gandhi+Market+Trichy"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-rose-300 transition-colors"
                  title="View on Google Maps"
                >
                  Gandhi Market, Trichy, Tamil Nadu 620008
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                <a
                  href="tel:+919344676293"
                  className="text-gray-300 hover:text-rose-400 transition-colors font-medium hover:underline flex items-center gap-1.5"
                  title="Call +91 93446 76293"
                >
                  +91 93446 76293
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold uppercase">Call</span>
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                <a href="mailto:hello@malligaigarlands.in" className="hover:text-rose-300 transition-colors">
                  hello@malligaigarlands.in
                </a>
              </li>
            </ul>

            <a
              href="tel:+919344676293"
              className="mt-4 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm w-full"
            >
              <Phone className="w-3.5 h-3.5" /> Call Store: +91 93446 76293
            </a>

            <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400 font-medium">Store Hours</p>
              <p className="text-xs text-gray-300 mt-1">Mon – Sat: 8 AM – 8 PM</p>
              <p className="text-xs text-gray-300">Sunday: 8 AM – 8 PM</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2026 Malligai Garlands. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
