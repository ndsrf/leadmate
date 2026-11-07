import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { loadContentChannel, type ContentChannel } from './channelSetting';
import { switchChannel, type SwitchChannelResult } from './channelSwitcher';
import { hasRemoteContent, resolveContentBase } from './config';
import { getActiveContent, initContentRuntime, type RuntimeContent } from './runtime';
import { ContentStore, type FileStorage, type KeyValueStorage } from './store';
import { ContentUpdater } from './updater';

export const asyncStorageKeyValue: KeyValueStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export class MemoryFileStorage implements FileStorage {
  private files = new Map<string, Uint8Array>();
  private dirs = new Set<string>();

  private norm(p: string): string {
    return p.replace(/\/+/g, '/').replace(/\/$/, '');
  }

  async readAsString(path: string): Promise<string> {
    const data = this.files.get(this.norm(path));
    if (!data) throw new Error(`File not found: ${path}`);
    return new TextDecoder().decode(data);
  }

  async writeAsString(path: string, contents: string): Promise<void> {
    this.files.set(this.norm(path), new TextEncoder().encode(contents));
  }

  async readAsBinary(path: string): Promise<Uint8Array> {
    const data = this.files.get(this.norm(path));
    if (!data) throw new Error(`File not found: ${path}`);
    return data;
  }

  async writeAsBinary(path: string, data: Uint8Array): Promise<void> {
    this.files.set(this.norm(path), data);
  }

  async exists(path: string): Promise<boolean> {
    const n = this.norm(path);
    return this.files.has(n) || this.dirs.has(n);
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(this.norm(path));
  }

  async deleteDirectory(path: string): Promise<void> {
    const prefix = `${this.norm(path)}/`;
    for (const k of [...this.files.keys()]) {
      if (k.startsWith(prefix) || k === this.norm(path)) this.files.delete(k);
    }
    for (const d of [...this.dirs]) {
      if (d.startsWith(prefix) || d === this.norm(path)) this.dirs.delete(d);
    }
  }

  async makeDirectory(path: string): Promise<void> {
    const parts = this.norm(path).split('/');
    for (let i = 1; i <= parts.length; i++) this.dirs.add(parts.slice(0, i).join('/'));
  }

  async listDirectory(path: string): Promise<string[]> {
    const normDir = this.norm(path);
    const prefix = `${normDir}/`;
    const names = new Set<string>();
    for (const k of this.files.keys()) {
      if (k.startsWith(prefix)) {
        const rest = k.slice(prefix.length);
        names.add(rest.split('/')[0]);
      }
    }
    for (const d of this.dirs) {
      if (d.startsWith(prefix) && d !== normDir) {
        const rest = d.slice(prefix.length);
        names.add(rest.split('/')[0]);
      }
    }
    return Array.from(names);
  }

  async copy(from: string, to: string): Promise<void> {
    const data = await this.readAsBinary(from);
    await this.writeAsBinary(to, data);
  }

  async move(from: string, to: string): Promise<void> {
    const nFrom = this.norm(from);
    const nTo = this.norm(to);
    const prefix = `${nFrom}/`;

    if (this.files.has(nFrom)) {
      const data = this.files.get(nFrom)!;
      this.files.delete(nFrom);
      this.files.set(nTo, data);
      return;
    }

    for (const [k, v] of [...this.files.entries()]) {
      if (k.startsWith(prefix)) {
        this.files.delete(k);
        this.files.set(`${nTo}/${k.slice(prefix.length)}`, v);
      }
    }
    for (const d of [...this.dirs]) {
      if (d === nFrom || d.startsWith(prefix)) {
        this.dirs.delete(d);
        this.dirs.add(`${nTo}/${d.slice(prefix.length)}`);
      }
    }
  }
}

class ExpoFileStorage implements FileStorage {
  constructor(private fs: typeof import('expo-file-system')) {}

  async readAsString(path: string): Promise<string> {
    const file = new this.fs.File(path);
    return await file.text();
  }

  async writeAsString(path: string, contents: string): Promise<void> {
    const file = new this.fs.File(path);
    const parent = file.parentDirectory;
    if (parent && !parent.exists) {
      parent.create({ intermediates: true, idempotent: true });
    }
    await file.write(contents);
  }

  async readAsBinary(path: string): Promise<Uint8Array> {
    const file = new this.fs.File(path);
    return await file.bytes();
  }

  async writeAsBinary(path: string, data: Uint8Array): Promise<void> {
    const file = new this.fs.File(path);
    const parent = file.parentDirectory;
    if (parent && !parent.exists) {
      parent.create({ intermediates: true, idempotent: true });
    }
    await file.write(data);
  }

  async exists(path: string): Promise<boolean> {
    const file = new this.fs.File(path);
    if (file.exists) return true;
    const dir = new this.fs.Directory(path);
    return dir.exists;
  }

