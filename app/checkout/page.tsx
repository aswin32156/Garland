'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore, LocalOrder } from '@/store/orderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { formatPrice, formatDate, formatTimeSlot } from '@/lib/utils';
import { generateMockSlots } from '@/lib/mock-data';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { addDays, format } from 'date-fns';

const customerSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required'),
  email: z.string().email('Valid email required'),
});

type CustomerForm = z.infer<typeof customerSchema>;

const STEPS = [
  { id: 1, label: 'Customer Info', icon: User },
  { id: 2, label: 'Pickup Time', icon: Calendar },
  { id: 3, label: 'Payment', icon: CreditCard },
];

function getAvailableDates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i + 1);
    return format(d, 'yyyy-MM-dd');
  });
}

// Dynamically load Razorpay SDK script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { addOrder } = useOrderStore();
  const total = getTotal();

  const [step, setStep] = useState(1);
  const [customerData, setCustomerData] = useState<CustomerForm | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('08:00');
  const [customEndTime, setCustomEndTime] = useState('10:00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimulatedGateway, setShowSimulatedGateway] = useState(false);
  const [paymentPendingOrder, setPaymentPendingOrder] = useState<any>(null);

  const dates = getAvailableDates();
  const slots = selectedDate ? generateMockSlots(selectedDate) : [];
  const selectedSlot = isCustomTime
    ? {
        id: `custom-slot-${selectedDate}-${customStartTime}-${customEndTime}`,
        date: selectedDate,
        start_time: customStartTime,
        end_time: customEndTime,
        max_orders: 99999,
        booked_count: 0,
        is_available: true,
      }
    : slots.find((s) => s.id === selectedSlotId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    },
  });

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      if (user.full_name) setValue('full_name', user.full_name);
      if (user.phone) setValue('phone', user.phone);
      if (user.email) setValue('email', user.email);
    } else {
      useAuthStore.getState().openAuthModal(null, '/checkout');
    }
  }, [user, setValue]);

  if (!user) {
    return (
      <div
        className="min-h-screen pt-24 flex items-center justify-center px-4 text-center"
        style={{ background: 'linear-gradient(160deg, #fff1f5 0%, #fefdf8 60%, #f0fdf4 100%)' }}
      >
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-rose-100">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-3xl mx-auto mb-4">
            🌸
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Please Sign In to Proceed
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            You must be signed in to confirm your pickup slot and proceed with payment.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => useAuthStore.getState().openAuthModal(null, '/checkout')}
          >
            Sign In / Create Account
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4 text-center">
        <div>
          <span className="text-6xl block mb-4">🛒</span>
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h2>
          <Button onClick={() => router.push('/garlands')}>Browse Garlands</Button>
        </div>
      </div>
    );
  }

  function handleCustomerSubmit(data: CustomerForm) {
    setCustomerData(data);
    setStep(2);
  }

  function handlePickupNext() {
    if (!selectedDate) {
      toast.error('Please select a pickup date');
      return;
    }
    if (!isCustomTime && !selectedSlotId) {
      toast.error('Please select a pickup time interval or specify a custom time');
      return;
    }
    if (isCustomTime) {
      if (!customStartTime || !customEndTime) {
        toast.error('Please specify valid start and end times');
        return;
      }
      if (customStartTime < '08:00' || customEndTime > '20:00') {
        toast.error('Store pickup is available between 8:00 AM and 8:00 PM');
        return;
      }
      if (customStartTime >= customEndTime) {
        toast.error('End time must be later than start time');
        return;
      }
    }
    setStep(3);
  }

  // Finalize order record creation and navigation
  async function finalizeOrder(paymentId: string, orderId: string, paymentMethod: string = 'UPI') {
    if (!customerData || !selectedSlot) return;

    const orderNumber = `MG${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: LocalOrder = {
      id: `ord_${Date.now()}`,
      order_number: orderNumber,
      customer_id: user?.id || 'guest-user',
      customer_name: customerData.full_name,
      customer_phone: customerData.phone,
      customer_email: customerData.email,
      status: 'ACCEPTED',
      payment_status: 'PAID',
      subtotal: total,
      total: total,
      pickup_date: selectedDate,
      pickup_slot_id: selectedSlot.id,
      pickup_start_time: selectedSlot.start_time,
      pickup_end_time: selectedSlot.end_time,
      payment_id: paymentId,
      payment_order_id: orderId,
      payment_amount: total,
      payment_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: items.map((item, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        order_id: orderNumber,
        garland_id: item.garland.id,
        garland_name: item.garland.name,
        garland_image: item.garland.images?.[0] || null,
        quantity: item.quantity,
        unit_price: item.garland.price,
        subtotal: item.garland.price * item.quantity,
      })),
    };

    // 1. Instantly save to local store for UI responsiveness
    addOrder(newOrder);

    const itemsSummary = items.map((it) => `${it.garland.name} (×${it.quantity})`).join(', ');

    // Add real-time notification for owner & admin
    try {
      useNotificationStore.getState().addNotification({
        order_number: orderNumber,
        type: 'PAYMENT_SUCCESS',
        title: `Payment Received — ${formatPrice(total)}`,
        message: `${customerData.full_name} ordered: ${itemsSummary}`,
        customer_name: customerData.full_name,
        customer_phone: customerData.phone,
        amount: total,
        pickup_time: `${selectedSlot.start_time} - ${selectedSlot.end_time} (${selectedDate})`,
        payment_id: paymentId,
        payment_status: 'PAID',
        items_summary: itemsSummary,
      });
    } catch (notifErr) {
      console.warn('Could not add local notification:', notifErr);
    }

    // 2. Persist directly into Supabase database
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          customer_id: user?.id || null,
          customer_name: customerData.full_name,
          customer_phone: customerData.phone,
          customer_email: customerData.email,
          subtotal: total,
          total: total,
          pickup_date: selectedDate,
          pickup_start_time: selectedSlot.start_time,
          pickup_end_time: selectedSlot.end_time,
          payment_id: paymentId,
          payment_method: paymentMethod,
          items: items.map((item) => ({
            garland_id: item.garland.id,
            garland_name: item.garland.name,
            garland_image: item.garland.images?.[0] || null,
            quantity: item.quantity,
            unit_price: item.garland.price,
            subtotal: item.garland.price * item.quantity,
          })),
        }),
      });
    } catch (err) {
      console.error('Failed to sync order to Supabase:', err);
    }

    clearCart();
    toast.success(`Payment verified! Order #${orderNumber} placed. For any queries, contact: +91 93446 76293 🌸`, {
      duration: 6000,
    });
    router.push(`/orders/${orderNumber}`);
  }

  // Payment execution via Razorpay
  async function handleInitiatePayment() {
    if (!customerData || !selectedSlot) return;
    setIsProcessing(true);

    try {
      // 1. Create order on backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          receipt: `ord_${Date.now()}`,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate payment');
      }

      // Check if real Razorpay keys are configured
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && !orderData.isMock && (window as any).Razorpay) {
        // Real Razorpay modal
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Malligai Garlands',
          description: `Garland Pre-Order #${orderData.orderId}`,
          image: '/favicon.ico',
          order_id: orderData.orderId,
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast.error('Payment cancelled. Your order was not placed.');
            },
          },
          handler: async function (response: any) {
            // Verify payment
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              finalizeOrder(response.razorpay_payment_id, response.razorpay_order_id, 'RAZORPAY');
            } else {
              toast.error('Payment verification failed. Order was not placed.');
            }
          },
          prefill: {
            name: customerData.full_name,
            email: customerData.email,
            contact: customerData.phone,
          },
          theme: {
            color: '#f43f6e',
          },
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on('payment.failed', function (response: any) {
          setIsProcessing(false);
          toast.error(response?.error?.description || 'Payment was declined or failed. Your order was not placed.');
        });
        razorpayInstance.open();
        setIsProcessing(false);
      } else {
        // Interactive simulation mode (offline / demo fallback)
        setPaymentPendingOrder(orderData);
        setShowSimulatedGateway(true);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Payment initiation failed');
      setIsProcessing(false);
    }
  }

  // Simulate payment approval in test mode
  async function handleSimulateSuccess() {
    setIsProcessing(true);
    const mockPaymentId = `pay_rzp_mock_${Math.random().toString(36).substring(2, 10)}`;

    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isMock: true,
          razorpay_order_id: paymentPendingOrder?.orderId || `order_${Date.now()}`,
          razorpay_payment_id: mockPaymentId,
        }),
      });
      const verifyData = await verifyRes.json();

      setShowSimulatedGateway(false);
      if (verifyData.verified) {
        finalizeOrder(mockPaymentId, paymentPendingOrder?.orderId || `order_${Date.now()}`, 'RAZORPAY');
      } else {
        toast.error('Payment verification failed. Order not placed.');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      className="min-h-screen pt-24 pb-16"
      style={{ background: 'linear-gradient(160deg, #fff1f5 0%, #fefdf8 60%, #f0fdf4 100%)' }}
    >
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
          Garland Pre-Order Checkout
        </h1>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                  step === s.id
                    ? 'bg-rose-500 text-white shadow-md'
                    : step > s.id
                    ? 'bg-jade-100 text-jade-700'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* STEP 1 — Customer Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="bg-white rounded-3xl p-6 shadow-[var(--shadow-card)] border border-rose-50"
                >
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
                    📋 Step 1: Your Contact Info
                  </h2>
                  <p className="text-xs text-gray-500 mb-6">
                    Used for your pickup SMS/WhatsApp updates and order identification.
                  </p>

                  <form onSubmit={handleSubmit(handleCustomerSubmit)} className="flex flex-col gap-4">
                    <Input
                      label="Full Name"
                      placeholder="Priya Subramaniam"
                      error={errors.full_name?.message}
                      {...register('full_name')}
                    />
                    <Input
                      label="Mobile Number (for pickup SMS & call)"
                      type="tel"
                      placeholder="9876543210"
                      hint="10-digit Indian mobile number"
                      error={errors.phone?.message}
                      {...register('phone')}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@example.com"
                      hint="Receipt and digital pickup QR code sent here"
                      error={errors.email?.message}
                      {...register('email')}
                    />
                    <Button type="submit" size="lg" className="mt-2">
                      Continue to Pickup Slot <ChevronRight className="w-4 h-4" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2 — Pickup Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="bg-white rounded-3xl p-6 shadow-[var(--shadow-card)] border border-rose-50"
                >
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
                    📅 Step 2: Select Store Pickup Time
                  </h2>
                  <p className="text-xs text-gray-500 mb-5">
                    Garlands are freshly hand-tied on the morning of your chosen pickup date.
                  </p>

                  {/* Date selection */}
                  <p className="text-sm font-semibold text-gray-700 mb-3">Select Pickup Date</p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
                    {dates.map((date) => {
                      const d = new Date(date);
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlotId('');
                          }}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer',
                            selectedDate === date
                              ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-105'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'
                          )}
                        >
                          <span className="text-[10px] opacity-75">
                            {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                          </span>
                          <span className="text-base font-bold">{d.getDate()}</span>
                          <span className="text-[10px] opacity-75">
                            {d.toLocaleDateString('en-IN', { month: 'short' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Intervals */}
                  {selectedDate && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                        <p className="text-sm font-semibold text-gray-800">
                          Select Preferred Pickup Time Window ({formatDate(selectedDate)})
                        </p>
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Open 8:00 AM – 8:00 PM · Unlimited orders
                        </span>
                      </div>

                      {/* Standard Time Intervals Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                        {slots.map((slot) => {
                          const isSelected = !isCustomTime && selectedSlotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setIsCustomTime(false);
                                setSelectedSlotId(slot.id);
                              }}
                              className={cn(
                                'flex items-center justify-between p-3.5 rounded-xl border-2 text-sm font-medium transition-all text-left cursor-pointer',
                                isSelected
                                  ? 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-200'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300 hover:bg-rose-50/20'
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <Clock className={cn('w-4 h-4 shrink-0', isSelected ? 'text-white' : 'text-rose-500')} />
                                <span className="font-semibold">{formatTimeSlot(slot.start_time, slot.end_time)}</span>
                              </div>
                              {isSelected ? (
                                <span className="w-5 h-5 rounded-full bg-white text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                                  ✓
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-xs shrink-0 opacity-0 hover:opacity-100" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Time Range Picker */}
                      <div
                        className={cn(
                          'p-4 rounded-2xl border-2 transition-all mb-6 cursor-pointer',
                          isCustomTime
                            ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-200'
                            : 'bg-gradient-to-r from-amber-50/40 to-rose-50/30 border-dashed border-rose-200 hover:border-rose-300'
                        )}
                        onClick={() => {
                          if (!isCustomTime) {
                            setIsCustomTime(true);
                            setSelectedSlotId('');
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              name="timeRangeMode"
                              checked={isCustomTime}
                              onChange={() => {
                                setIsCustomTime(true);
                                setSelectedSlotId('');
                              }}
                              className="accent-rose-500 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" /> Custom Pickup Time Interval
                              </span>
                              <p className="text-xs text-gray-500">
                                Choose any exact start and end time between 8:00 AM and 8:00 PM
                              </p>
                            </div>
                          </label>
                          <span className="text-xs font-semibold text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-full">
                            8:00 AM – 8:00 PM
                          </span>
                        </div>

                        {isCustomTime && (
                          <div
                            className="mt-3 pt-3 border-t border-rose-100 flex flex-wrap items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex-1 min-w-[130px]">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Pickup From
                              </label>
                              <input
                                type="time"
                                min="08:00"
                                max="20:00"
                                value={customStartTime}
                                onChange={(e) => setCustomStartTime(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl bg-white text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400 border-gray-300"
                              />
                            </div>
                            <span className="text-gray-400 font-bold self-end pb-2">to</span>
                            <div className="flex-1 min-w-[130px]">
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Pickup Until
                              </label>
                              <input
                                type="time"
                                min="08:00"
                                max="20:00"
                                value={customEndTime}
                                onChange={(e) => setCustomEndTime(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl bg-white text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400 border-gray-300"
                              />
                            </div>
                            <div className="w-full text-xs text-rose-800 bg-white/80 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>
                                Active Interval: <strong>{formatTimeSlot(customStartTime, customEndTime)}</strong> on {formatDate(selectedDate)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button onClick={handlePickupNext} className="flex-1">
                      Proceed to Review & Pay <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — Summary & Razorpay Payment */}
              {step === 3 && customerData && selectedSlot && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="bg-white rounded-3xl p-6 shadow-[var(--shadow-card)] border border-rose-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-2xl font-bold text-gray-900">
                      💳 Review & Real-Time Payment
                    </h2>
                    <Badge variant="jade" className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Gateway
                    </Badge>
                  </div>

                  {/* Customer Preview */}
                  <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Contact Details
                      </p>
                      <button
                        onClick={() => setStep(1)}
                        className="text-xs text-rose-500 font-semibold hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="font-semibold text-gray-900">{customerData.full_name}</p>
                    <p className="text-sm text-gray-600">{customerData.phone} · {customerData.email}</p>
                  </div>

                  {/* Pickup Preview */}
                  <div className="p-4 rounded-2xl bg-jade-50 border border-jade-100 mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-bold text-jade-700 uppercase tracking-wide">
                        Store Pickup Time Window
                      </p>
                      <button
                        onClick={() => setStep(2)}
                        className="text-xs text-jade-700 font-semibold hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedDate)}
                    </p>
                    <p className="text-sm text-jade-800 font-medium">
                      {formatTimeSlot(selectedSlot.start_time, selectedSlot.end_time)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 Malligai Garlands, Gandhi Market, Trichy · 📞 +91 93446 76293
                    </p>
                  </div>

                  {/* Price breakdown */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 mb-6">
                    <div className="flex justify-between text-sm py-1 text-gray-600">
                      <span>Items Total ({items.length} garlands)</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 text-jade-700 font-medium">
                      <span>Store Pickup Preparation</span>
                      <span>FREE</span>
                    </div>
                    <div className="border-t border-rose-200 mt-2 pt-2 flex justify-between font-bold">
                      <span className="text-gray-900">Total Payable Now</span>
                      <span className="text-rose-600 font-display text-xl">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  {/* Unified Razorpay Gateway (UPI, GPay, PhonePe, Cards, NetBanking) */}
                  <div className="p-5 rounded-3xl bg-gradient-to-b from-rose-50/50 via-white to-emerald-50/30 border-2 border-rose-100 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                          🌸
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                            Razorpay Secure Checkout
                          </h3>
                          <p className="text-[11px] text-gray-500">
                            Instant real-time payment confirmation
                          </p>
                        </div>
                      </div>
                      <Badge variant="jade" className="flex items-center gap-1 text-[11px] py-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified Gateway
                      </Badge>
                    </div>

                    {/* Supported Payment Channels */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        All Payment Methods Accepted Inside:
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
                          <span className="text-base block mb-0.5">⚡</span>
                          <span className="text-xs font-bold text-emerald-800 block">UPI & Apps</span>
                          <span className="text-[10px] text-gray-500">GPay, PhonePe, Paytm</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-rose-200/80 shadow-2xs">
                          <span className="text-base block mb-0.5">💳</span>
                          <span className="text-xs font-bold text-rose-800 block">Cards</span>
                          <span className="text-[10px] text-gray-500">Visa, Master, RuPay</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-blue-200/80 shadow-2xs">
                          <span className="text-base block mb-0.5">🏦</span>
                          <span className="text-xs font-bold text-blue-800 block">Net Banking</span>
                          <span className="text-[10px] text-gray-500">All Indian Banks</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Pay Action */}
                    <Button
                      onClick={handleInitiatePayment}
                      loading={isProcessing}
                      className="w-full text-base py-4 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      size="lg"
                    >
                      <ShieldCheck className="w-5 h-5 mr-2" /> Pay {formatPrice(total)} via Razorpay (UPI / Cards / NetBanking)
                    </Button>

                    <p className="text-[11px] text-center text-gray-400 mt-2.5 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Zero unpaid orders: If you cancel or close, your order will not be charged or registered.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      <ChevronLeft className="w-4 h-4" /> Back to Pickup Slots
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-jade-600" /> 100% Secure Checkout
                    </span>
                    <span>•</span>
                    <span>Real-Time UPI & Razorpay</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart summary sidebar */}
          <div>
            <div className="bg-white rounded-3xl p-5 shadow-[var(--shadow-card)] sticky top-28 border border-gray-100">
              <h3 className="font-display text-lg font-bold text-gray-900 mb-4">
                Your Order Summary
              </h3>
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-lg shrink-0">
                      🌸
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {item.garland.name}
                      </p>
                      <p className="text-xs text-gray-500">× {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-800 shrink-0">
                      {formatPrice(item.garland.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold">
                <span className="text-gray-700">Total</span>
                <span className="text-rose-600 font-display text-lg">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Razorpay modal for test/demo environments */}
      <AnimatePresence>
        {showSimulatedGateway && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100"
            >
              {/* Gateway header */}
              <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-lg font-bold">
                    🌸
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Malligai Garlands</h3>
                    <p className="text-[11px] text-blue-200">Razorpay Secure Sandbox</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSimulatedGateway(false)}
                  className="text-gray-300 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Gateway body */}
              <div className="p-6">
                <div className="text-center pb-4 border-b border-gray-100 mb-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    Amount to Pay
                  </p>
                  <p className="font-display text-3xl font-bold text-gray-900 mt-1">
                    {formatPrice(total)}
                  </p>
                  <p className="text-xs text-jade-600 mt-1 font-medium flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Demo Payment Gateway Active
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-semibold text-gray-800">{customerData?.full_name}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <span className="text-gray-600">Mobile / UPI ID:</span>
                    <span className="font-semibold text-gray-800">{customerData?.phone}@okhdfcbank</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs">
                    <span className="text-rose-700">Order ID:</span>
                    <span className="font-mono font-bold text-rose-800">
                      {paymentPendingOrder?.orderId || 'order_demo_101'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Button
                    onClick={handleSimulateSuccess}
                    loading={isProcessing}
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Approve & Confirm Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSimulatedGateway(false);
                      toast.error('Payment cancelled by customer');
                    }}
                    className="w-full text-xs text-gray-500"
                  >
                    Cancel Transaction
                  </Button>
                </div>

                <p className="text-[11px] text-center text-gray-400 mt-4">
                  In production with live Razorpay keys in .env.local, this opens Razorpay's official UPI/Card modal automatically.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
