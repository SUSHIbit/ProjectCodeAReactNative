import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { getUserFriendlyError } from '../utils/errorHandler';
import type { User, Session } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: false,
  initializing: true,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: getUserFriendlyError(error, 'sign in'),
        loading: false,
      });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: getUserFriendlyError(error, 'sign up'),
        loading: false,
      });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      set({
        user: null,
        session: null,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: getUserFriendlyError(error, 'sign out'),
        loading: false,
      });
    }
  },

  checkSession: async () => {
    try {
      set({ error: null });

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      set({
        user: session?.user || null,
        session: session,
        initializing: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to check session.',
        user: null,
        session: null,
        initializing: false,
      });
    }
  },

  clearError: () => set({ error: null }),
  setInitializing: (value: boolean) => set({ initializing: value }),
}));

// Set up auth state listener
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({
    user: session?.user || null,
    session: session,
  });
});
