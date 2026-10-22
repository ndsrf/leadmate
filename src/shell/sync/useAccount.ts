import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { DogRecord, KeyValueStore } from '../dogRecord';
import { supabaseAuth, type AuthApi } from './auth';
import { getClient } from './client';
import { supabaseConfigs, fetchLevelConfigs, loadConfigCache, type ConfigCache } from './configs';
import { supabaseRemote, type RemoteDog } from './remote';
import { shouldRemind, markReminded, countStage } from './remind';
import { cleanupBackup, loadBackup, loadSyncState, NEW_SYNC_STATE, saveBackup, saveSyncState, type Backup, type SyncState } from './state';
import { finishChoice, runSync, type Choice } from './sync';

const SAVE_DEBOUNCE_MS = 3000;

export interface Account {
  /** A backend is configured; without one there is nothing to sign in to. */
  configured: boolean;
  signedIn: boolean;
  auth: AuthApi | null;
  sync: SyncState;
  /** The account's Dogs when the user has to pick which Dog to keep. */
  choice: RemoteDog[] | null;
  chooseDog: (choice: Choice) => Promise<void>;
  /** The Dog the user did not keep, still recoverable. */
  backup: Backup | null;
  restoreBackup: () => void;
  /** The validated remote level configs, by id. */
  configs: ConfigCache;
  /** Registration reminder is due today. */
  remind: boolean;
  markReminded: () => void;
  countStage: () => void;
  /** Local data stays after deleting the account; the pairing with the deleted Dog does not. */
  forgetAccount: () => void;
  /** Detaches sync pairing and clears reminder counters on reset. */
  resetSync: () => void;
}

/**
 * Account state and local-first sync. Everything here is a no-op with no backend configured, and a failed
 * call never touches the local record (the next trigger tries again).
 */
export function useAccount(store: KeyValueStore, record: DogRecord | null, replace: (r: DogRecord) => void): Account {
  const client = useMemo(() => getClient(), []);
  const auth = useMemo(() => (client ? supabaseAuth(client) : null), [client]);
  const remote = useMemo(() => (client ? supabaseRemote(client) : null), [client]);
  const [signedIn, setSignedIn] = useState(false);
  const [sync, setSync] = useState<SyncState>(NEW_SYNC_STATE);
  const [choice, setChoice] = useState<RemoteDog[] | null>(null);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [configs, setConfigs] = useState<ConfigCache>({});

  const syncRef = useRef(sync);
  const recordRef = useRef(record);
  recordRef.current = record;
  const running = useRef(false);

  const persist = useCallback(
    (next: SyncState) => {
      syncRef.current = next;
      setSync(next);
      saveSyncState(store, next).catch(() => {});
    },
    [store],
  );

  useEffect(() => {
    let alive = true;
    const now = new Date();
    cleanupBackup(store, now)
      .then(() => loadBackup(store, now))
      .then((b) => alive && setBackup(b))
      .catch(() => {});
    loadSyncState(store).then((s) => {
      if (!alive) return;
      syncRef.current = s;
      setSync(s);
    });
    loadConfigCache(store).then((c) => alive && setConfigs(c));
    // fresh remote configs are fetched in the background; the cached ones are used meanwhile
    if (client) fetchLevelConfigs(supabaseConfigs(client), store).then((c) => alive && setConfigs(c));
    return () => {
      alive = false;
    };
  }, [store, client]);

  useEffect(() => (auth ? auth.watch(setSignedIn) : undefined), [auth]);

  const syncNow = useCallback(async () => {
    if (!remote || !recordRef.current || running.current) return;
    running.current = true;
    try {
      const result = await runSync({
        remote,
        getRecord: () => recordRef.current!,
        replaceRecord: (r) => {
          recordRef.current = r;
          replace(r);
        },
        state: syncRef.current,
        setState: persist,
      });
      if (result.outcome === 'needs-choice') setChoice(result.remoteDogs ?? null);
    } finally {
      running.current = false;
    }
  }, [remote, replace, persist]);

  // at start and on sign-in
  useEffect(() => {
    if (signedIn && record) syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, record === null, syncNow]);

  // on return to the foreground
  useEffect(() => {
    if (!signedIn) return;
    const sub = AppState.addEventListener('change', (state) => state === 'active' && syncNow());
    return () => sub.remove();
  }, [signedIn, syncNow]);

  // after saved changes, debounced
  const stamp = record?.updatedAt;
  useEffect(() => {
    if (!signedIn || !stamp) return;
    const timer = setTimeout(syncNow, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [signedIn, stamp, syncNow]);

  const chooseDog = useCallback(
    async (picked: Choice) => {
      const local = recordRef.current;
      const remoteDog = choice?.[0];
      if (!remote || !local || !remoteDog) return;
      try {
        const result = await finishChoice(remote, picked, local, remoteDog, new Date());
        await saveBackup(store, result.backup, result.backupFrom, new Date());
        setBackup(await loadBackup(store, new Date()));
        recordRef.current = result.record;
        replace(result.record);
        persist({ ...syncRef.current, dogId: result.dogId, paused: null });
        setChoice(null);
      } catch {
        // still asking; the user can try again
      }
    },
    [choice, remote, replace, persist, store],
  );

  const restoreBackup = useCallback(() => {
    if (!backup) return;
    // the recovered Dog is stamped as a new change so that it wins the next sync
    recordRef.current = backup.record;
    replace({ ...backup.record, updatedAt: new Date().toISOString() });
    setBackup(null);
    store.removeItem?.('leadmate.backup').catch(() => {});
  }, [backup, replace, store]);

  const remind = record !== null && client !== null && shouldRemind(record, sync, signedIn, new Date());

  return {
    configured: client !== null,
    signedIn,
    auth,
    sync,
    choice,
    chooseDog,
    backup,
    restoreBackup,
    configs,
    remind,
    // the reminder counts as given for today once it is shown, whatever the user does with it
    markReminded: () => persist(markReminded(syncRef.current, new Date())),
    countStage: () => persist(countStage(syncRef.current)),
    forgetAccount: () => persist({ ...syncRef.current, dogId: null, paused: null, lastSyncedAt: null }),
    resetSync: () => persist({ ...NEW_SYNC_STATE }),
  };
}
