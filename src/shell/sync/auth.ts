import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthError = 'invalid-email' | 'weak-password' | 'wrong-credentials' | 'exists' | 'network' | 'unknown';
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

export const MIN_PASSWORD = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks what can be checked before asking the server. */
export function validateCredentials(email: string, password: string | null): AuthError | null {
  if (!EMAIL.test(email.trim())) return 'invalid-email';
  if (password !== null && password.length < MIN_PASSWORD) return 'weak-password';
  return null;
}

function mapError(error: { message?: string; status?: number; code?: string } | null): AuthResult {
  if (!error) return { ok: true };
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  if (text.includes('already') || text.includes('registered')) return { ok: false, error: 'exists' };
  if (text.includes('invalid login') || text.includes('invalid_credentials') || text.includes('credentials')) return { ok: false, error: 'wrong-credentials' };
  if (text.includes('password')) return { ok: false, error: 'weak-password' };
  if (text.includes('fetch') || text.includes('network')) return { ok: false, error: 'network' };
  return { ok: false, error: 'unknown' };
}

const guard = async (run: () => Promise<{ error: { message?: string; status?: number; code?: string } | null }>): Promise<AuthResult> => {
  try {
    return mapError((await run()).error);
  } catch {
    return { ok: false, error: 'network' };
  }
};

/** Email and password only: sign up, log in, log out, reset, and in-app account deletion. */
export interface AuthApi {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  /** Deletes the account and its cloud rows through the `delete-account` function, then signs out. Local data stays. */
  deleteAccount(): Promise<AuthResult>;
  /** Calls back with whether a session exists now and on every change; returns the unsubscribe. */
  watch(onChange: (signedIn: boolean) => void): () => void;
}

export function supabaseAuth(client: SupabaseClient): AuthApi {
  return {
    signUp: (email, password) => guard(() => client.auth.signUp({ email: email.trim(), password })),
    signIn: (email, password) => guard(() => client.auth.signInWithPassword({ email: email.trim(), password })),
    signOut: () => guard(() => client.auth.signOut()),
    resetPassword: (email) => guard(() => client.auth.resetPasswordForEmail(email.trim())),
    async deleteAccount() {
      const deleted = await guard(() => client.functions.invoke('delete-account'));
      if (!deleted.ok) return deleted;
      // the account is gone, so only the local session is left to clear
      return guard(() => client.auth.signOut({ scope: 'local' }));
    },
    watch(onChange) {
      client.auth.getSession().then(({ data }) => onChange(Boolean(data.session)));
      const { data } = client.auth.onAuthStateChange((_event, session) => onChange(Boolean(session)));
      return () => data.subscription.unsubscribe();
    },
  };
}
