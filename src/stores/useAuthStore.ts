import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  initialize: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  initialize: () => {
    if (initialized) return;
    initialized = true;
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, isLoading: false });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isLoading: false });
    });
  },
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
