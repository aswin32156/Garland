'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Phone,
  Mail,
  Calendar,
  Search,
  ChevronRight,
  Bell,
  X,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
  CreditCard,
  RefreshCw,
  MessageCircle,
  ZoomIn,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { formatPrice, formatDate, formatTimeSlot } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useOrderStore } from '@/store/orderStore';
import { useNotificationStore, DashboardNotification } from '@/store/notificationStore';

// Web Audio API notification chime generator
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio context may be blocked before user interaction
  }
}

function getGarlandImage(name?: string, existingImg?: string) {
  if (existingImg && existingImg.trim() !== '') return existingImg;
  if (!name) return '/images/garland-rose.jpg';
  const lower = name.toLowerCase();
  if (lower.includes('rose') || lower.includes('wedding')) return '/images/garland-rose.jpg';
  if (lower.includes('jasmine') || lower.includes('pooja') || lower.includes('malli')) return '/images/garland-jasmine.jpg';
  if (lower.includes('marigold') || lower.includes('temple') || lower.includes('samandhi')) return '/images/garland-marigold.jpg';
  if (lower.includes('mixed') || lower.includes('daily')) return '/images/garland-mixed.jpg';
  return '/images/garland-rose.jpg';
}

// ── Demo order item type ────────────────────────────────────────────────────────
interface DemoOrderItem {
  id?: string;
  garland_name: string;
  garland_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customization_notes?: string;
}

// ── Demo order type ──────────────────────────────────────────────────────────
interface DemoOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer: {
    full_name: string;
    phone: string;
    email?: string;
  };
  items: DemoOrderItem[];
  total: number;
  pickup_date: string;
  pickup_start_time: string;
  pickup_end_time: string;
  payment_status: string;
  payment_id?: string;
  payment_method?: string;
  notes?: string | null;
  created_at: string;
}

