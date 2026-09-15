import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Profile, Garland } from '@/types';

// Clear legacy persistent auth from localStorage if present
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('malligai-auth');
  } catch (e) {
    // ignore
  }
}

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  pendingItem: { garland: Garland; quantity: number } | null;
  redirectAfterAuth: string | null;

  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  openAuthModal: (
    pending?: { garland: Garland; quantity: number } | null,
    redirect?: string | null
  ) => void;
  closeAuthModal: () => void;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isCustomer: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthModalOpen: false,
      pendingItem: null,
      redirectAfterAuth: null,

      setUser: (user) => {
        set({ user });
        if (user && typeof window !== 'undefined') {
          // Set session cookie without max-age so it expires when the browser/session is closed
          document.cookie = `demo_session=${user.role}; path=/; SameSite=Lax`;
        }
      },
      setLoading: (isLoading) => set({ isLoading }),

      openAuthModal: (pending = null, redirect = null) => {
        set({
          isAuthModalOpen: true,
          pendingItem: pending,
          redirectAfterAuth: redirect,
        });
      },

      closeAuthModal: () => {
        set({
          isAuthModalOpen: false,
          pendingItem: null,
          redirectAfterAuth: null,
        });
      },

      logout: async () => {
        set({ user: null });
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('malligai-session-auth');
            localStorage.removeItem('malligai-auth');
            document.cookie = 'demo_session=; Max-Age=0; path=/';
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            await supabase.auth.signOut();
          } catch (e) {
            // ignore
          }
        }
      },

      isAdmin: () => get().user?.role === 'ADMIN',
      isOwner: () => get().user?.role === 'OWNER',
      isCustomer: () => get().user?.role === 'CUSTOMER',
    }),
    {
      name: 'malligai-session-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
