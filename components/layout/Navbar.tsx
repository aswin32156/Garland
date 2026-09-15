'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Bell, Menu, X, Flower2, LogOut, User, Shield, Store, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useNotificationStore } from '@/store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const unreadNotifs = useNotificationStore((s) => s.unreadCount());
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleLogout() {
    logout();
    setProfileOpen(false);
    router.push('/');
  }

  const navLinks = [
    { href: '/garlands', label: 'Garlands' },
    { href: '/garlands?tab=featured', label: 'Featured' },
    { href: '/garlands?tab=occasions', label: 'Occasions' },
    { href: '/#about', label: 'About' },
  ];

  const roleConfig = {
    ADMIN: { label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-700', dashLink: '/admin/dashboard' },
    OWNER: { label: 'Owner', icon: Store, color: 'bg-jade-100 text-jade-700', dashLink: '/owner/dashboard' },
    CUSTOMER: { label: 'Customer', icon: User, color: 'bg-rose-100 text-rose-700', dashLink: '/orders' },
  };

  const roleCfg = user ? roleConfig[user.role] : null;

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled || mobileOpen ? 'bg-white shadow-sm py-3' : 'bg-transparent py-4 sm:py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-gray-900 tracking-tight">
              Malligai <span className="text-rose-500">Garlands</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-rose-500 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-400 rounded-full transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist — customers only */}
            {(!user || user.role === 'CUSTOMER') && (
              <Link href="/wishlist" className="relative hidden sm:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-rose-50 transition-colors" aria-label="Wishlist">
                <Heart className="w-5 h-5 text-gray-600 hover:text-rose-500 transition-colors" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications — Shop Owner only (Not for Customer or Admin) */}
            {user && user.role === 'OWNER' && (
              <Link
                href="/notifications"
                className="relative hidden sm:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-rose-50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600 hover:text-rose-500 transition-colors" />
                {mounted && unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>
            )}

            {/* Cart — customers only */}
            {(!user || user.role === 'CUSTOMER') && (
              <Link href="/cart" className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-rose-50 transition-colors relative" aria-label="Cart">
                <ShoppingCart className="w-5 h-5 text-gray-600 hover:text-rose-500 transition-colors" />
                {mounted && cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-xs"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </Link>
            )}

            {/* Auth state */}
            {user ? (
              /* Logged-in user menu */
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-gray-800 leading-none">{user.full_name}</p>
                    {roleCfg && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleCfg.color}`}>
                        {roleCfg.label}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>

                      {roleCfg && (
                        <Link
                          href={roleCfg.dashLink}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <roleCfg.icon className="w-4 h-4" />
                          {user.role === 'ADMIN' ? 'Admin Dashboard' : user.role === 'OWNER' ? 'Owner Dashboard' : 'My Orders'}
                        </Link>
                      )}

                      {user.role === 'CUSTOMER' && (
                        <Link href="/wishlist" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 transition-colors">
                          <Heart className="w-4 h-4" /> Wishlist
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50 mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Not logged in */
              <Link
                href="/login"
                className="hidden md:inline-flex items-center px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-all shadow-sm hover:shadow-md ml-1"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "md:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                mobileOpen ? "bg-rose-100 text-rose-700" : "hover:bg-rose-50 text-gray-700"
              )}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white/98 backdrop-blur-xl border-t border-rose-100 shadow-2xl px-4 py-5 flex flex-col gap-3 mt-3"
            >
              {/* Navigation Links */}
              <div className="grid grid-cols-2 gap-2 pb-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-gray-800 hover:text-rose-600 hover:bg-rose-50/80 px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 border border-gray-100"
                  >
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* User Account / Role Section */}
              {user ? (
                <div className="flex flex-col gap-2.5 pt-3 border-t border-gray-100">
                  {/* User Profile Card */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold shadow-xs">
                        {user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{user.full_name}</p>
                        <p className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate max-w-[170px]">{user.email}</p>
                      </div>
                    </div>
                    {roleCfg && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 shadow-2xs ${roleCfg.color}`}>
                        {roleCfg.label}
                      </span>
                    )}
                  </div>

                  {/* Primary Role-Based Dashboard Button */}
                  {roleCfg && (
                    <Link
                      href={roleCfg.dashLink}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md hover:from-rose-600 hover:to-rose-700 transition-all font-semibold text-sm group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                          <roleCfg.icon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-medium text-rose-100 leading-none">
                            {user.role === 'ADMIN' ? 'Control Panel' : user.role === 'OWNER' ? 'Shop Management' : 'My Account'}
                          </p>
                          <p className="text-sm font-bold leading-tight mt-0.5">
                            {user.role === 'ADMIN'
                              ? 'Admin Dashboard'
                              : user.role === 'OWNER'
                              ? 'Owner Dashboard'
                              : 'My Orders & Pickups'}
                          </p>
                        </div>
                      </div>
                      <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  )}

                  {/* Additional Role Quick Links */}
                  <div className="grid grid-cols-2 gap-2">
                    {user.role === 'CUSTOMER' && (
                      <Link
                        href="/wishlist"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Wishlist ({wishlistCount})</span>
                      </Link>
                    )}

                    {user.role === 'OWNER' && (
                      <Link
                        href="/notifications"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Bell className="w-4 h-4 text-rose-500" />
                        <span>Alerts {unreadNotifs > 0 && `(${unreadNotifs})`}</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className={cn(
                        "flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer",
                        user.role === 'ADMIN' ? "col-span-2" : ""
                      )}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link
                    href="/login"
                    className="flex-1 text-center py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold shadow-sm hover:bg-rose-600 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center py-2.5 rounded-xl border-2 border-rose-500 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Backdrop overlay for mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Backdrop for desktop profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setProfileOpen(false)} />
      )}
    </>
  );
}
