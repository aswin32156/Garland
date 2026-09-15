'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Clock,
  Package,
  ShoppingBag,
  ArrowLeft,
  Check,
  Trash2,
  ChevronRight,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { useNotificationStore, DashboardNotification } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const validOrderNotifs = notifications.filter(
    (n) =>
      (n.type === 'NEW_ORDER' || n.type === 'PAYMENT_SUCCESS') &&
      !['MG1025', 'MG1026', 'MG1027', 'MG1028'].includes(n.order_number) &&
      !['notif-1', 'notif-2', 'notif-3', 'notif-4'].includes(n.id)
  );

  const filteredNotifs = filter === 'ALL'
    ? validOrderNotifs
    : validOrderNotifs.filter((n) => !n.is_read);

  const unreadCount = validOrderNotifs.filter((n) => !n.is_read).length;

  function getIcon(type: DashboardNotification['type']) {
    if (type === 'PAYMENT_SUCCESS') {
      return <CreditCard className="w-5 h-5 text-emerald-600" />;
    }
    return <ShoppingBag className="w-5 h-5 text-rose-600" />;
  }

  function getBadgeColor(type: DashboardNotification['type']) {
    if (type === 'PAYMENT_SUCCESS') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  if (!user || user.role !== 'OWNER') {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-16 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-3xl mx-auto mb-4">
            🌸
          </div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
            Store Notifications
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Live customer purchase alerts and order notifications are exclusively active on the Shop Owner Dashboard.
          </p>
          <Link href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/orders'}>
            <Button className="w-full">
              {user?.role === 'ADMIN' ? 'Back to Admin Dashboard' : 'View My Orders'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={user?.role === 'OWNER' ? '/owner/dashboard' : user?.role === 'ADMIN' ? '/admin/dashboard' : '/garlands'}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {user?.role === 'OWNER' ? 'Back to Owner Dashboard' : user?.role === 'ADMIN' ? 'Back to Admin Dashboard' : 'Back to Store'}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                    Notifications
                  </h1>
                  <p className="text-sm text-gray-500">
                    {unreadCount > 0
                      ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                      : 'You are all caught up!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all as read
                </Button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-3 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-200'
            }`}
          >
            All ({validOrderNotifs.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'UNREAD'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3 text-2xl">
                🌸
              </div>
              <p className="font-semibold text-gray-800 mb-1">No order notifications</p>
              <p className="text-sm text-gray-400">
                {filter === 'UNREAD' ? 'No unread order notifications found.' : 'You will receive real-time notifications here as soon as a customer places an order.'}
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-sm ${
                  notif.is_read
                    ? 'border-gray-100 bg-white/70 opacity-90'
                    : 'border-rose-200 bg-rose-50/20 shadow-rose-100/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-xs">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getBadgeColor(notif.type)}`}>
                          #{notif.order_number}
                        </span>
                        <h2 className="font-semibold text-gray-900 text-sm">{notif.title}</h2>
                      </div>
                      <span className="text-xs text-gray-400">{notif.time}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs flex-wrap">
                      <div className="flex items-center gap-4 text-gray-500">
                        {notif.customer_name && (
                          <span>Customer: <strong className="text-gray-700">{notif.customer_name}</strong></span>
                        )}
                        {notif.amount && (
                          <span>Total: <strong className="text-gray-700">{formatPrice(notif.amount)}</strong></span>
                        )}
                        {notif.pickup_time && (
                          <span>Slot: <strong className="text-gray-700">{notif.pickup_time}</strong></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!notif.is_read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50"
                          >
                            Mark read
                          </button>
                        )}
                        <Link
                          href={user?.role === 'OWNER' ? `/owner/dashboard` : `/orders/${notif.order_number}`}
                          className="inline-flex items-center gap-1 font-semibold text-xs text-jade-700 hover:underline px-2 py-1"
                        >
                          View Order <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
