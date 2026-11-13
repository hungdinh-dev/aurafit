import type { Session, User } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { z } from 'zod';
import { create } from 'zustand';

import { queryClient } from './queryClient';
import { assertSupabase, isSupabaseConfigured, supabase } from './supabase';

type AuthState = {
  session: Session | null;
  /** false until the persisted session has been read from SecureStore. */
  initialized: boolean;
  /** __DEV__ only: browse the app without an account (no Supabase configured). */
  devPreview: boolean;
};

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  initialized: false,
  devPreview: false,
}));

let listening = false;

/** Call once at startup (root layout). Restores the session and keeps the store in sync. */
export function startAuthListener(): void {
  if (listening) return;
  listening = true;
  supabase.auth
    .getSession()
    .then(({ data }) => useAuthStore.setState({ session: data.session, initialized: true }))
    .catch(() => useAuthStore.setState({ session: null, initialized: true }));
  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.setState({ session, initialized: true });
    if (event === 'SIGNED_OUT') queryClient.clear();
  });
}

// ---------------------------------------------------------------------------------------------
// Hooks

export function useSession(): Session | null {
  return useAuthStore((s) => s.session);
}

export function useUser(): User | null {
  return useAuthStore((s) => s.session?.user ?? null);
}

/** Everything the navigation guard needs. */
export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const devPreview = useAuthStore((s) => s.devPreview);
  return {
    session,
    user: session?.user ?? null,
    initialized,
    devPreview,
    isSignedIn: !!session || devPreview,
  };
}

// ---------------------------------------------------------------------------------------------
// Actions

export const emailSchema = z.email();
export const otpSchema = z.string().regex(/^\d{6}$/);

/** Redirect URI registered in Supabase Auth → URL Configuration (aurafit://auth/callback in builds). */
export function authRedirectUri(): string {
  return makeRedirectUri({ scheme: 'aurafit', path: 'auth/callback' });
}

/** Read `code` / tokens / errors from both the query string and the hash of a redirect URL. */
export function parseAuthParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const [, afterQuery = ''] = url.split('?');
  const [query = '', hashFromQuery = ''] = afterQuery.split('#');
  const hash = hashFromQuery || (url.includes('#') ? (url.split('#')[1] ?? '') : '');
  for (const part of [query, hash]) {
    for (const [k, v] of new URLSearchParams(part)) out[k] = v;
  }
  return out;
}

/** Finish an OAuth redirect (PKCE `code` or implicit tokens). Also used by app/auth/callback.tsx. */
export async function completeAuthFromUrl(url: string): Promise<void> {
  const params = parseAuthParams(url);
  if (params.error) throw new Error(params.error_description ?? params.error);
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
  }
}

/** Google sign-in through Supabase OAuth in an ASWebAuthenticationSession. */
export async function signInWithGoogle(): Promise<'success' | 'cancelled'> {
  assertSupabase();
  const redirectTo = authRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return 'cancelled';
  await completeAuthFromUrl(result.url);
  return 'success';
}

/**
 * Sends a 6-digit code. The Supabase "Magic Link" email template must contain `{{ .Token }}`.
 */
export async function sendEmailOtp(email: string): Promise<void> {
  assertSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: emailSchema.parse(email.trim()),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  assertSupabase();
  const { error } = await supabase.auth.verifyOtp({
    email: emailSchema.parse(email.trim()),
    token: otpSchema.parse(token),
    type: 'email',
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  useAuthStore.setState({ devPreview: false });
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** __DEV__ escape hatch so screens can be browsed in Expo Go before Supabase exists. */
export function setDevPreview(enabled: boolean): void {
  if (!__DEV__) return;
  useAuthStore.setState({ devPreview: enabled });
}

// Mutation hooks (loading/error state for buttons) ------------------------------------------

export const useSignInWithGoogle = () => useMutation({ mutationFn: signInWithGoogle });
export const useSendEmailOtp = () => useMutation({ mutationFn: (email: string) => sendEmailOtp(email) });
export const useVerifyEmailOtp = () =>
  useMutation({ mutationFn: ({ email, token }: { email: string; token: string }) => verifyEmailOtp(email, token) });
export const useSignOut = () => useMutation({ mutationFn: signOut });
