import { type ContentManifest } from './build';
import { channelFileUrl, channelLatestUrl, channelManifestUrl, hasRemoteContent } from './config';
import { endContentProgress, reportContentProgress } from './progress';
import { parseYaml } from './schema';
import { baselineFillFor, ContentStore, DEFAULT_BASELINE, loadPackFromStorage, type BaselineSource, type FileStorage, type KeyValueStorage } from './store';
import { validatePack } from './validator';

/** Lowercased file extension including the dot (RN-safe replacement for node:path extname). */
function extname(p: string): string {
  const base = p.slice(p.lastIndexOf('/') + 1);
  const i = base.lastIndexOf('.');
  return i > 0 ? base.slice(i) : '';
}

export interface HttpResponse {
  status: number;
  text(): Promise<string>;
  binary(): Promise<Uint8Array>;
}

export interface HttpFetchOptions {
  timeoutMs?: number;
  /** `fresh`: never answer from a cache (used for the version pointer, which must always be current). */
  fresh?: boolean;
  /** Aborts the request when the signal fires (used to cancel in-flight downloads of a failed pack). */
  signal?: AbortSignal;
}

export interface HttpFetcher {
  fetch(url: string, options?: HttpFetchOptions): Promise<HttpResponse>;
}

/** How many files of one pack download at the same time. Tune from measurements. */
export const MAX_CONCURRENT_DOWNLOADS = 6;

/**
 * Standard fetch-based HttpFetcher using AbortSignal for timeouts.
 */
export class DefaultHttpFetcher implements HttpFetcher {
  async fetch(url: string, options?: HttpFetchOptions): Promise<HttpResponse> {
    const timeout = options?.timeoutMs ?? 5000;
    const controller = new AbortController();
    const outer = options?.signal;
    if (outer) {
      if (outer.aborted) controller.abort();
      else outer.addEventListener('abort', () => controller.abort(), { once: true });
    }
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      // a fresh read skips every cache on the way: the request says so, and a unique query makes the address new
      const target = options?.fresh ? `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}` : url;
      const res = await globalThis.fetch(target, {
        signal: controller.signal,
        ...(options?.fresh ? { headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } } : {}),
      });
      clearTimeout(id);
      return {
        status: res.status,
        text: async () => res.text(),
        binary: async () => new Uint8Array(await res.arrayBuffer()),
      };
    } catch (err: unknown) {
      clearTimeout(id);
      throw err;
    }
  }
}

export interface LaunchUpdateOptions {
  channel: 'beta' | 'stable';
  currentAppVersion: string;
  userLanguage?: string;
  currentWorldId?: string;
  nextWorldId?: string;
  contentBase?: string;
  timeoutMs?: number;
  immediateActivate?: boolean;
}

export interface LaunchUpdateResult {
  updated: boolean;
  reason:
    | 'up_to_date'
    | 'unreachable'
    | 'incompatible'
    | 'no_remote'
    | 'validation_failed'
    | 'hash_mismatch'
    | 'activation_failed'
    | 'staged_for_next_launch'
    | 'activated';
  newVersion?: number;
  /** The version the channel's pointer announced, when it was read (for logs). */
  remoteVersion?: number;
  filesDownloaded?: number;
  error?: string;
}

