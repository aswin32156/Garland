'use client';

import Link from 'next/link';
import { Package, Clock, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { formatPrice, formatDate, formatTimeSlot } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useOrderStore } from '@/store/orderStore';
import { OrderStatus } from '@/types';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: 'rose' | 'jade' | 'gold' | 'gray' | 'available' | 'unavailable'; icon: React.ElementType }
> = {
  NEW: { label: '🆕 New', variant: 'rose', icon: Package },
  ACCEPTED: { label: '✓ Accepted', variant: 'gold', icon: CheckCircle2 },
  PREPARING: { label: '🌸 Preparing', variant: 'gold', icon: Clock },
  READY_FOR_PICKUP: { label: '📦 Ready for Pickup!', variant: 'jade', icon: Package },
  COLLECTED: { label: '✅ Collected', variant: 'available', icon: CheckCircle2 },
  COMPLETED: { label: '✅ Completed', variant: 'available', icon: CheckCircle2 },
  CANCELLED: { label: '❌ Cancelled', variant: 'unavailable', icon: XCircle },
};

export default function OrdersPage() {
  const { orders } = useOrderStore();

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'linear-gradient(180deg, #fff7f9 0%, #fcfbf9 100%)' }}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              📦 My Pre-Orders
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track flower garland preparation and store pickup details
            </p>
          </div>
          <Link
            href="/garlands"
            className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-colors"
          >
            + Order More
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <Package className="w-16 h-16 text-rose-200 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">No orders placed yet</h2>
            <p className="text-gray-500 mb-6">Choose fresh handmade garlands for weddings, poojas, or functions!</p>
            <Link
              href="/garlands"
              className="inline-block px-6 py-3 rounded-full bg-rose-500 text-white font-semibold shadow-md hover:bg-rose-600 transition-colors"
            >
              Browse Garlands
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.order_number}`}
                  className="bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] border border-rose-50 hover:shadow-lg hover:border-rose-200 transition-all group block"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-bold text-gray-900 font-mono text-base">
                          #{order.order_number}
                        </span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        {order.payment_status === 'PAID' && (
                          <Badge variant="available">💳 Paid</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2.5">
                        Placed on {formatDate(order.created_at)}
                      </p>
                      <div className="flex flex-col gap-1">
                        {(order.items || []).map((item) => (
                          <p key={item.id} className="text-xs text-gray-700 font-medium">
                            🌸 {item.garland_name} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-rose-600 font-display text-lg">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1 justify-end font-medium">
                        <Clock className="w-3.5 h-3.5 text-jade-600" />
                        {formatTimeSlot(order.pickup_start_time, order.pickup_end_time)}
                      </p>
                      <p className="text-xs text-jade-700 font-semibold mt-0.5">
                        {formatDate(order.pickup_date)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-rose-500 transition-colors shrink-0 mt-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