  async deleteFile(path: string): Promise<void> {
    const file = new this.fs.File(path);
    if (file.exists) {
      file.delete();
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    const dir = new this.fs.Directory(path);
    if (dir.exists) {
      dir.delete();
    }
  }

  async makeDirectory(path: string): Promise<void> {
    const dir = new this.fs.Directory(path);
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
  }

  async listDirectory(path: string): Promise<string[]> {
    const dir = new this.fs.Directory(path);
    if (!dir.exists) return [];
    return dir.list().map((item) => item.name);
  }

  async copy(from: string, to: string): Promise<void> {
    const srcFile = new this.fs.File(from);
    const destFile = new this.fs.File(to);
    const parent = destFile.parentDirectory;
    if (parent && !parent.exists) {
      parent.create({ intermediates: true, idempotent: true });
    }
    await srcFile.copy(destFile);
  }

  async move(from: string, to: string): Promise<void> {
    const srcFile = new this.fs.File(from);
    if (srcFile.exists) {
      const destFile = new this.fs.File(to);
      const parent = destFile.parentDirectory;
      if (parent && !parent.exists) {
        parent.create({ intermediates: true, idempotent: true });
      }
      await srcFile.move(destFile);
      return;
    }
    const srcDir = new this.fs.Directory(from);
    if (srcDir.exists) {
      const destDir = new this.fs.Directory(to);
      const parent = destDir.parentDirectory;
      if (parent && !parent.exists) {
        parent.create({ intermediates: true, idempotent: true });
      }
      await srcDir.move(destDir);
    }
  }
}

let cachedStorage: FileStorage | null = null;
let cachedBaseDir: string | null = null;
let storeInstance: ContentStore | null = null;
let updaterInstance: ContentUpdater | null = null;

export function getNativeFileStorage(): FileStorage {
  if (cachedStorage) return cachedStorage;
  try {
    const expoFs = require('expo-file-system');
    if (expoFs?.Paths?.document && typeof expoFs.File === 'function' && typeof expoFs.Directory === 'function') {
      cachedStorage = new ExpoFileStorage(expoFs);
      return cachedStorage;
    }
  } catch {
    // Falls through to MemoryFileStorage
  }
  cachedStorage = new MemoryFileStorage();
  return cachedStorage;
}

export function getNativeContentBaseDir(): string {
  if (cachedBaseDir) return cachedBaseDir;
  try {
    const expoFs = require('expo-file-system');
    if (expoFs?.Paths?.document?.uri) {
      // Paths.document.uri already ends with a slash
      cachedBaseDir = `${expoFs.Paths.document.uri.replace(/\/+$/, '')}/content`;
      return cachedBaseDir;
    }
  } catch {
    // Falls through
  }
  cachedBaseDir = '/app/content';
  return cachedBaseDir;
}

export function getNativeContentStore(): ContentStore {
  if (!storeInstance) {
    const files = getNativeFileStorage();
    const kv = asyncStorageKeyValue;
    const baseDir = getNativeContentBaseDir();
    storeInstance = new ContentStore(files, kv, baseDir);
  }
  return storeInstance;
}

export function getNativeContentUpdater(): ContentUpdater {
  if (!updaterInstance) {
    const store = getNativeContentStore();
    const files = getNativeFileStorage();
    const kv = asyncStorageKeyValue;
    updaterInstance = new ContentUpdater(store, files, kv);
  }
  return updaterInstance;
}

export function resetNativeRuntimeForTesting(storage?: FileStorage, store?: ContentStore, updater?: ContentUpdater): void {
  cachedStorage = storage ?? null;
  cachedBaseDir = null;
  storeInstance = store ?? null;
  updaterInstance = updater ?? null;
}

/**
 * Initializes active content on cold start.
 * If EXPO_PUBLIC_CONTENT_BASE (or EXPO_PUBLIC_CONTENT_DEV_URL) is not set,
 * returns the default bundled baseline immediately without network activity.
 */
export async function initNativeContent(options?: {
  contentBase?: string;
  isDev?: boolean;
}): Promise<RuntimeContent> {
  const isDev =
    options?.isDev ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production');
  const contentBase = options?.contentBase ?? resolveContentBase({ isDev });
  const hasRemote = hasRemoteContent(contentBase);

  if (!hasRemote) {
    return getActiveContent();
  }

  const store = getNativeContentStore();
  const updater = getNativeContentUpdater();
  const kvStorage = asyncStorageKeyValue;
  const currentAppVersion = Constants.expoConfig?.version ?? '1.0.0';

  const savedChannel = await loadContentChannel(kvStorage, isDev);

  return initContentRuntime({
    channel: savedChannel,
    store,
    updater,
    kvStorage,
    contentBase,
    currentAppVersion,
    isDev,
    language: 'es',
  });
}

/**
 * Switches the active content channel (e.g. Stable <-> Beta).
 * When no remote content is configured and channel is not cached,
 * returns { success: false, error: 'remote_unavailable' }.
 */
let switchQueue: Promise<unknown> = Promise.resolve();

export function switchContentChannel(
  channel: ContentChannel,
  options?: { contentBase?: string }
): Promise<SwitchChannelResult> {
  // One switch at a time: a Stable switch tapped while Beta is still downloading waits for it, so the late Beta
  // download cannot take over after the user has already gone back to Stable.
  const run = switchQueue.then(() => doSwitchContentChannel(channel, options));
  switchQueue = run.catch(() => undefined);
  return run;
}

async function doSwitchContentChannel(
  channel: ContentChannel,
  options?: { contentBase?: string }
): Promise<SwitchChannelResult> {
  const store = getNativeContentStore();
  const updater = getNativeContentUpdater();
  const kvStorage = asyncStorageKeyValue;
  const contentBase = options?.contentBase ?? resolveContentBase();
  const currentAppVersion = Constants.expoConfig?.version ?? '1.0.0';

  return switchChannel({
    channel,
    store,
    updater,
    kvStorage,
    contentBase,
    currentAppVersion,
    language: 'es',
  });
}
