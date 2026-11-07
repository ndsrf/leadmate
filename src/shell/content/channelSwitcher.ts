import { BASELINE_PACK } from './baseline.generated';
import { saveContentChannel, type ContentChannel } from './channelSetting';
import { hasRemoteContent } from './config';
import { resolvePack } from './resolver';
import { getActiveContent, setActiveContent, type RuntimeContent } from './runtime';
import { ContentStore, type KeyValueStorage } from './store';
import { ContentUpdater } from './updater';

export interface SwitchChannelOptions {
  channel: ContentChannel;
  currentAppVersion?: string;
  language?: string;
  store: ContentStore;
  updater: ContentUpdater;
  kvStorage?: KeyValueStorage;
  contentBase?: string;
}

export interface SwitchChannelResult {
  success: boolean;
  channel: ContentChannel;
  error?: string;
  offlineCached?: boolean;
}

/**
 * Switches the active content channel (e.g. from Stable to Beta or vice versa).
 *
 * 1. If target channel is cached locally, applies immediately (works offline).
 * 2. If target channel is not cached:
 *    - If no content base is configured, fails and reports remote content unavailable.
 *    - Fetches, verifies, validates, and activates the new pack.
 *    - On failure, reverts to previous content and reports error.
 *    - On success, updates in-memory content session and persists choice.
 */
export async function switchChannel(options: SwitchChannelOptions): Promise<SwitchChannelResult> {
  const { channel, store, updater, kvStorage, contentBase, currentAppVersion = '1.0.0', language = 'es' } = options;
  const current = getActiveContent();

  if (current.channel === channel) {
    return { success: true, channel };
  }

  const previousChannel = current.channel;

  // 1. Check if target channel is already cached locally
  const cachedPack = await store.loadActivePack(channel);
  if (cachedPack) {
    const pointer = await store.getActivePointer(channel);
    const resolved = resolvePack(cachedPack, language);
    const newSession: RuntimeContent = {
      channel,
      isBaseline: false,
      contentVersion: pointer?.contentVersion ?? 1,
      pack: cachedPack,
      resolved,
    };
    setActiveContent(newSession);
    if (kvStorage) {
      await saveContentChannel(channel, kvStorage);
    }
    return { success: true, channel, offlineCached: true };
  }

  // If target is stable and no remote pack is stored, use bundled baseline immediately
  if (channel === 'stable') {
    const resolved = resolvePack(BASELINE_PACK, language);
    const newSession: RuntimeContent = {
      channel: 'stable',
      isBaseline: true,
      contentVersion: 1,
      pack: BASELINE_PACK,
      resolved,
    };
    setActiveContent(newSession);
    if (kvStorage) {
      await saveContentChannel('stable', kvStorage);
    }
    return { success: true, channel: 'stable', offlineCached: true };
  }

  // 2. Not cached: check if remote content is configured
  if (!hasRemoteContent(contentBase)) {
    return {
      success: false,
      channel: previousChannel,
      error: 'remote_unavailable',
    };
  }

  // 3. Online fetch, verify, validate and immediate activation
  const updateResult = await updater.checkAndDownloadUpdate({
    channel,
    currentAppVersion,
    contentBase,
    userLanguage: language,
    immediateActivate: true,
  });

  if (!updateResult.updated && updateResult.reason !== 'up_to_date') {
    // Failure: keep current content and report
    return {
      success: false,
      channel: previousChannel,
      error: [updateResult.reason, updateResult.error].filter(Boolean).join(': ') || 'download_failed',
    };
  }

  // 4. Load the newly activated pack
  const newPack = await store.loadActivePack(channel);
  if (!newPack) {
    return {
      success: false,
      channel: previousChannel,
      error: 'activation_failed',
    };
  }

  const pointer = await store.getActivePointer(channel);
  const resolved = resolvePack(newPack, language);
  const newSession: RuntimeContent = {
    channel,
    isBaseline: false,
    contentVersion: pointer?.contentVersion ?? 1,
    pack: newPack,
    resolved,
  };

  setActiveContent(newSession);
  if (kvStorage) {
    await saveContentChannel(channel, kvStorage);
  }

  return { success: true, channel };
}
