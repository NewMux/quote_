import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { AUTH_CALLBACK_URL } from '../lib/authCallbackUrl';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  initialize: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: AUTH_CALLBACK_URL },
    });
    if (error) throw error;
    set({ session: data.session });
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ session: data.session });
  },
  // supabase-js clears the local session (and fires SIGNED_OUT, which resets every per-user store
  // in the root layout) even when the server call fails, e.g. offline — so a failure here still
  // leaves the user signed out on this device and isn't worth surfacing.
  signOut: async () => {
    await supabase.auth.signOut().catch(() => {});
    set({ session: null });
  },
  resendConfirmation: async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: AUTH_CALLBACK_URL },
    });
    if (error) throw error;
  },
}));
