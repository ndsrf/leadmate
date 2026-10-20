import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Read at build time by Expo; unset in tests and in the browser demo, which then run local-only. */
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function isConfigured(url: string | undefined = URL, key: string | undefined = ANON_KEY): boolean {
  return Boolean(url && key);
}

let client: SupabaseClient | null | undefined;

/** The Supabase client with its session kept in AsyncStorage, or null when no backend is configured. */
export function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!isConfigured()) return (client = null);
  // loaded here so that a build without a backend never touches native storage at start
  const storage = require('@react-native-async-storage/async-storage').default;
  client = createClient(URL!, ANON_KEY!, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
  return client;
}
