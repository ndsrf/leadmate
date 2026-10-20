import type { SupabaseClient } from '@supabase/supabase-js';

/** A Dog row as the account stores it; `record` is untrusted until it goes through `migrateRecord`. */
export interface RemoteDog {
  dogId: string;
  record: unknown;
  updatedAt: string;
}

/** The signed-in user, as far as sync needs to know. */
export interface RemoteUser {
  id: string;
  createdAt: string;
  emailVerified: boolean;
}

/** What sync needs from the backend; Supabase implements it, tests use a fake. */
export interface Remote {
  user(): Promise<RemoteUser | null>;
  fetchDogs(): Promise<RemoteDog[]>;
  upsertDog(dog: RemoteDog): Promise<void>;
}

/** The Supabase-backed `Remote`: one `dogs` row per Dog, protected by row-level security. */
export function supabaseRemote(client: SupabaseClient): Remote {
  return {
    async user() {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) return null;
      return { id: data.user.id, createdAt: data.user.created_at, emailVerified: Boolean(data.user.email_confirmed_at) };
    },
    async fetchDogs() {
      const { data, error } = await client.from('dogs').select('dog_id, record, updated_at');
      if (error) throw error;
      return (data ?? []).map((row) => ({ dogId: row.dog_id as string, record: row.record, updatedAt: row.updated_at as string }));
    },
    async upsertDog(dog) {
      const { data } = await client.auth.getUser();
      if (!data.user) throw new Error('not signed in');
      const { error } = await client.from('dogs').upsert({ user_id: data.user.id, dog_id: dog.dogId, record: dog.record, updated_at: dog.updatedAt });
      if (error) throw error;
    },
  };
}
