import { create } from 'zustand';
import * as Linking from 'expo-linking';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

let googleConfigured = false;
function configureGoogleOnce() {
  if (googleConfigured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    console.warn(
      '[auth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing. Google sign-in will fail.',
    );
    return;
  }
  GoogleSignin.configure({
    webClientId,
    // requestIdToken is required for Supabase signInWithIdToken.
    // It returns an id_token whose `aud` claim equals webClientId, which is
    // what Supabase verifies against the Client IDs configured in its Google provider.
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
  googleConfigured = true;
}

export interface UserProfile {
  userId: string;
  email: string | null;
  displayName: string | null;
  isPro: boolean;
  proPurchasedAt: string | null;
}

type AuthStatus = 'idle' | 'pending' | 'success' | 'error';

interface AuthStore {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loaded: boolean;
  status: AuthStatus;
  lastError: string | null;

  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ ok: boolean; message?: string; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

function toProfile(row: {
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_pro: boolean;
  pro_purchased_at: string | null;
}): UserProfile {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    isPro: row.is_pro,
    proPurchasedAt: row.pro_purchased_at,
  };
}

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, display_name, is_pro, pro_purchased_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[auth] loadProfile error', error.message);
    return null;
  }
  if (!data) return null;
  return toProfile(data);
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loaded: false,
  status: 'idle',
  lastError: null,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const user = session?.user ?? null;
      let profile: UserProfile | null = null;
      if (user) {
        profile = await loadProfile(user.id);
      }
      set({ session, user, profile, loaded: true });

      // Subscribe to future auth changes (token refresh, sign-out, sign-in elsewhere).
      supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        const nextUser = nextSession?.user ?? null;
        const nextProfile = nextUser ? await loadProfile(nextUser.id) : null;
        set({ session: nextSession, user: nextUser, profile: nextProfile });
      });
    } catch (e) {
      console.warn('[auth] initialize failed', e);
      set({ loaded: true });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ status: 'pending', lastError: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ status: 'error', lastError: error.message });
      return { ok: false, message: error.message };
    }
    set({ status: 'success' });
    return { ok: true };
  },

  signUpWithEmail: async (email, password) => {
    set({ status: 'pending', lastError: null });
    const redirectTo = Linking.createURL('/auth-callback');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      set({ status: 'error', lastError: error.message });
      return { ok: false, message: error.message };
    }
    set({ status: 'success' });
    // If email confirmation is required, session is null until the user clicks the link.
    return {
      ok: true,
      needsEmailConfirmation: !data.session,
    };
  },

  signInWithGoogle: async () => {
    set({ status: 'pending', lastError: null });
    try {
      configureGoogleOnce();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // User cancelled the picker.
        set({ status: 'idle' });
        return { ok: false, message: 'Cancelled' };
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        const message = 'Google did not return an ID token';
        set({ status: 'error', lastError: message });
        return { ok: false, message };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) {
        set({ status: 'error', lastError: error.message });
        return { ok: false, message: error.message };
      }

      set({ status: 'success' });
      return { ok: true };
    } catch (e) {
      let message = e instanceof Error ? e.message : 'Google sign-in failed';
      if (isErrorWithCode(e)) {
        switch (e.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            set({ status: 'idle' });
            return { ok: false, message: 'Cancelled' };
          case statusCodes.IN_PROGRESS:
            message = 'Sign-in already in progress';
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            message = 'Google Play Services not available on this device';
            break;
          default:
            message = `${message} (${e.code})`;
        }
      }
      set({ status: 'error', lastError: message });
      return { ok: false, message };
    }
  },

  signOut: async () => {
    // Best-effort sign-out from Google so the next sign-in re-prompts for account.
    try {
      configureGoogleOnce();
      if (await GoogleSignin.hasPreviousSignIn()) {
        await GoogleSignin.signOut();
      }
    } catch (e) {
      console.warn('[auth] GoogleSignin.signOut failed', e);
    }
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, status: 'idle' });
  },

  sendPasswordReset: async (email) => {
    set({ status: 'pending', lastError: null });
    const redirectTo = Linking.createURL('/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      set({ status: 'error', lastError: error.message });
      return { ok: false, message: error.message };
    }
    set({ status: 'success' });
    return { ok: true };
  },

  updatePassword: async (newPassword) => {
    set({ status: 'pending', lastError: null });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      set({ status: 'error', lastError: error.message });
      return { ok: false, message: error.message };
    }
    set({ status: 'success' });
    return { ok: true };
  },

  refreshProfile: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    const profile = await loadProfile(userId);
    if (profile) set({ profile });
  },

  clearError: () => set({ lastError: null }),
}));
