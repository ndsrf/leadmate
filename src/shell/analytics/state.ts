import type { KeyValueStore, DogRecord } from '../dogRecord';

export const ANALYTICS_STATE_KEY = 'leadmate.analytics';

/**
 * The single constant setting the out-of-the-box usage analytics default.
 * Opt-out by default (ADR 0031): users who never touch the switch run with analytics on.
 * If legal review asks for opt-in, flipping this constant to false flips every user
 * with choice: null without requiring a data migration.
 */
export const DEFAULT_ENABLED = true;

export type AnalyticsChoice = 'on' | 'off' | null;

export interface AnalyticsState {
  installId: string;
  installedAt: string;
  choice: AnalyticsChoice;
  funnelDoneOnce: boolean;
  funnelOpen: boolean;
  upgradedInstall: boolean;
  /** App Sessions started on this install; 0 before the first `session_started`. Old saved states load with 0. */
  sessionCount: number;
}

export function isEnabled(
  state: { choice: AnalyticsChoice },
  defaultEnabled: boolean = DEFAULT_ENABLED
): boolean {
  if (state.choice === 'on') return true;
  if (state.choice === 'off') return false;
  return defaultEnabled;
}

export function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function readAnalyticsState(raw: unknown): AnalyticsState | null {
  if (!raw) return null;
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const r = parsed as Record<string, unknown>;
  if (typeof r.installId !== 'string' || !r.installId) {
    return null;
  }
  if (typeof r.installedAt !== 'string' && typeof r.installedAt !== 'number') {
    return null;
  }

  const choice: AnalyticsChoice =
    r.choice === 'on' || r.choice === 'off' || r.choice === null ? r.choice : null;

  return {
    installId: r.installId,
    installedAt: typeof r.installedAt === 'string' ? r.installedAt : new Date(r.installedAt).toISOString(),
    choice,
    funnelDoneOnce: Boolean(r.funnelDoneOnce),
    funnelOpen: Boolean(r.funnelOpen),
    upgradedInstall: Boolean(r.upgradedInstall),
    sessionCount:
      typeof r.sessionCount === 'number' && Number.isFinite(r.sessionCount) && r.sessionCount > 0
        ? Math.floor(r.sessionCount)
        : 0,
  };
}

export async function loadAnalyticsState(
  store: KeyValueStore,
  newId: () => string = generateUuidV4,
  now: Date | number = new Date(),
  record?: DogRecord | null
): Promise<AnalyticsState> {
  let readFailed = false;
  try {
    const raw = await store.getItem(ANALYTICS_STATE_KEY);
    const existing = readAnalyticsState(raw);
    if (existing) {
      return existing;
    }
  } catch {
    // Storage read failure: proceed to create and return fresh in-memory state without writing back
    readFailed = true;
  }

  const installId = newId();
  const installedAtDate = now instanceof Date ? now : new Date(now);
  const installedAt = installedAtDate.toISOString();

  // If created on a device whose Dog had already left the welcome step, mark as upgraded
  const upgradedInstall = Boolean(
    record && record.onboarding && record.onboarding.step && record.onboarding.step !== 'welcome'
  );

  const fresh: AnalyticsState = {
    installId,
    installedAt,
    choice: null,
    funnelDoneOnce: false,
    funnelOpen: false,
    upgradedInstall,
    sessionCount: 0,
  };

  if (!readFailed) {
    try {
      await store.setItem(ANALYTICS_STATE_KEY, JSON.stringify(fresh));
    } catch {
      // Storage write failure: return in-memory state without throwing
    }
  }

  return fresh;
}

export async function saveAnalyticsState(
  store: KeyValueStore,
  state: AnalyticsState
): Promise<void> {
  try {
    await store.setItem(ANALYTICS_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage write failure: swallow to never block or break caller
  }
}