export function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export class ContentUpdater {
  constructor(
    private store: ContentStore,
    private fileStorage: FileStorage,
    private kvStorage: KeyValueStorage,
    private http: HttpFetcher = new DefaultHttpFetcher(),
    /** The bundled stable baseline (pack + file hashes). Stable only; Beta never uses it. */
    private baseline: BaselineSource = DEFAULT_BASELINE
  ) {}

  private getPendingKey(channel: 'beta' | 'stable'): string {
    return `@leadmate:content_pending_${channel}`;
  }

  async getPendingUpdate(channel: 'beta' | 'stable'): Promise<{ version: number; manifest: ContentManifest } | null> {
    const raw = await this.kvStorage.getItem(this.getPendingKey(channel));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async clearPendingUpdate(channel: 'beta' | 'stable'): Promise<void> {
    await this.kvStorage.removeItem(this.getPendingKey(channel));
  }

  /**
   * Applies any pending staged update. Called during app startup before screens render.
   */
  async applyPendingUpdateIfAvailable(channel: 'beta' | 'stable'): Promise<boolean> {
    const pending = await this.getPendingUpdate(channel);
    if (!pending) return false;

    try {
      await this.store.activateStaging(channel, pending.version, pending.manifest, this.baseline);
      await this.clearPendingUpdate(channel);
      return true;
    } catch {
      await this.clearPendingUpdate(channel);
      return false;
    }
  }

  /**
   * Checks for new content on the channel, downloads diffs, validates in staging,
   * and either stages for next launch or activates immediately.
   */
  /** The update that last started, so the next one waits for it (see `checkAndDownloadUpdate`). */
  private queue: Promise<unknown> = Promise.resolve();

  async checkAndDownloadUpdate(options: LaunchUpdateOptions): Promise<LaunchUpdateResult> {
    // One update at a time: two at once (the start-up check and a channel switch, say) share one staging folder, and
    // whichever finishes first moves or deletes it under the other, which then fails reading files it just wrote.
    // The second one runs after the first and normally finds nothing new to download.
    const run = this.queue.then(async () => {
      try {
        return await this.runUpdate(options);
      } finally {
        endContentProgress();
      }
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async runUpdate(options: LaunchUpdateOptions): Promise<LaunchUpdateResult> {
    const { channel, currentAppVersion, contentBase, timeoutMs = 5000, userLanguage = 'es' } = options;

    if (!hasRemoteContent(contentBase)) {
      return { updated: false, reason: 'no_remote' };
    }

    // 1. Fetch latest.json pointer
    const latestUrl = channelLatestUrl(channel, contentBase);
    if (!latestUrl) {
      return { updated: false, reason: 'no_remote' };
    }

    let latestText: string;
    try {
      const res = await this.http.fetch(latestUrl, { timeoutMs, fresh: true });
      if (res.status !== 200) {
        return { updated: false, reason: 'unreachable' };
      }
      latestText = await res.text();
    } catch {
      // Host unreachable or timed out
      return { updated: false, reason: 'unreachable' };
    }

    let latestJson: any;
    try {
      latestJson = JSON.parse(latestText);
    } catch {
      return { updated: false, reason: 'unreachable' };
    }

    const { contentVersion, formatVersion, minAppVersion, manifestPath } = latestJson;
    if (typeof contentVersion !== 'number' || !manifestPath) {
      return { updated: false, reason: 'unreachable' };
    }

    // 2. Compatibility check:
    // Format version must be supported (formatVersion <= 1)
    if (typeof formatVersion === 'number' && formatVersion > 1) {
      return { updated: false, reason: 'incompatible' };
    }
    // minAppVersion check: app version must be >= minAppVersion
    if (minAppVersion && compareSemver(currentAppVersion, minAppVersion) < 0) {
      return { updated: false, reason: 'incompatible' };
    }

    // 3. Check against installed version
    const activePointer = await this.store.getActivePointer(channel);
    const baselineVersion = channel === 'stable' ? this.baseline.pack.pack.contentVersion : undefined;
    const installedVersion = Math.max(activePointer?.contentVersion ?? 0, baselineVersion ?? 0);
    if (installedVersion >= contentVersion) {
      return { updated: false, reason: 'up_to_date', remoteVersion: contentVersion };
    }

    // 4. Fetch manifest
    const manifestUrl = channelManifestUrl(channel, manifestPath, contentBase);
    if (!manifestUrl) {
      return { updated: false, reason: 'unreachable' };
    }

    let manifestText: string;
    try {
      const mRes = await this.http.fetch(manifestUrl, { timeoutMs });
      if (mRes.status !== 200) {
        return { updated: false, reason: 'unreachable' };
      }
      manifestText = await mRes.text();
    } catch {
      return { updated: false, reason: 'unreachable' };
    }

    let manifest: ContentManifest;
    try {
      manifest = JSON.parse(manifestText);
    } catch {
      return { updated: false, reason: 'unreachable' };
    }

    // Double check manifest compatibility
    if (manifest.formatVersion > 1 || compareSemver(currentAppVersion, manifest.minAppVersion) < 0) {
      return { updated: false, reason: 'incompatible' };
    }

    // 5. Diff by hash against the stored copy: the installed pack's files, plus (Stable only) the bundled baseline
    // for any file the installed pack lacks. A first-install pack holds only downloaded files, so the baseline is
    // what the rest is compared with.
    const baselineHashes = channel === 'stable' ? this.baseline.hashes : undefined;
    const activeFiles = activePointer?.manifest?.files ?? {};
    const activeDir = this.store.getActiveDir(channel);
    const stagingDir = this.store.getStagingDir(channel, contentVersion);

    // Group files by priority:
    // A: Structure & text (eager)
    // B: Current World media
    // C: Next World media
    // D: Rest of media
    const allFileEntries = Object.entries(manifest.files);

    const isStructureOrText = (p: string) => {
      if (p === 'pack.yaml') return true;
      if (p.startsWith('worlds/')) return true;
      if (p.endsWith('lesson.yaml') || p.endsWith('node.yaml') || p.endsWith('mission.yaml')) return true;
      if (p.endsWith('/es.md') || p.endsWith(`/${userLanguage}.md`)) return true;
      return false;
    };

    const isNonRelevantText = (p: string) => {
      // Markdown in a language other than 'es' and userLanguage
      if (p.endsWith('.md')) {
        const lang = p.split('/').pop()?.replace('.md', '');
        if (lang && lang !== 'es' && lang !== userLanguage) {
          return true;
        }
      }
      return false;
    };

    // Sort files to download
    const toDownload: Array<{ path: string; sha256: string; size: number }> = [];
    let filesDownloaded = 0;

    for (const [relPath, fileInfo] of allFileEntries) {
      if (isNonRelevantText(relPath)) {
        // Skip non-selected language text in eager download
        continue;
      }

      const inActive = !!activePointer && (await this.fileStorage.exists(`${activeDir}/${relPath}`));
      if (inActive && activeFiles[relPath]?.sha256 === fileInfo.sha256) {
        // Unchanged from the installed pack: copy directly from active to staging
        const existingData = await this.fileStorage.readAsBinary(`${activeDir}/${relPath}`);
        await this.store.saveFileToStaging(channel, contentVersion, relPath, existingData, fileInfo.sha256);
      } else if (
        !inActive &&
        !activePointer &&
        baselineHashes?.[relPath]?.toLowerCase() === fileInfo.sha256.toLowerCase()
      ) {
        // First install: identical to the baseline, so not downloaded and not staged; the baseline supplies it.
      } else {
        toDownload.push({ path: relPath, sha256: fileInfo.sha256, size: fileInfo.size });
      }
    }

    // Prioritize downloads: structure & text first, then current/next world media, then rest
    const isCurrentWorldMedia = (p: string) => options.currentWorldId && p.includes(options.currentWorldId);
    const isNextWorldMedia = (p: string) => options.nextWorldId && p.includes(options.nextWorldId);

    toDownload.sort((a, b) => {
      const aStruct = isStructureOrText(a.path);
      const bStruct = isStructureOrText(b.path);
      if (aStruct && !bStruct) return -1;
      if (!aStruct && bStruct) return 1;

      const aCur = isCurrentWorldMedia(a.path);
      const bCur = isCurrentWorldMedia(b.path);
      if (aCur && !bCur) return -1;
      if (!aCur && bCur) return 1;

      const aNext = isNextWorldMedia(a.path);
      const bNext = isNextWorldMedia(b.path);
      if (aNext && !bNext) return -1;
      if (!aNext && bNext) return 1;

      return a.path.localeCompare(b.path);
    });

    // 6. Download files into staging, a few at a time. Requests start in priority order; on the first failure no new
    // request starts, in-flight ones are cancelled where the platform allows, and nothing they return is staged.
    if (toDownload.length > 0) reportContentProgress(0, toDownload.length);
    const controller = new AbortController();
    let failure: LaunchUpdateResult | null = null;
    let next = 0;

    const fail = (result: LaunchUpdateResult) => {
      if (!failure) {
        failure = result;
        controller.abort();
      }
    };

    const downloadOne = async (item: { path: string; sha256: string }) => {
      const ext = extname(item.path).toLowerCase();
      const fileUrl = channelFileUrl(channel, `files/${item.sha256}${ext}`, contentBase);
      if (!fileUrl) return fail({ updated: false, reason: 'unreachable' });
      try {
        const res = await this.http.fetch(fileUrl, { timeoutMs, signal: controller.signal });
        if (res.status !== 200) return fail({ updated: false, reason: 'unreachable' });
        const data = await res.binary();
        if (failure) return; // another file failed while this one was in flight: never stage it
        await this.store.saveFileToStaging(channel, contentVersion, item.path, data, item.sha256);
        if (failure) return;
        filesDownloaded++;
        reportContentProgress(filesDownloaded, toDownload.length);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Hash mismatch')) fail({ updated: false, reason: 'hash_mismatch', error: msg });
        else fail({ updated: false, reason: 'unreachable', error: msg });
      }
    };

    const worker = async () => {
      while (!failure && next < toDownload.length) {
        await downloadOne(toDownload[next++]);
      }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_DOWNLOADS, toDownload.length) }, worker));

    if (failure) {
      // The partial pack is discarded; the previous pack stays active
      try {
        await this.fileStorage.deleteDirectory(stagingDir);
      } catch {
        // Non-fatal
      }
      return failure;
    }

    // 7. In-app validatePack before activation
    try {
      const stagingPack = await loadPackFromStorage(
        this.fileStorage,
        stagingDir,
        channel === 'stable' ? baselineFillFor(this.baseline, manifest) : undefined
      );
      const report = validatePack(stagingPack);
      if (!report.valid) {
        // Discard staging
        await this.fileStorage.deleteDirectory(stagingDir);
        return {
          updated: false,
          reason: 'validation_failed',
          error: report.errors.map((e) => e.message).join('; '),
        };
      }
    } catch (err: unknown) {
      await this.fileStorage.deleteDirectory(stagingDir);
      return {
        updated: false,
        reason: 'validation_failed',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // 8. Activation or Staging for next launch
    if (options.immediateActivate) {
      try {
        await this.store.activateStaging(channel, contentVersion, manifest, this.baseline);
      } catch (err: unknown) {
        return { updated: false, reason: 'activation_failed', error: err instanceof Error ? err.message : String(err) };
      }
      return {
        updated: true,
        reason: 'activated',
        newVersion: contentVersion,
        filesDownloaded,
      };
    } else {
      // Session stability: save pending pointer for next launch
      await this.kvStorage.setItem(
        this.getPendingKey(channel),
        JSON.stringify({ version: contentVersion, manifest })
      );
      return {
        updated: true,
        reason: 'staged_for_next_launch',
        newVersion: contentVersion,
        filesDownloaded,
      };
    }
  }
}
