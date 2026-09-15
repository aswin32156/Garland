import Link from 'next/link';
import { Flower2, Phone, Mail, MapPin, User } from 'lucide-react';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

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
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Handcrafted with love. Fresh garlands for every occasion — pre-order online and pick up fresh from our store.
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-colors">
                <InstagramIcon />
              </a>
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-colors">
                <FacebookIcon />
              </a>
            </div>
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

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Visit Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-rose-300 font-semibold">
                <User className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Saravanan Mani</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                Gandhi Market, Trichy, Tamil Nadu 620008
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                +91 93446 76293
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                hello@malligaigarlands.in
              </li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
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
