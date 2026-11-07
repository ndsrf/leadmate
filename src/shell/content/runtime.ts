import { BASELINE_PACK } from './baseline.generated';
import { resolveContentBase } from './config';
import { resolvePack, type ResolvedPack } from './resolver';
import { ContentStore, type KeyValueStorage } from './store';
import { ContentUpdater } from './updater';
import { type ContentPack } from './validator';
import { setContentCatalogProvider } from '../../i18n/catalogProvider';

export interface RuntimeContent {
  channel: 'beta' | 'stable';
  isBaseline: boolean;
  contentVersion: number;
  pack: ContentPack;
  resolved: ResolvedPack;
}

export interface InitRuntimeOptions {
  channel?: 'beta' | 'stable';
  language?: string;
  store?: ContentStore;
  kvStorage?: KeyValueStorage;
  updater?: ContentUpdater;
  baselinePack?: ContentPack;
  isDev?: boolean;
  contentBase?: string;
  currentAppVersion?: string;
}

let activeContentSession: RuntimeContent | null = null;

/**
 * Returns the currently active in-memory content for the session.
 * Never changes mid-session during background updates.
 */
export function getActiveContent(): RuntimeContent {
  if (activeContentSession) {
    return activeContentSession;
  }
  // Fall back to default baseline
  const resolved = resolvePack(BASELINE_PACK, 'es');
  activeContentSession = {
    channel: 'stable',
    isBaseline: true,
    contentVersion: 1,
    pack: BASELINE_PACK,
    resolved,
  };
  return activeContentSession;
}

/**
 * Sets or overrides the active content in memory (e.g. for testing).
 */
export function setActiveContent(content: RuntimeContent | null): void {
  activeContentSession = content;
}

setContentCatalogProvider(() => getActiveContent().resolved.catalog);

/**
 * Initializes the active content at app start-up BEFORE content screens render.
 * 1. In __DEV__, checks and immediately activates the locally built beta pack.
 * 2. In production, applies any pending update staged by a previous session's background updater, and after the
 *    session is set up starts a background check that stages anything newer for the next launch.
 * 3. Loads the active pack from the ContentStore.
 * 4. Falls back to bundled BASELINE_PACK if no remote pack is installed or on corrupt cache.
 * 5. Resolves the pack into WorldDef[], LessonDef[], NodeDef[], MissionDef[] and catalog.
 * 6. Caches the resolved result in memory for the duration of the session.
 */
export async function initContentRuntime(options: InitRuntimeOptions = {}): Promise<RuntimeContent> {
  const isDev =
    options.isDev ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production');
  const channel = options.channel ?? (isDev ? 'beta' : 'stable');
  const language = options.language ?? 'es';
  const baseline = options.baselinePack ?? BASELINE_PACK;

  // 1. Apply any pending update staged from a previous session
  if (options.updater) {
    try {
      await options.updater.applyPendingUpdateIfAvailable(channel);
    } catch {
      // Ignore
    }
  }

  // In __DEV__, check and immediately activate locally built beta pack at start
  if (isDev && options.updater) {
    console.log('[content] start-up check: starting for', channel);
    try {
      const result = await options.updater.checkAndDownloadUpdate({
        channel,
        currentAppVersion: options.currentAppVersion ?? '1.0.0',
        contentBase: options.contentBase ?? resolveContentBase({ isDev: true }),
        immediateActivate: true,
      });
      if (!result.updated && result.reason !== 'up_to_date') {
        console.warn('[content] start-up update not applied:', channel, result.reason, result.error ?? '');
      } else {
        const installed = options.store ? (await options.store.getActivePointer(channel))?.contentVersion : undefined;
        console.log('[content] start-up check:', channel, result.reason, `remote=${result.remoteVersion ?? result.newVersion ?? '?'}`, `installed=${installed ?? 'none'}`);
      }
    } catch (err) {
      console.warn('[content] start-up update threw:', channel, err instanceof Error ? err.message : String(err));
    }
    // non-fatal: falls through to the stored pack, then the baseline
  }

  // 2. Try to load active pack from store
  let pack: ContentPack | null = null;
  let isBaseline = false;
  let contentVersion = 1;

  if (options.store) {
    pack = await options.store.loadActivePack(channel);
    if (pack) {
      const pointer = await options.store.getActivePointer(channel);
      contentVersion = pointer?.contentVersion ?? 1;
    }
  }

  // 3. Fall back to bundled baseline
  if (!pack) {
    pack = baseline;
    isBaseline = true;
    contentVersion = 1;
  }

  // 4. Resolve pack
  const resolved = resolvePack(pack, language);

  // 5. Freeze in memory for this session
  activeContentSession = {
    channel,
    isBaseline,
    contentVersion,
    pack,
    resolved,
  };

  // 6. Production: look for newer content in the background. Not awaited, so the first screen is never delayed, and
  // staged only (`immediateActivate` off): a complete pack is applied at the next launch, never mid-session.
  if (!isDev && options.updater) {
    void options.updater
      .checkAndDownloadUpdate({
        channel,
        currentAppVersion: options.currentAppVersion ?? '1.0.0',
        contentBase: options.contentBase ?? resolveContentBase({ isDev: false }),
        userLanguage: language,
        immediateActivate: false,
      })
      .then((result) => {
        if (!result.updated && result.reason !== 'up_to_date') {
          console.warn('[content] background update not applied:', channel, result.reason, result.error ?? '');
        }
      })
      .catch(() => {
        // Never an error for the user: the current content keeps working
      });
  }

  return activeContentSession;
}
