import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Garland } from '@/types';

interface WishlistState {
  items: Garland[];
  addItem: (garland: Garland) => void;
  removeItem: (id: string) => void;
  toggleItem: (garland: Garland) => boolean; // returns isAdded
  hasItem: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (garland) => {
        if (!get().hasItem(garland.id)) {
          set((state) => ({ items: [...state.items, garland] }));
        }
      },
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },
      toggleItem: (garland) => {
        const exists = get().hasItem(garland.id);
        if (exists) {
          get().removeItem(garland.id);
          return false;
        } else {
          get().addItem(garland);
          return true;
        }
      },
      hasItem: (id) => {
        return get().items.some((item) => item.id === id);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'malligai-wishlist',
    }
  )
);
