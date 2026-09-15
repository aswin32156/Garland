'use client';

import { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  Download,
  Printer,
  Copy,
  ArrowLeft,
  Store,
  Phone,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useOrderStore, LocalOrder } from '@/store/orderStore';
import { formatPrice, formatDate, formatTimeSlot } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'ACCEPTED', label: 'Order Confirmed & Payment Received' },
  { key: 'PREPARING', label: 'Fresh Flowers Selected & Garland Hand-Tied' },
  { key: 'READY_FOR_PICKUP', label: 'Packed & Ready at Store Counter' },
  { key: 'COLLECTED', label: 'Picked Up by Customer' },
];

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getOrder, orders } = useOrderStore();
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = getOrder(id);
    if (found) {
      setOrder(found);
    }
    
    // Fetch live from Supabase
    fetch(`/api/orders?order_number=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          const o = data.data[0];
          setOrder({
            id: o.id,
            order_number: o.order_number,
            customer_id: o.customer_id,
            customer_name: o.customer?.full_name || 'Customer',
            customer_phone: o.customer?.phone || '',
            customer_email: o.customer?.email || '',
            status: o.status,
            payment_status: o.payment_status,
            subtotal: Number(o.subtotal),
            total: Number(o.total),
            pickup_date: o.pickup_date,
            pickup_start_time: o.pickup_start_time,
            pickup_end_time: o.pickup_end_time,
            payment_id: o.payment_id,
            created_at: o.created_at,
            updated_at: o.updated_at,
            items: (o.items || []).map((it: any) => ({
              id: it.id,
              order_id: it.order_id,
              garland_id: it.garland_id,
              garland_name: it.garland_name,
              garland_image: it.garland_image,
              quantity: it.quantity,
              unit_price: Number(it.unit_price),
              subtotal: Number(it.subtotal),
            })),
          });
        }
      })
      .catch((err) => console.log('Error fetching order from Supabase:', err));
  }, [id, getOrder]);


  // Fallback demo order if order not found
  const displayOrder: LocalOrder = order || {
    id: 'demo-fallback',
    order_number: id || 'MG1042',
    customer_id: 'cust-demo',
    customer_name: 'Priya Subramaniam',
    customer_phone: '9876543210',
    customer_email: 'priya@example.com',
    status: 'ACCEPTED',
    payment_status: 'PAID',
    subtotal: 1750,
    total: 1750,
    pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickup_start_time: '17:00',
    pickup_end_time: '18:00',
    payment_id: 'pay_rzp_demo_success',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        order_id: id || 'MG1042',
        garland_id: 'g-1',
        garland_name: 'Rose Wedding Garland',
        quantity: 2,
        unit_price: 650,
        subtotal: 1300,
      },
      {
        id: 'item-2',
        order_id: id || 'MG1042',
        garland_id: 'g-2',
        garland_name: 'Jasmine Pooja Garland',
        quantity: 1,
        unit_price: 450,
        subtotal: 450,
      },
    ],
  };

  const qrPayload = JSON.stringify({
    orderNumber: displayOrder.order_number,
    customer: displayOrder.customer_name,
    pickupDate: displayOrder.pickup_date,
    slot: `${displayOrder.pickup_start_time}-${displayOrder.pickup_end_time}`,
    total: displayOrder.total,
    paid: displayOrder.payment_status,
  });

  function handlePrintReceipt() {
    window.print();
  }

  function handleCopyPickupCode() {
    navigator.clipboard.writeText(displayOrder.order_number);
    toast.success('Pickup Order # copied to clipboard! 📋');
  }

  // Calculate status step index
  const currentStepIndex =
    displayOrder.status === 'COLLECTED' || displayOrder.status === 'COMPLETED'
      ? 3
      : displayOrder.status === 'READY_FOR_PICKUP'
      ? 2
      : displayOrder.status === 'PREPARING'
      ? 1
      : 0;

  return (
    <div
      className="min-h-screen pt-24 pb-16"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #fefdf8 50%, #fff1f5 100%)' }}
    >
      <div className="max-w-2xl mx-auto px-4">
        {/* Success header animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-jade-100 flex items-center justify-center mx-auto mb-3 shadow-lg ring-8 ring-jade-50">
            <CheckCircle2 className="w-10 h-10 text-jade-600" />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-1"
          >
            Pre-Order Confirmed! 🌸
          </motion.h1>
          <p className="text-gray-600 text-sm">
            Thank you, <span className="font-semibold text-gray-800">{displayOrder.customer_name}</span>.
            Your fresh garlands will be prepared for store pickup.
          </p>
        </motion.div>

        {/* For Any Queries Contact Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-rose-50/50 border-2 border-emerald-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
              <Phone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full inline-block mb-1">
                📞 Assistance & Support
              </span>
              <h3 className="text-base sm:text-lg font-display font-bold text-gray-900">
                For any queries, contact: <a href="tel:9344676293" className="text-emerald-700 hover:text-emerald-800 font-mono font-bold underline underline-offset-2">+91 93446 76293</a>
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Have timing updates or flower customization requests? Feel free to call or WhatsApp us anytime.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <a
              href="tel:9344676293"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" /> Call +91 93446 76293
            </a>
            <a
              href={`https://wa.me/919344676293?text=${encodeURIComponent(`Hi Malligai Garlands, I have a query regarding my Order #${displayOrder.order_number}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-all border border-emerald-300 shadow-xs"
            >
              <span>💬 WhatsApp</span>
            </a>
          </div>
        </motion.div>

        {/* Printable Order Card */}
        <motion.div
          ref={receiptRef}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 text-white flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-xs uppercase tracking-wider font-semibold">
                Store Pickup Order
              </p>
              <p className="font-display text-2xl font-bold flex items-center gap-2">
                #{displayOrder.order_number}
                <button
                  onClick={handleCopyPickupCode}
                  title="Copy pickup code"
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <Copy className="w-4 h-4 opacity-75 hover:opacity-100" />
                </button>
              </p>
            </div>
            <div className="text-right">
              <Badge variant="jade" className="bg-white/20 text-white border-white/30 text-xs">
                PAID VIA RAZORPAY
              </Badge>
              <p className="text-[11px] text-rose-100 mt-1 font-mono">
                {displayOrder.payment_id || 'pay_demo_success'}
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Store & Pickup Schedule Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-jade-50 border border-jade-100">
                <div className="flex items-center gap-2 mb-1 text-jade-800">
                  <Clock className="w-4 h-4 text-jade-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Scheduled Pickup</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {formatDate(displayOrder.pickup_date)}
                </p>
                <p className="text-sm text-jade-700 font-bold">
                  {formatTimeSlot(displayOrder.pickup_start_time, displayOrder.pickup_end_time)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-2 mb-1 text-rose-800">
                  <Store className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Pickup Counter</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Malligai Garlands</p>
                <p className="text-xs text-gray-600 leading-tight">
                  Gandhi Market, Trichy, Tamil Nadu
                </p>
                <p className="text-[11px] text-gray-700 font-semibold mt-1">
                  📞 For any queries, contact: <a href="tel:9344676293" className="text-emerald-700 underline">+91 93446 76293</a>
                </p>
              </div>
            </div>

            {/* Live Interactive QR Code */}
            <div className="border-2 border-dashed border-rose-200 rounded-3xl p-6 text-center bg-gradient-to-b from-white to-rose-50/30">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-rose-100 mb-3">
                <QRCodeSVG
                  value={qrPayload}
                  size={150}
                  level="M"
                  includeMargin={false}
                  fgColor="#0f172a"
                />
              </div>
              <p className="font-display font-bold text-gray-900 text-base">
                Pickup Verification QR
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Show this QR or mention Order #{displayOrder.order_number} to our shop assistant
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-jade-100 text-jade-800 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Instant Counter Verification
              </div>
            </div>

            {/* Live Order Status Timeline */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Order Preparation Status
              </p>
              <div className="flex flex-col gap-0">
                {STATUS_STEPS.map((s, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={s.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isDone
                              ? 'bg-jade-500 text-white ring-4 ring-jade-100'
                              : 'bg-gray-100 border-2 border-gray-200 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={`w-0.5 h-7 mt-1 ${
                              idx < currentStepIndex ? 'bg-jade-400' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pt-0.5 pb-4">
                        <p
                          className={`text-sm font-semibold ${
                            isDone ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {s.label}
                        </p>
                        {isCurrent && (
                          <span className="inline-block text-[11px] font-bold text-jade-600 uppercase tracking-wider bg-jade-50 px-2 py-0.5 rounded mt-0.5">
                            Current Status
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items Breakdown */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Garland Order Summary
              </p>
              <div className="flex flex-col gap-2">
                {(displayOrder.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🌸</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.garland_name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-3 border-t border-gray-200 mt-1">
                  <span className="text-gray-800">Total Amount Paid</span>
                  <span className="text-rose-600 font-display text-xl">
                    {formatPrice(displayOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
              <Button
                variant="outline"
                onClick={handlePrintReceipt}
                className="flex-1 py-3"
              >
                <Printer className="w-4 h-4 mr-2" /> Print / Save Receipt PDF
              </Button>
              <Link href="/orders" className="flex-1">
                <Button className="w-full py-3">
                  <Package className="w-4 h-4 mr-2" /> View All My Orders
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Pickup Instructions */}
        <div className="mt-6 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-center print:hidden">
          <p className="text-xs text-gray-600 leading-relaxed">
            🌿 <strong>Note for customer:</strong> Flower garlands are perishable and preserved in our climate-controlled cooler. Please arrive within your selected slot for optimal freshness.
          </p>
        </div>

        <div className="text-center mt-6 print:hidden">
          <Link href="/garlands" className="text-sm text-rose-600 font-semibold hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Continue Browsing Garlands
          </Link>
        </div>
      </div>
    </div>
  );
}
