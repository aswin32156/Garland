import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Garland } from '@/types';

// We generate IDs using a simple timestamp + random fallback
function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface CartState {
  items: CartItem[];
  // Actions
  addItem: (garland: Garland, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  // Computed helpers (called as plain functions, not selectors)
  getTotal: () => number;
  getCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (garland, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.garland.id === garland.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.garland.id === garland.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { id: genId(), garland, quantity }],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce((acc, i) => acc + i.garland.price * i.quantity, 0),

      getCount: () =>
        get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    {
      name: 'malligai-cart',
    }
  )
);
