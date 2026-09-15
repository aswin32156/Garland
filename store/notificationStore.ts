import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardNotification {
  id: string;
  order_number: string;
  type: 'NEW_ORDER' | 'PAYMENT_SUCCESS';
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

// Only real placed orders are kept - no mock unwanted notifications
function isOrderNotification(n: any): boolean {
  if (!n) return false;
  const isOrderType = n.type === 'NEW_ORDER' || n.type === 'PAYMENT_SUCCESS';
  const isMock =
    ['MG1025', 'MG1026', 'MG1027', 'MG1028'].includes(n.order_number) ||
    ['notif-1', 'notif-2', 'notif-3', 'notif-4'].includes(n.id);
  return isOrderType && !isMock;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      unreadCount: () =>
        get().notifications.filter((n) => isOrderNotification(n) && !n.is_read).length,

      addNotification: (n) => {
        // Owner only receives notifications for new orders placed
        if (n.type !== 'NEW_ORDER' && n.type !== 'PAYMENT_SUCCESS') return;

        const newNotif: DashboardNotification = {
          ...n,
          type: n.type as 'NEW_ORDER' | 'PAYMENT_SUCCESS',
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          is_read: false,
          time: 'Just now',
        };

        set((state) => ({
          notifications: [
            newNotif,
            ...state.notifications.filter((prev) => isOrderNotification(prev)),
          ],
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
      version: 3,
      migrate: (persistedState: any) => {
        const cleaned = (persistedState?.notifications || []).filter(isOrderNotification);
        return {
          ...persistedState,
          notifications: cleaned,
        };
      },
    }
  )
);