// ── Mock orders for demo ─────────────────────────────────────────────────────
const DEMO_ORDERS: DemoOrder[] = [
  {
    id: '1',
    order_number: 'MG1025',
    status: 'ACCEPTED' as const,
    customer: { full_name: 'Priya Subramaniam', phone: '9876543210', email: 'priya.s@gmail.com' },
    items: [
      {
        garland_name: 'Rose Wedding Garland',
        garland_image: '/images/garland-rose.jpg',
        quantity: 2,
        unit_price: 650,
        subtotal: 1300,
        customization_notes: 'Extra red ribbon border',
      },
      {
        garland_name: 'Jasmine Pooja Garland',
        garland_image: '/images/garland-jasmine.jpg',
        quantity: 1,
        unit_price: 450,
        subtotal: 450,
      },
    ],
    total: 1750,
    pickup_date: '2026-09-15',
    pickup_start_time: '17:00',
    pickup_end_time: '18:00',
    payment_status: 'PAID',
    payment_id: 'pay_rzp_live_98124',
    payment_method: 'UPI / Google Pay',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    order_number: 'MG1026',
    status: 'PREPARING' as const,
    customer: { full_name: 'Rajesh Kumar', phone: '9988776655', email: 'rajesh.k@outlook.com' },
    items: [
      {
        garland_name: 'Grand Wedding Garland',
        garland_image: '/images/garland-rose.jpg',
        quantity: 1,
        unit_price: 1200,
        subtotal: 1200,
        customization_notes: 'Double knot garland with cardamom accents',
      },
    ],
    total: 1200,
    pickup_date: '2026-09-15',
    pickup_start_time: '11:00',
    pickup_end_time: '12:00',
    payment_status: 'PAID',
    payment_id: 'pay_rzp_live_98155',
    payment_method: 'Razorpay UPI (PhonePe)',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    order_number: 'MG1027',
    status: 'NEW' as const,
    customer: { full_name: 'Meena Krishnan', phone: '9123456789', email: 'meena.k@gmail.com' },
    items: [
      {
        garland_name: 'Marigold Temple Garland',
        garland_image: '/images/garland-marigold.jpg',
        quantity: 2,
        unit_price: 350,
        subtotal: 700,
      },
      {
        garland_name: 'Jasmine Pooja Garland',
        garland_image: '/images/garland-jasmine.jpg',
        quantity: 1,
        unit_price: 450,
        subtotal: 450,
      },
    ],
    total: 1150,
    pickup_date: '2026-09-16',
    pickup_start_time: '09:00',
    pickup_end_time: '10:00',
    payment_status: 'PAID',
    payment_id: 'pay_rzp_live_98189',
    payment_method: 'Razorpay NetBanking',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    order_number: 'MG1028',
    status: 'READY_FOR_PICKUP' as const,
    customer: { full_name: 'Anand Venkat', phone: '9345678901' },
    items: [
      {
        garland_name: 'Jasmine Pooja Garland',
        garland_image: '/images/garland-jasmine.jpg',
        quantity: 5,
        unit_price: 450,
        subtotal: 2250,
      },
    ],
    total: 2250,
    pickup_date: '2026-09-14',
    pickup_start_time: '10:00',
    pickup_end_time: '11:00',
    payment_status: 'PAID',
    payment_id: 'pay_rzp_live_97920',
    payment_method: 'UPI / Paytm',
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '5',
    order_number: 'MG1029',
    status: 'COLLECTED' as const,
    customer: { full_name: 'Sunita Rajan', phone: '9567890123' },
    items: [
      {
        garland_name: 'Rose Wedding Garland',
        garland_image: '/images/garland-rose.jpg',
        quantity: 1,
        unit_price: 650,
        subtotal: 650,
      },
    ],
    total: 650,
    pickup_date: '2026-09-14',
    pickup_start_time: '09:00',
    pickup_end_time: '10:00',
    payment_status: 'PAID',
    payment_id: 'pay_rzp_live_97511',
    payment_method: 'UPI',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '6',
    order_number: 'MG1018',
    status: 'COLLECTED' as const,
    customer: { full_name: 'Priya Subramaniam', phone: '9876543210', email: 'priya.s@gmail.com' },
    items: [
      {
        garland_name: 'Marigold Temple Garland',
        garland_image: '/images/garland-marigold.jpg',
        quantity: 2,
        unit_price: 350,
        subtotal: 700,
      },
      {
        garland_name: 'Jasmine Pooja Garland',
        garland_image: '/images/garland-jasmine.jpg',
        quantity: 1,
        unit_price: 450,
        subtotal: 450,
      },
    ],
    total: 1150,
    pickup_date: '2026-09-10',
    pickup_start_time: '08:00',
    pickup_end_time: '09:00',
    payment_status: 'PAID',
    payment_id: 'pay_rzp_live_96821',
    payment_method: 'UPI / Google Pay',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '7',
    order_number: 'MG1015',
    status: 'COLLECTED' as const,
    customer: { full_name: 'Anand Venkat', phone: '9345678901' },
    items: [
      {
        garland_name: 'Rose Wedding Garland',
        garland_image: '/images/garland-rose.jpg',
        quantity: 2,
        unit_price: 650,
        subtotal: 1300,
      },
    ],
    total: 1300,
    pickup_date: '2026-09-08',
    pickup_start_time: '11:00',
    pickup_end_time: '12:00',
    payment_status: 'PAID',
    payment_id: 'pay_rzp_live_96504',
    payment_method: 'Razorpay UPI',
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

type OrderStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COLLECTED' | 'COMPLETED' | 'CANCELLED';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; badgeColor: string; next: OrderStatus | null; nextLabel: string | null }
> = {
  NEW: {
    label: 'New Order',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    next: 'ACCEPTED',
    nextLabel: 'Accept Order',
  },
  ACCEPTED: {
    label: 'Payment Accepted',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    next: 'PREPARING',
    nextLabel: 'Start Preparing',
  },
  PREPARING: {
    label: 'Preparing Flowers',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800',
    next: 'READY_FOR_PICKUP',
    nextLabel: '🌸 Mark Ready',
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    color: 'bg-jade-50 text-jade-700 border-jade-200',
    badgeColor: 'bg-amber-100 text-amber-800',
    next: 'COLLECTED',
    nextLabel: '✅ Mark Collected',
  },
  COLLECTED: {
    label: 'Collected',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-800',
    next: null,
    nextLabel: null,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    next: null,
    nextLabel: null,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-50 text-red-700 border-red-200',
    badgeColor: 'bg-red-100 text-red-800',
    next: null,
    nextLabel: null,
  },
};

const TABS = ['ALL', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COLLECTED'] as const;

export default function OwnerDashboard() {
  const { orders: storeOrders, updateOrderStatus } = useOrderStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, addNotification } = useNotificationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Maximized garland item & customer history state
  const [maximizedItem, setMaximizedItem] = useState<{
    item: DemoOrderItem;
    order: DemoOrder;
    customerTotalOrders: number;
    customerOrdersList: DemoOrder[];
  } | null>(null);
  const [modalZoom, setModalZoom] = useState(1);

  function handleOpenMaximized(item: DemoOrderItem, order: DemoOrder) {
    const cleanP = (order.customer.phone || '').replace(/\D/g, '');
    const cleanN = (order.customer.full_name || '').toLowerCase().trim();

    const matchedOrders = orders.filter((o) => {
      const oP = (o.customer.phone || '').replace(/\D/g, '');
      const oN = (o.customer.full_name || '').toLowerCase().trim();
      if (cleanP && oP && cleanP === oP) return true;
      if (cleanN && oN && cleanN === oN) return true;
      return false;
    });

    setMaximizedItem({
      item,
      order,
      customerTotalOrders: matchedOrders.length,
      customerOrdersList: matchedOrders,
    });
    setModalZoom(1);
  }

  // Combine store orders with demo orders seamlessly
  const [orders, setOrders] = useState<DemoOrder[]>(() => {
    const convertedStoreOrders: DemoOrder[] = storeOrders.map((so) => ({
      id: so.id,
      order_number: so.order_number,
      status: so.status,
      customer: {
        full_name: so.customer_name || 'Valued Customer',
        phone: so.customer_phone || '9876543210',
        email: so.customer_email || '',
      },
      items: (so.items || []).map((it) => {
        const qty = it.quantity || 1;
        const uPrice = Number(it.unit_price || (it.subtotal ? it.subtotal / qty : 0));
        const sTotal = Number(it.subtotal || uPrice * qty);
        return {
          id: it.id,
          garland_name: it.garland_name,
          garland_image: (it as any).garland_image || getGarlandImage(it.garland_name),
          quantity: qty,
          unit_price: uPrice,
          subtotal: sTotal,
          customization_notes: (it as any).customization_notes,
        };
      }),
      total: so.total,
      pickup_date: so.pickup_date,
      pickup_start_time: so.pickup_start_time,
      pickup_end_time: so.pickup_end_time,
      payment_status: (so as any).payment_status || 'PAID',
      payment_id: (so as any).payment_id || `pay_${so.order_number}`,
      payment_method: (so as any).payment_method || 'UPI / Razorpay',
      notes: so.notes,
      created_at: so.created_at,
    }));

    // Merge store orders with DEMO_ORDERS
    const existingIds = new Set(convertedStoreOrders.map((o) => o.id));
    const merged = [...convertedStoreOrders, ...DEMO_ORDERS.filter((d) => !existingIds.has(d.id))];
    return merged;
  });

  // Notification panel states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const notifPanelRef = useRef<HTMLDivElement>(null);

  const unreadNotifCount = unreadCount();

  // Close notifications panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;

  // Load real orders from Supabase on mount and listen to Realtime changes
  useEffect(() => {
    let supabaseClient: any;
    let realtimeChannel: any;

    async function loadSupabaseOrders() {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const supabaseOrders: DemoOrder[] = data.data.map((so: any) => ({
            id: so.id,
            order_number: so.order_number,
            status: so.status,
            customer: {
              full_name: so.customer?.full_name || so.customer_name || 'Customer',
              phone: so.customer?.phone || so.customer_phone || '',
              email: so.customer?.email || so.customer_email || '',
            },
            items: (so.items || []).map((it: any) => {
              const qty = it.quantity || 1;
              const uPrice = Number(it.unit_price || (it.subtotal ? it.subtotal / qty : 0));
              const sTotal = Number(it.subtotal || uPrice * qty);
              return {
                id: it.id,
                garland_name: it.garland_name || 'Handcrafted Garland',
                garland_image: it.garland_image || getGarlandImage(it.garland_name),
                quantity: qty,
                unit_price: uPrice,
                subtotal: sTotal,
                customization_notes: it.customization_notes,
              };
            }),
            total: Number(so.total || 0),
            pickup_date: so.pickup_date,
            pickup_start_time: so.pickup_start_time,
            pickup_end_time: so.pickup_end_time,
            payment_status: so.payment_status || 'PAID',
            payment_id: so.payment_id || `pay_${so.order_number}`,
            payment_method: so.payment_method || 'UPI / Razorpay',
            notes: so.notes,
            created_at: so.created_at,
          }));

          setOrders(supabaseOrders);
        }
      } catch (err) {
        console.error('Failed to fetch live orders from Supabase:', err);
      }
    }

    loadSupabaseOrders();

    import('@/lib/supabase/client')
      .then(({ createClient }) => {
        supabaseClient = createClient();
        const chName = `owner-orders-${Math.random().toString(36).slice(2, 8)}`;
        realtimeChannel = supabaseClient
          .channel(chName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload: any) => {
              loadSupabaseOrders();

              if (payload.eventType === 'INSERT') {
                const newOrderRecord = payload.new;
                const custName = newOrderRecord.customer_name || 'Customer';
                addNotificationRef.current({
                  order_number: newOrderRecord.order_number || 'New Order',
                  type: 'NEW_ORDER',
                  title: `New Order Placed — ${formatPrice(newOrderRecord.total)}`,
                  message: `${custName} placed Order #${newOrderRecord.order_number}`,
                  customer_name: custName,
                  amount: Number(newOrderRecord.total),
                  order_id: newOrderRecord.id,
                  pickup_time: `${newOrderRecord.pickup_start_time || ''} - ${newOrderRecord.pickup_end_time || ''}`,
                  payment_status: newOrderRecord.payment_status || 'PAID',
                });

                if (soundEnabledRef.current) {
                  playNotificationChime();
                }
                toast.success(`🌸 New order #${newOrderRecord.order_number} from ${custName} received!`, { duration: 6000 });
              }
            }
          )
          .subscribe();
      })
      .catch(() => {});

    // Also listen to local store changes for instant feedback
    let prevCount = useOrderStore.getState().orders.length;
    const unsub = useOrderStore.subscribe((state) => {
      if (state.orders.length > prevCount) {
        prevCount = state.orders.length;
        const latest = state.orders[0];
        if (latest) {
          if (soundEnabledRef.current) {
            playNotificationChime();
          }
          toast.success(`🌸 New order #${latest.order_number} from ${latest.customer_name || 'Customer'} received!`, { duration: 6000 });
        }
      }
    });

    return () => {
      unsub();
      if (supabaseClient && realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const stats = {
    total: orders.length,
    revenue: totalRevenue,
    preparing: orders.filter((o) => o.status === 'PREPARING').length,
    ready: orders.filter((o) => o.status === 'READY_FOR_PICKUP').length,
    completed: orders.filter((o) => o.status === 'COLLECTED' || o.status === 'COMPLETED').length,
  };

  // Filter orders by tab and search
  const filtered = orders.filter((order) => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'ACCEPTED'
        ? order.status === 'ACCEPTED' || order.status === 'NEW'
        : order.status === activeTab;

    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const custName = (order.customer.full_name || '').toLowerCase();
    const phone = (order.customer.phone || '').toLowerCase();
    const ordNum = (order.order_number || '').toLowerCase();
    const itemsMatch = order.items.some((it) => it.garland_name.toLowerCase().includes(query));

    return custName.includes(query) || phone.includes(query) || ordNum.includes(query) || itemsMatch;
  });

  async function handleUpdateOrderStatus(orderId: string, orderNumber: string, newStatus: OrderStatus) {
    // 1. Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId && o.order_number !== orderNumber) return o;
        return { ...o, status: newStatus };
      })
    );

    toast.success(`Order #${orderNumber} → ${STATUS_CONFIG[newStatus]?.label || newStatus} 🌸`);
    updateOrderStatus(orderNumber, newStatus);

    // 2. Persist update into Supabase database
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          id: orderId,
          status: newStatus,
        }),
      });
    } catch (err) {
      console.error('Failed to update order status in Supabase:', err);
    }
  }

  // Handle clicking a notification in the panel
  function handleNotificationClick(notif: DashboardNotification) {
    markAsRead(notif.id);
    setNotificationsOpen(false);

    // Locate order
    const matched = orders.find(
      (o) => o.order_number === notif.order_number || o.id === notif.order_id
    );

    if (matched) {
      setActiveTab('ALL');
      setSearchQuery(matched.order_number);

      setTimeout(() => {
        const el = document.getElementById(`order-${matched.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }

  const displayedNotifications = notifFilter === 'ALL'
    ? notifications
    : notifications.filter((n) => !n.is_read);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      {/* ── Top Header ── */}
      <div className="bg-white border-b border-gray-100 shadow-xs px-4 py-4 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-gray-900">Owner Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                Store Live
              </span>
            </div>
            <p className="text-sm text-gray-500">Live Order Fulfillment & Real-Time Customer Purchases</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with interactive panel */}
            <div className="relative" ref={notifPanelRef}>
              <button
                id="notifications-bell-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={cn(
                  'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer',
                  notificationsOpen
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                )}
                aria-label="Notifications"
                title="Customer Order Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left"
                  >
                    {/* Panel Header */}
                    <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
                            <Bell className="w-4 h-4" />
                          </div>
                          <h2 className="font-bold text-gray-900 text-sm">Customer Orders</h2>
                          {unreadNotifCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                              {unreadNotifCount} new
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors text-xs cursor-pointer',
                              soundEnabled ? 'text-gray-600 hover:bg-white/60' : 'text-gray-400 bg-gray-200/50'
                            )}
                            title={soundEnabled ? 'Mute chime' : 'Unmute chime'}
                          >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-500" /> : <VolumeX className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setNotificationsOpen(false)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-white/60 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Filter Tabs & Mark All Read */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setNotifFilter('ALL')}
                            className={cn(
                              'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer',
                              notifFilter === 'ALL'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'bg-white/80 text-gray-600 hover:bg-white'
                            )}
                          >
                            All ({notifications.length})
                          </button>
                          <button
                            onClick={() => setNotifFilter('UNREAD')}
                            className={cn(
                              'px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer',
                              notifFilter === 'UNREAD'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'bg-white/80 text-gray-600 hover:bg-white'
                            )}
                          >
                            Unread ({unreadNotifCount})
                          </button>
                        </div>

                        {unreadNotifCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {displayedNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-2 text-xl">
                            🌸
                          </div>
                          <p className="text-xs font-semibold text-gray-700">All caught up!</p>
                          <p className="text-[11px] text-gray-400">No unread notifications right now.</p>
                        </div>
                      ) : (
                        displayedNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              'p-3.5 hover:bg-rose-50/40 transition-colors cursor-pointer flex items-start gap-3 text-left',
                              !n.is_read ? 'bg-rose-50/20' : 'bg-white'
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-xs',
                                n.type === 'NEW_ORDER' ? 'bg-blue-100 text-blue-700' :
                                n.type === 'PREPARING' ? 'bg-orange-100 text-orange-700' :
                                n.type === 'READY_FOR_PICKUP' ? 'bg-jade-100 text-jade-700' :
                                'bg-emerald-100 text-emerald-700'
                              )}
                            >
                              {n.type === 'NEW_ORDER' ? <ShoppingBag className="w-4 h-4" /> :
                               n.type === 'PREPARING' ? <Clock className="w-4 h-4" /> :
                               n.type === 'READY_FOR_PICKUP' ? <Package className="w-4 h-4" /> :
                               <CheckCircle2 className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-xs font-bold text-gray-900 font-mono">
                                  #{n.order_number}
                                </span>
                                <span className="text-[10px] text-gray-400">{n.time}</span>
                              </div>

                              <p className="text-xs font-semibold text-gray-800 line-clamp-1">{n.title}</p>
                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>

                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100/60 text-[10px] text-gray-500">
                                <span>Customer: <strong className="text-gray-700">{n.customer_name}</strong></span>
                                <span className="font-bold text-rose-600">View order →</span>
                              </div>
                            </div>

                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Panel Footer */}
                    <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                      <Link
                        href="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1"
                      >
                        Open Full Notification Center <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Key Metrics Overview ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
            { label: 'Accepted Revenue', value: formatPrice(stats.revenue), icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'In Preparation', value: stats.preparing, icon: Clock, color: 'bg-orange-50 text-orange-600' },
            { label: 'Ready for Pickup', value: stats.ready, icon: Package, color: 'bg-jade-50 text-jade-600' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="font-display text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {TABS.map((tab) => {
              const label =
                tab === 'ALL'
                  ? 'All Orders'
                  : tab === 'ACCEPTED'
                  ? 'Payment Accepted'
                  : tab === 'READY_FOR_PICKUP'
                  ? 'Ready for Pickup'
                  : STATUS_CONFIG[tab as OrderStatus]?.label || tab;

              const count =
                tab === 'ALL'
                  ? orders.length
                  : tab === 'ACCEPTED'
                  ? orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'NEW').length
                  : orders.filter((o) => o.status === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                    activeTab === tab
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      activeTab === tab ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, phone, or #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Placed Orders: Payment Option Accepted Cards ── */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-xs">
              <span className="text-4xl block mb-3">🌸</span>
              <h3 className="font-bold text-gray-800 text-base mb-1">No orders found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No orders matching "${searchQuery}". Try clearing your search.`
                  : 'No customer orders in this fulfillment category right now.'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} variant="outline" size="sm" className="mt-4">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.ACCEPTED;
              const custName = order.customer.full_name || 'Customer';
              const custPhone = order.customer.phone || '';
              const custEmail = order.customer.email || '';
              const cleanPhone = custPhone.replace(/\D/g, '');

              return (
                <motion.div
                  key={order.id}
                  id={`order-${order.id}`}
                  layout
                  className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* ── Order Header (Payment Option Accepted Bar) ── */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-50/90 via-white to-gray-50/40 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Customer Avatar Initial */}
                      <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        {custName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-gray-900 text-base">{custName}</span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                            #{order.order_number}
                          </span>

                          {/* Payment Option Accepted Badge */}
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment Option Accepted (PAID)
                          </span>

                          {/* Customer Total Orders Placed Badge */}
                          {(() => {
                            const count = orders.filter((o) => {
                              const oP = (o.customer.phone || '').replace(/\D/g, '');
                              const oN = (o.customer.full_name || '').toLowerCase().trim();
                              if (cleanPhone && oP && cleanPhone === oP) return true;
                              if (custName && oN && custName.toLowerCase().trim() === oN) return true;
                              return false;
                            }).length;

                            return (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                                title={`This customer has placed ${count} total order(s) with your shop`}
                              >
                                <Sparkles className="w-3 h-3 text-purple-600" /> {count} {count === 1 ? 'Order Placed' : 'Orders Placed'}
                              </span>
                            );
                          })()}

                          {/* Fulfillment status badge */}
                          <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide', cfg.badgeColor)}>
                            {cfg.label}
                          </span>
                        </div>

                        {/* Customer Direct Contact & Call Actions */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          {custPhone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <a
                                href={`tel:+91${cleanPhone}`}
                                className="hover:text-emerald-700 font-mono font-bold hover:underline text-gray-800"
                                title="Call customer"
                              >
                                +91 {custPhone}
                              </a>
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                                  `Vanakkam ${custName}, this is Malligai Garlands regarding your Order #${order.order_number}!`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold inline-flex items-center gap-1 border border-emerald-200/60"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                              </a>
                            </div>
                          )}

                          {custEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <a href={`mailto:${custEmail}`} className="hover:underline text-gray-600">
                                {custEmail}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pickup Slot & Total Amount Paid */}
                    <div className="flex items-end sm:items-center sm:text-right gap-4 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div>
                        <div className="flex items-center sm:justify-end gap-1.5 text-xs font-semibold text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" />
                          <span>Pickup: {order.pickup_date ? formatDate(order.pickup_date) : 'Today'}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {order.pickup_start_time
                            ? formatTimeSlot(order.pickup_start_time, order.pickup_end_time)
                            : 'All-Day Pickup'}
                        </p>
                      </div>

                      <div className="pl-4 border-l border-gray-200">
                        <p className="text-[11px] font-medium text-gray-400">Total Paid</p>
                        <p className="font-display text-xl font-bold text-emerald-700 font-mono">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── What They Bought (Garland Item Details) ── */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-rose-500" />
                          What They Bought ({order.items.length} {order.items.length === 1 ? 'Garland' : 'Garlands'})
                        </h4>
                        <p className="text-[11px] text-rose-600 font-medium mt-0.5">
                          💡 Click any garland below to maximize photo & see customer order history
                        </p>
                      </div>
                      {order.payment_id && (
                        <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 hidden sm:inline-block">
                          Payment Ref: {order.payment_id}
                        </span>
                      )}
                    </div>

                    {order.items.length === 0 ? (
                      <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                        No item details recorded for this order.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {order.items.map((item, idx) => {
                          const itemImg = item.garland_image || getGarlandImage(item.garland_name);
                          const itemTotal = Number(item.subtotal || item.unit_price * item.quantity);

                          return (
                            <div
                              key={item.id || idx}
                              onClick={() => handleOpenMaximized(item, order)}
                              className="group flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-rose-50/50 hover:border-rose-300 transition-all cursor-pointer relative shadow-2xs hover:shadow-sm"
                              title="Click to maximize garland photo & view customer order history"
                            >
                              {/* Garland Thumbnail with Maximize Hover Overlay */}
                              <div className="relative shrink-0 overflow-hidden rounded-xl">
                                {itemImg ? (
                                  <img
                                    src={itemImg}
                                    alt={item.garland_name}
                                    className="w-14 h-14 object-cover border border-rose-100 shadow-xs group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-rose-100 text-rose-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    🌸
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Maximize2 className="w-4 h-4 drop-shadow-md" />
                                </div>
                              </div>

                              {/* Garland Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-rose-600 transition-colors">
                                    {item.garland_name || 'Handcrafted Fresh Garland'}
                                  </p>
                                  <span className="text-[10px] text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold shrink-0">
                                    🔍 Maximize
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                  <span className="font-mono text-gray-700">
                                    {formatPrice(item.unit_price || 0)} each
                                  </span>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
                                    Qty: {item.quantity}
                                  </span>
                                </div>
                                {item.customization_notes && (
                                  <p className="text-[10px] text-amber-700 bg-amber-50 rounded-md px-1.5 py-0.5 mt-1 border border-amber-200/50">
                                    Note: {item.customization_notes}
                                  </p>
                                )}
                              </div>

                              {/* Item Subtotal */}
                              <div className="text-right shrink-0">
                                <span className="font-bold font-mono text-sm text-gray-900">
                                  {formatPrice(itemTotal)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Customer special order notes if any */}
                    {order.notes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
                        <span className="font-bold">📝 Order Note:</span>
                        <span>{order.notes}</span>
                      </div>
                    )}

                    {/* ── Fulfillment Status Controller & Action Bar ── */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Fulfillment Status:</span>
                        <select
                          value={order.status || 'ACCEPTED'}
                          onChange={(e) => handleUpdateOrderStatus(order.id, order.order_number, e.target.value as OrderStatus)}
                          className="text-xs font-bold rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
                        >
                          <option value="ACCEPTED">Payment Accepted / Confirmed</option>
                          <option value="PREPARING">Preparing Flowers</option>
                          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                          <option value="COLLECTED">Collected / Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-2 justify-end">
                        {order.status === 'NEW' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, order.order_number, 'ACCEPTED')}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Accept Order
                          </button>
                        )}
                        {order.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, order.order_number, 'PREPARING')}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            🌸 Start Preparing
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, order.order_number, 'READY_FOR_PICKUP')}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            🌸 Mark Ready for Pickup
                          </button>
                        )}
                        {order.status === 'READY_FOR_PICKUP' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, order.order_number, 'COLLECTED')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            ✅ Mark Collected
                          </button>
                        )}
                        {(order.status === 'COLLECTED' || order.status === 'COMPLETED') && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Order Picked Up
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Maximized Garland Photo & Customer Order History Modal ── */}
      <AnimatePresence>
        {maximizedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
            onClick={() => setMaximizedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden my-auto flex flex-col max-h-[92vh]"
            >
              {/* Modal Top Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-white to-pink-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                    🌸
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-gray-900 leading-tight">
                      {maximizedItem.item.garland_name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold">Order #{maximizedItem.order.order_number}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> PAID
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalZoom((z) => (z === 1 ? 1.5 : 1))}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title={modalZoom > 1 ? 'Reset Zoom' : 'Zoom In'}
                  >
                    <ZoomIn className="w-4 h-4" />
                    <span className="hidden sm:inline">{modalZoom > 1 ? 'Reset Zoom' : 'Zoom In'}</span>
                  </button>

                  <button
                    onClick={() => setMaximizedItem(null)}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Split 2-column view */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Left side: Full Size Garland Picture (7 cols) */}
                <div className="md:col-span-7 p-6 flex flex-col items-center justify-center bg-gray-50/60 min-h-[360px] relative overflow-hidden">
                  <div className="relative group max-w-full flex items-center justify-center">
                    <img
                      src={maximizedItem.item.garland_image || getGarlandImage(maximizedItem.item.garland_name)}
                      alt={maximizedItem.item.garland_name}
                      style={{ transform: `scale(${modalZoom})` }}
                      onClick={() => setModalZoom((z) => (z === 1 ? 1.5 : 1))}
                      className="max-h-[50vh] sm:max-h-[58vh] w-auto object-contain rounded-2xl shadow-xl transition-transform duration-200 cursor-zoom-in border-2 border-white"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3 text-center">
                    🔍 Click photo or toggle zoom button to view garland weave & flower details
                  </p>
                </div>

                {/* Right side: How Many Orders Placed & Item Breakdown (5 cols) */}
                <div className="md:col-span-5 p-5 sm:p-6 flex flex-col gap-4 bg-white overflow-y-auto">
                  {/* Customer Orders Placed Highlight Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/80 border border-purple-100 shadow-xs">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider mb-2.5">
                      <Sparkles className="w-4 h-4 text-purple-600" /> Customer Order History
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-purple-200 text-purple-800 font-bold text-base flex items-center justify-center shrink-0">
                        {maximizedItem.order.customer.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{maximizedItem.order.customer.full_name}</p>
                        <p className="text-xs text-gray-500 font-mono">+91 {maximizedItem.order.customer.phone}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/95 border border-purple-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">Orders Placed by Customer:</p>
                        <p className="text-lg font-display font-bold text-purple-900">
                          {maximizedItem.customerTotalOrders} {maximizedItem.customerTotalOrders === 1 ? 'Order' : 'Orders Placed'}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-200/60">
                        {maximizedItem.customerTotalOrders > 1 ? '⭐ Returning Client' : '🌱 New Customer'}
                      </span>
                    </div>

                    {/* Previous orders mini-list if multiple orders exist */}
                    {maximizedItem.customerOrdersList.length > 1 && (
                      <div className="mt-3 pt-2.5 border-t border-purple-100 text-xs">
                        <p className="text-[11px] font-bold text-purple-900 mb-1.5">All bookings by this client:</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {maximizedItem.customerOrdersList.map((histOrder) => (
                            <div
                              key={histOrder.id}
                              className="flex items-center justify-between text-[11px] text-gray-600 bg-white/70 px-2 py-1 rounded-lg"
                            >
                              <span className="font-mono font-bold">#{histOrder.order_number}</span>
                              <span>{formatDate(histOrder.pickup_date)}</span>
                              <span className="font-mono font-bold text-emerald-700">{formatPrice(histOrder.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Garland Item Ordered Details */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 shadow-xs">
                    <p className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-rose-600" /> Quantity Ordered
                    </p>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">Garlands in this order:</span>
                      <span className="text-xl font-bold font-mono text-rose-600">
                        × {maximizedItem.item.quantity} {maximizedItem.item.quantity === 1 ? 'Garland' : 'Garlands'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 pt-1.5 border-t border-rose-100/80">
                      <span>Unit Rate: {formatPrice(maximizedItem.item.unit_price)} each</span>
                      <span className="font-bold text-gray-900 font-mono text-sm">
                        Total: {formatPrice(maximizedItem.item.subtotal)}
                      </span>
                    </div>

                    {maximizedItem.item.customization_notes && (
                      <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200/60 text-xs text-amber-900">
                        <span className="font-bold">Special Note:</span> {maximizedItem.item.customization_notes}
                      </div>
                    )}
                  </div>

                  {/* Customer Quick Call & WhatsApp Action */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-600">Contact Customer:</p>
                    <div className="flex gap-2">
                      <a
                        href={`tel:+91${maximizedItem.order.customer.phone.replace(/\D/g, '')}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/91${maximizedItem.order.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Vanakkam ${maximizedItem.order.customer.full_name}, this is Malligai Garlands regarding your Order #${maximizedItem.order.order_number} for ${maximizedItem.item.garland_name} (×${maximizedItem.item.quantity})!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Pickup & Order Overview */}
                  <div className="text-xs text-gray-500 space-y-1.5 pt-1 border-t border-gray-100">
                    <div className="flex justify-between">
                      <span>Pickup Schedule:</span>
                      <strong className="text-gray-800 font-semibold">
                        {formatDate(maximizedItem.order.pickup_date)} · {formatTimeSlot(maximizedItem.order.pickup_start_time, maximizedItem.order.pickup_end_time)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Payment Status:</span>
                      <strong className="text-emerald-700 font-bold">PAID ({formatPrice(maximizedItem.order.total)})</strong>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
