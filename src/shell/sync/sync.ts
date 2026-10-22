import { migrateRecord, touch, type DogRecord } from '../dogRecord';
import { dayDiff, localDateString } from '../streak';
import { resolve } from './merge';
import type { Remote, RemoteDog, RemoteUser } from './remote';
import { type SyncState } from './state';

/** An account may sync unverified for this many days after sign-up. */
export const VERIFY_GRACE_DAYS = 7;

export function newDogId(): string {
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[Math.floor(Math.random() * 4)]}${hex(3)}-${hex(12)}`;
}

/** True once the grace period of an unverified account is over (day 7 still syncs, day 8 does not). */
export function mustVerify(user: RemoteUser, now: Date): boolean {
  return !user.emailVerified && dayDiff(localDateString(new Date(user.createdAt)), localDateString(now)) > VERIFY_GRACE_DAYS;
}

/** Structural equality of two JSON-like values, independent of key order. */
export function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((k) => sameJson((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

export type SyncOutcome = 'skipped' | 'signed-out' | 'paused' | 'offline' | 'needs-choice' | 'synced';

export interface SyncDeps {
  /** Null when no backend is configured: every sync is a no-op. */
  remote: Remote | null;
  getRecord: () => DogRecord;
  /** Replaces the local record with what sync resolved, without stamping a new `updatedAt`. */
  replaceRecord: (record: DogRecord) => void;
  state: SyncState;
  setState: (state: SyncState) => void;
  now?: () => Date;
}

export interface SyncResult {
  outcome: SyncOutcome;
  /** The account's Dogs when the user has to choose which to keep. */
  remoteDogs?: RemoteDog[];
}

/** Whether a device that just signed in can upload silently or has to ask: an account that has a Dog asks. */
export function migrateOnRegister(_local: DogRecord, remoteDogs: readonly RemoteDog[]): 'upload' | 'choose' {
  return remoteDogs.length === 0 ? 'upload' : 'choose';
}

/** A device that has not been used yet: the welcome screen is still showing, so it holds nothing worth keeping. A device that was paired before is never one. */
export function isFirstRun(record: DogRecord): boolean {
  return record.onboarding.step === 'welcome';
}

const toRemote = (dogId: string, record: DogRecord): RemoteDog => ({ dogId, record, updatedAt: record.updatedAt });

/**
 * One sync pass: pull, resolve, write locally if changed, push if the account is behind. A failed network call leaves
 * local state untouched; the next trigger tries again. The first pass on a device with no paired Dog never merges: it
 * uploads to an empty account and otherwise reports that the user must choose.
 */
export async function runSync(deps: SyncDeps): Promise<SyncResult> {
  const { remote, state } = deps;
  const now = (deps.now ?? (() => new Date()))();
  if (!remote) return { outcome: 'skipped' };
  try {
    const user = await remote.user();
    if (!user) return { outcome: 'signed-out' };
    if (mustVerify(user, now)) {
      if (state.paused !== 'verify') deps.setState({ ...state, paused: 'verify' });
      return { outcome: 'paused' };
    }
    const remoteDogs = await remote.fetchDogs();
    const local = deps.getRecord();
    const paired = state.dogId ? remoteDogs.find((d) => d.dogId === state.dogId) : undefined;
    let next: SyncState = { ...state, paused: null };

    if (!paired) {
      // an account that already has a Dog is never merged or overwritten without asking, even if this device was paired before
      if (migrateOnRegister(local, remoteDogs) === 'choose') {
        if (!isFirstRun(local) || state.dogId || remoteDogs.length > 1) return { outcome: 'needs-choice', remoteDogs };
        // logging in from the welcome screen: the account's Dog replaces the empty one and its own step applies
        const [theirs] = remoteDogs;
        deps.replaceRecord(migrateRecord(theirs.record));
        deps.setState({ ...next, dogId: theirs.dogId, lastSyncedAt: now.toISOString() });
        return { outcome: 'synced' };
      }
      const dogId = state.dogId ?? newDogId();
      await remote.upsertDog(toRemote(dogId, local));
      next = { ...next, dogId, lastSyncedAt: now.toISOString() };
    } else {
      const theirs = migrateRecord(paired.record);
      let merged = resolve(local, theirs);
      if (!sameJson(merged, theirs) && Date.parse(theirs.updatedAt) > Date.parse(local.updatedAt)) merged = touch(merged, now);
      if (!sameJson(merged, local)) deps.replaceRecord(merged);
      if (!sameJson(merged, theirs)) await remote.upsertDog(toRemote(paired.dogId, merged));
      next = { ...next, lastSyncedAt: now.toISOString() };
    }
    deps.setState(next);
    return { outcome: 'synced' };
  } catch {
    return { outcome: 'offline' };
  }
}

export type Choice = 'cloud' | 'local';

/** The result of choosing which Dog to keep: the record to use now and the one to back up for 30 days. */
export function applyChoice(choice: Choice, local: DogRecord, remoteDog: RemoteDog, now: Date): { record: DogRecord; backup: DogRecord; backupFrom: 'local' | 'cloud'; dogId: string } {
  const theirs = migrateRecord(remoteDog.record);
  // keeping the device's Dog must win over the cloud copy, so it is stamped newer than it
  if (choice === 'local') return { record: touch(local, new Date(Math.max(now.getTime(), Date.parse(theirs.updatedAt) + 1))), backup: theirs, backupFrom: 'cloud', dogId: remoteDog.dogId };
  return { record: theirs, backup: local, backupFrom: 'local', dogId: remoteDog.dogId };
}

/**
 * Carries out the choice against the account. Keeping the device's Dog overwrites the cloud copy right away (a later
 * merge would bring the discarded Dog's diary and Nodes back); keeping the cloud Dog only needs the local replace.
 */
export async function finishChoice(remote: Remote, choice: Choice, local: DogRecord, remoteDog: RemoteDog, now: Date): Promise<ReturnType<typeof applyChoice>> {
  const result = applyChoice(choice, local, remoteDog, now);
  if (choice === 'local') await remote.upsertDog(toRemote(result.dogId, result.record));
  return result;
}

export interface DogSummary {
  streak: number;
  nodes: number;
}

/** One line of facts shown for each side of the choice. */
export function summarize(record: DogRecord): DogSummary {
  return { streak: record.streak.current, nodes: record.completedNodes.length };
}
