import { create } from 'zustand';
import { Garland } from '@/types';
import { MOCK_GARLANDS } from '@/lib/mock-data';

// Clear legacy persisted catalog from localStorage if present
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('malligai-garlands-catalog');
  } catch (e) {
    // ignore
  }
}

interface GarlandState {
  garlands: Garland[];
  isLoaded: boolean;
  setGarlands: (garlands: Garland[]) => void;
  fetchGarlands: () => Promise<void>;
  deleteGarland: (id: string) => Promise<void>;
  addGarland: (garland: Garland) => Promise<void>;
  updateGarland: (id: string, updates: Partial<Garland>) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;
  toggleFeatured: (id: string) => Promise<void>;
  resetCatalog: () => Promise<void>;
}

export const useGarlandStore = create<GarlandState>()((set, get) => ({
  garlands: [],
  isLoaded: false,

  setGarlands: (garlands: Garland[]) => {
    set({ garlands, isLoaded: true });
  },

  fetchGarlands: async () => {
    try {
      const res = await fetch('/api/garlands?all=true', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        set({ garlands: data.data, isLoaded: true });
      }
    } catch (err) {
      console.error('Failed to sync garlands from server:', err);
    }
  },

  deleteGarland: async (id: string) => {
    // 1. Instant local UI update
    const updated = get().garlands.filter((g) => g.id !== id && g.slug !== id);
    set({ garlands: updated });

    // 2. Persistent deletion on disk via API
    try {
      const res = await fetch(`/api/garlands?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result.data)) {
        set({ garlands: result.data, isLoaded: true });
      }
    } catch (err) {
      console.error('Failed to delete garland on server:', err);
    }
  },

  addGarland: async (garland: Garland) => {
    // 1. Instant local UI update
    set((state) => ({
      garlands: [garland, ...state.garlands],
    }));

    // 2. Persistent write to disk via API
    try {
      const res = await fetch('/api/garlands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garland }),
        cache: 'no-store',
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result.data)) {
        set({ garlands: result.data, isLoaded: true });
      }
    } catch (err) {
      console.error('Failed to add garland on server:', err);
    }
  },

  updateGarland: async (id: string, updates: Partial<Garland>) => {
    const updated = get().garlands.map((g) =>
      g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
    );
    set({ garlands: updated });

    try {
      const res = await fetch('/api/garlands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
        cache: 'no-store',
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result.data)) {
        set({ garlands: result.data, isLoaded: true });
      }
    } catch (err) {
      console.error('Failed to update garland on server:', err);
    }
  },

  toggleAvailability: async (id: string) => {
    const target = get().garlands.find((g) => g.id === id);
    if (!target) return;
    const newAvailability = !target.is_available;
    await get().updateGarland(id, { is_available: newAvailability });
  },

  toggleFeatured: async (id: string) => {
    const target = get().garlands.find((g) => g.id === id);
    if (!target) return;
    const newFeatured = !target.is_featured;
    await get().updateGarland(id, { is_featured: newFeatured });
  },

  resetCatalog: async () => {
    set({ garlands: MOCK_GARLANDS });
    try {
      const res = await fetch('/api/garlands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
        cache: 'no-store',
      });
      const result = await res.json();
      if (result?.success && Array.isArray(result.data)) {
        set({ garlands: result.data, isLoaded: true });
      }
    } catch (err) {
      console.error('Failed to reset catalog on server:', err);
    }
  },
}));
