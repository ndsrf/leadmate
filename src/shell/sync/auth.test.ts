import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAuth, validateCredentials } from './auth';

describe('credentials', () => {
  it('checks the email and the password length', () => {
    expect(validateCredentials('bad', 'longenough')).toBe('invalid-email');
    expect(validateCredentials('a@b.co', 'short')).toBe('weak-password');
    expect(validateCredentials('a@b.co', 'longenough')).toBeNull();
    expect(validateCredentials('a@b.co', null)).toBeNull();
  });
});

function fakeClient(over: { invoke?: () => Promise<{ error: unknown }>; signIn?: () => Promise<{ error: unknown }> } = {}) {
  const calls: string[] = [];
  const client = {
    auth: {
      signUp: async () => (calls.push('signUp'), { error: null }),
      signInWithPassword: over.signIn ?? (async () => (calls.push('signIn'), { error: null })),
      signOut: async (o?: { scope?: string }) => (calls.push(`signOut:${o?.scope ?? 'global'}`), { error: null }),
      resetPasswordForEmail: async () => (calls.push('reset'), { error: null }),
    },
    functions: { invoke: over.invoke ?? (async (name: string) => (calls.push(`invoke:${name}`), { error: null })) },
  };
  return { calls, api: supabaseAuth(client as unknown as SupabaseClient) };
}

describe('supabaseAuth', () => {
  it('signs up, logs in, logs out and resets with email and password only', async () => {
    const { api, calls } = fakeClient();
    expect(await api.signUp('a@b.co', 'longenough')).toEqual({ ok: true });
    expect(await api.signIn('a@b.co', 'longenough')).toEqual({ ok: true });
    expect(await api.resetPassword('a@b.co')).toEqual({ ok: true });
    expect(await api.signOut()).toEqual({ ok: true });
    expect(calls).toEqual(['signUp', 'signIn', 'reset', 'signOut:global']);
  });

  it('deletes the account through the Edge Function and then signs out locally', async () => {
    const { api, calls } = fakeClient();
    expect(await api.deleteAccount()).toEqual({ ok: true });
    expect(calls).toEqual(['invoke:delete-account', 'signOut:local']);
  });

  it('stays signed in when the deletion fails', async () => {
    const { api, calls } = fakeClient({ invoke: async () => ({ error: { message: 'boom' } }) });
    expect(await api.deleteAccount()).toEqual({ ok: false, error: 'unknown' });
    expect(calls).toEqual([]);
  });

  it('maps server errors to the ones the UI explains', async () => {
    const wrong = fakeClient({ signIn: async () => ({ error: { message: 'Invalid login credentials' } }) });
    expect(await wrong.api.signIn('a@b.co', 'x')).toEqual({ ok: false, error: 'wrong-credentials' });
    const offline = fakeClient({ signIn: async () => Promise.reject(new TypeError('Failed to fetch')) });
    expect(await offline.api.signIn('a@b.co', 'x')).toEqual({ ok: false, error: 'network' });
  });
});
