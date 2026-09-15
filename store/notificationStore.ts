import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardNotification {
  id: string;
  order_number: string;
  type: 'NEW_ORDER' | 'PAYMENT_SUCCESS' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COLLECTED';
  title: string;
  message: string;
  customer_name: string;
  amount: number;
  time: string;
  is_read: boolean;
  order_id?: string;
  pickup_time?: string;
  payment_id?: string;
  payment_status?: string;
  customer_phone?: string;
  items_summary?: string;
}

interface NotificationState {
  notifications: DashboardNotification[];
  unreadCount: () => number;
  addNotification: (n: Omit<DashboardNotification, 'id' | 'is_read' | 'time'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const INITIAL_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: 'notif-1',
    order_number: 'MG1025',
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Received — ₹1,750',
    message: 'Priya Subramaniam paid online for 2x Rose Wedding Garland & 1x Jasmine Garland',
    customer_name: 'Priya Subramaniam',
    amount: 1750,
    time: '5 mins ago',
    is_read: false,
    order_id: '1',
    pickup_time: '17:00 - 18:00',
    payment_id: 'pay_rzp_99214',
    payment_status: 'PAID',
  },
  {
    id: 'notif-2',
    order_number: 'MG1026',
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Received — ₹1,200',
    message: 'Rajesh Kumar paid online for Grand Wedding Garland',
    customer_name: 'Rajesh Kumar',
    amount: 1200,
    time: '45 mins ago',
    is_read: false,
    order_id: '2',
    pickup_time: '11:00 - 12:00',
    payment_id: 'pay_rzp_99215',
    payment_status: 'PAID',
  },
  {
    id: 'notif-3',
    order_number: 'MG1027',
    type: 'PREPARING',
    title: 'Order in Preparation',
    message: 'Meena Krishnan · 3x Marigold & 2x Mixed Garland',
    customer_name: 'Meena Krishnan',
    amount: 1200,
    time: '2 hours ago',
    is_read: true,
    order_id: '3',
    pickup_time: '09:00 - 10:00',
  },
  {
    id: 'notif-4',
    order_number: 'MG1028',
    type: 'READY_FOR_PICKUP',
    title: 'Ready for Customer Pickup',
    message: 'Anand Venkat · 5x Jasmine Pooja Garland',
    customer_name: 'Anand Venkat',
    amount: 2250,
    time: '4 hours ago',
    is_read: true,
    order_id: '4',
    pickup_time: '10:00 - 11:00',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,

      unreadCount: () => get().notifications.filter((n) => !n.is_read).length,

      addNotification: (n) => {
        const newNotif: DashboardNotification = {
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          is_read: false,
          time: 'Just now',
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
      },

      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'malligai-notifications-store',
    }
  )
);
