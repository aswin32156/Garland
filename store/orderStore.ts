import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus } from '@/types';

export interface LocalOrder extends Order {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
}

interface OrderState {
  orders: LocalOrder[];
  addOrder: (order: LocalOrder) => void;
  getOrder: (idOrNumber: string) => LocalOrder | undefined;
  updateOrderStatus: (orderNumber: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [
        {
          id: 'demo-order-1',
          order_number: 'MG1042',
          customer_id: 'cust-01',
          customer_name: 'Priya Sundaram',
          customer_phone: '9876543210',
          customer_email: 'priya@example.com',
          status: 'READY_FOR_PICKUP',
          payment_status: 'PAID',
          subtotal: 1750,
          total: 1750,
          pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          pickup_start_time: '17:00',
          pickup_end_time: '18:00',
          payment_id: 'pay_demo_99214',
          created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
          updated_at: new Date().toISOString(),
          items: [
            {
              id: 'item-1',
              order_id: 'demo-order-1',
              garland_id: 'gar-1',
              garland_name: 'Rose Wedding Garland',
              quantity: 2,
              unit_price: 650,
              subtotal: 1300,
            },
            {
              id: 'item-2',
              order_id: 'demo-order-1',
              garland_id: 'gar-2',
              garland_name: 'Jasmine Pooja Garland',
              quantity: 1,
              unit_price: 450,
              subtotal: 450,
            },
          ],
        },
        {
          id: 'demo-order-2',
          order_number: 'MG1043',
          customer_id: 'cust-02',
          customer_name: 'Karthik Raja',
          customer_phone: '9840123456',
          customer_email: 'karthik@example.com',
          status: 'PREPARING',
          payment_status: 'PAID',
          subtotal: 850,
          total: 850,
          pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          pickup_start_time: '09:00',
          pickup_end_time: '10:00',
          payment_id: 'pay_demo_99215',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          updated_at: new Date().toISOString(),
          items: [
            {
              id: 'item-3',
              order_id: 'demo-order-2',
              garland_id: 'gar-3',
              garland_name: 'Marigold Temple Garland',
              quantity: 2,
              unit_price: 350,
              subtotal: 700,
            },
          ],
        },
      ],
      addOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders],
        }));
      },
      getOrder: (idOrNumber) => {
        return get().orders.find(
          (o) => o.order_number === idOrNumber || o.id === idOrNumber
        );
      },
      updateOrderStatus: (orderNumber, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.order_number === orderNumber || o.id === orderNumber
              ? { ...o, status, updated_at: new Date().toISOString() }
              : o
          ),
        }));
      },
    }),
    {
      name: 'malligai-orders',
    }
  )
);
