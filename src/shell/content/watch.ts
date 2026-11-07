import { existsSync, watch as fsWatch, type FSWatcher } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildPack, type BuildResult } from './build';

export interface WatchOptions {
  channel?: 'beta' | 'stable';
  packDir?: string;
  outDir?: string;
  debounceMs?: number;
  onRebuild?: (result: BuildResult | null, error?: Error) => void;
}

export interface WatchHandle {
  close: () => void;
}

/**
 * Watches a Content Pack directory and triggers a rebuild whenever files change.
 */
export function watchContent(options: WatchOptions = {}): WatchHandle {
  const channel = options.channel ?? 'beta';
  const packDir = options.packDir ? resolve(options.packDir) : resolve(process.cwd(), 'content', channel);
  const outDir = options.outDir ? resolve(options.outDir) : resolve(process.cwd(), 'dist', 'content', channel);
  const debounceMs = options.debounceMs ?? 200;

  if (!existsSync(packDir)) {
    throw new Error(`Directory to watch does not exist: ${packDir}`);
  }

  let debounceTimer: NodeJS.Timeout | null = null;
  let isBuilding = false;
  let pendingRebuild = false;

  const doBuild = () => {
    if (isBuilding) {
      pendingRebuild = true;
      return;
    }
    isBuilding = true;
    try {
      const result = buildPack({
        channel,
        packDir,
        outDir,
      });
      options.onRebuild?.(result);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      options.onRebuild?.(null, error);
    } finally {
      isBuilding = false;
      if (pendingRebuild) {
        pendingRebuild = false;
        doBuild();
      }
    }
  };

  const watcher: FSWatcher = fsWatch(packDir, { recursive: true }, (_eventType, filename) => {
    if (!filename) return;
    const clean = filename.toString();
    if (clean.startsWith('.') || clean.includes('/.') || clean.includes('\\.')) {
      return;
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      doBuild();
    }, debounceMs);
  });

  return {
    close: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      watcher.close();
    },
  };
}
