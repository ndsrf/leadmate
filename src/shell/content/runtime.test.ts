import { getActiveContent, initContentRuntime, setActiveContent } from './runtime';
import { ContentUpdater, type HttpFetcher, type HttpResponse } from './updater';
import { ContentStore, type FileStorage, type KeyValueStorage } from './store';
import { type ContentManifest } from './build';
import { sha256Hex } from './hash';

class FakeHttpServer implements HttpFetcher {
  routes: Map<string, { status: number; body: string | Uint8Array }> = new Map();

  setRoute(url: string, body: string | Uint8Array, status = 200) {
    this.routes.set(url, { status, body });
  }

  async fetch(url: string): Promise<HttpResponse> {
    const route = this.routes.get(url);
    if (!route) {
      return {
        status: 404,
        text: async () => 'Not found',
        binary: async () => new TextEncoder().encode('Not found'),
      };
    }
    const bytes = typeof route.body === 'string' ? new TextEncoder().encode(route.body) : route.body;
    return {
      status: route.status,
      text: async () => (typeof route.body === 'string' ? route.body : new TextDecoder().decode(route.body)),
      binary: async () => bytes,
    };
  }
}

class MemoryKeyValueStorage implements KeyValueStorage {
  store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class MemoryFileStorage implements FileStorage {
  files = new Map<string, Uint8Array>();
  dirs = new Set<string>();

  private norm(p: string): string {
    return p.replace(/\/+/g, '/').replace(/\/$/, '');
  }

  async readAsString(p: string): Promise<string> {
    const data = this.files.get(this.norm(p));
    if (!data) throw new Error(`File not found: ${p}`);
    return new TextDecoder().decode(data);
  }

  async writeAsString(p: string, contents: string): Promise<void> {
    this.files.set(this.norm(p), new TextEncoder().encode(contents));
  }

  async readAsBinary(p: string): Promise<Uint8Array> {
    const data = this.files.get(this.norm(p));
    if (!data) throw new Error(`File not found: ${p}`);
    return data;
  }

  async writeAsBinary(p: string, data: Uint8Array): Promise<void> {
    this.files.set(this.norm(p), data);
  }

  async exists(p: string): Promise<boolean> {
    const n = this.norm(p);
    if (this.files.has(n)) return true;
    for (const d of this.dirs) {
      if (d === n || d.startsWith(`${n}/`)) return true;
    }
    for (const f of this.files.keys()) {
      if (f === n || f.startsWith(`${n}/`)) return true;
    }
    return false;
  }

  async deleteFile(p: string): Promise<void> {
    this.files.delete(this.norm(p));
  }

  async deleteDirectory(p: string): Promise<void> {
    const prefix = `${this.norm(p)}/`;
    for (const k of [...this.files.keys()]) {
      if (k === this.norm(p) || k.startsWith(prefix)) {
        this.files.delete(k);
      }
    }
    for (const d of [...this.dirs]) {
      if (d === this.norm(p) || d.startsWith(prefix)) {
        this.dirs.delete(d);
      }
    }
  }

  async makeDirectory(p: string): Promise<void> {
    this.dirs.add(this.norm(p));
  }

  async listDirectory(p: string): Promise<string[]> {
    const normDir = this.norm(p);
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

describe('Runtime content loading & session stability', () => {
  const CONTENT_BASE = 'https://content.example.com';
  let server: FakeHttpServer;
  let fileStorage: MemoryFileStorage;
  let kvStorage: MemoryKeyValueStorage;
  let store: ContentStore;
  let updater: ContentUpdater;

  beforeEach(() => {
    setActiveContent(null);
    server = new FakeHttpServer();
    fileStorage = new MemoryFileStorage();
    kvStorage = new MemoryKeyValueStorage();
    store = new ContentStore(fileStorage, kvStorage, '/app/content');
    updater = new ContentUpdater(store, fileStorage, kvStorage, server);
  });

  it('loads baseline pack at startup when no remote pack is stored', async () => {
    const content = await initContentRuntime({
      channel: 'stable',
      store,
      kvStorage,
      updater,
    });

    expect(content.isBaseline).toBe(true);
    expect(content.channel).toBe('stable');
    expect(content.resolved.worlds.length).toBeGreaterThan(0);
  });

  it('session stability: a pack finished mid-session is not used until restart', async () => {
    // 1. Initial startup on baseline
    const session1 = await initContentRuntime({
      channel: 'beta',
      store,
      kvStorage,
      updater,
    });
    expect(session1.isBaseline).toBe(true);
    expect(session1.contentVersion).toBe(1);

    // 2. Server publishes version 2
    const v2Files = {
      'pack.yaml': `
formatVersion: 1
minAppVersion: "1.0.0"
languages:
  - es
retired: []
`.trim(),
      'worlds/world-custom.yaml': `
id: world-custom
worldNumber: 1
tier: free
stretches: []
`.trim(),
      'worlds/world-custom/es.md': `
# Custom World V2
## topics
New topics
`.trim(),
    };

    const manifestFiles: Record<string, { sha256: string; size: number }> = {};
    for (const [relPath, body] of Object.entries(v2Files)) {
      const hash = await sha256Hex(body);
      manifestFiles[relPath] = { sha256: hash, size: Buffer.byteLength(body) };
      const ext = relPath.includes('.') ? `.${relPath.split('.').pop()}` : '';
      server.setRoute(`${CONTENT_BASE}/beta/files/${hash}${ext}`, body);
    }
    const manifest: ContentManifest = {
      channel: 'beta',
      contentVersion: 2,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T18:00:00Z',
      files: manifestFiles,
    };
    server.setRoute(`${CONTENT_BASE}/beta/latest.json`, JSON.stringify({
      channel: 'beta',
      contentVersion: 2,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      manifestPath: 'packs/2/manifest.json',
      manifestHash: 'hash',
      createdAt: '2026-11-06T18:00:00Z',
    }));
    server.setRoute(`${CONTENT_BASE}/beta/packs/2/manifest.json`, JSON.stringify(manifest));

    // 3. Background launch updater completes mid-session
    const updateResult = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
      immediateActivate: false, // background update
    });

    expect(updateResult.updated).toBe(true);
    expect(updateResult.reason).toBe('staged_for_next_launch');

    // CRITICAL: getActiveContent() MUST still return the exact same session1 content!
    const midSessionContent = getActiveContent();
    expect(midSessionContent.contentVersion).toBe(1);
    expect(midSessionContent.isBaseline).toBe(true);
    // Custom world from V2 is NOT present in memory
    expect(midSessionContent.resolved.worlds.some((w) => w.id === 'world-custom')).toBe(false);

    // 4. App restart (next launch): initContentRuntime runs again
    const session2 = await initContentRuntime({
      channel: 'beta',
      store,
      kvStorage,
      updater,
    });

    // Now version 2 is active!
    expect(session2.contentVersion).toBe(2);
    expect(session2.isBaseline).toBe(false);
    expect(session2.resolved.worlds.some((w) => w.id === 'world-custom')).toBe(true);
    expect(getActiveContent().contentVersion).toBe(2);
  });
});

describe('initContentRuntime launch-time update check', () => {
  const fakeUpdater = (check: jest.Mock) =>
    ({ applyPendingUpdateIfAvailable: jest.fn().mockResolvedValue(false), checkAndDownloadUpdate: check }) as unknown as ContentUpdater;

  it('production: checks in the background, stages only, and does not wait for the check', async () => {
    const check = jest.fn().mockReturnValue(new Promise(() => {})); // never finishes
    const session = await initContentRuntime({ isDev: false, channel: 'stable', updater: fakeUpdater(check), contentBase: 'https://c.example.com' });

    expect(session.isBaseline).toBe(true);
    expect(check).toHaveBeenCalledTimes(1);
    expect(check.mock.calls[0][0]).toMatchObject({ channel: 'stable', immediateActivate: false, contentBase: 'https://c.example.com' });
  });

  it('production: a failing check is swallowed', async () => {
    const check = jest.fn().mockRejectedValue(new Error('boom'));
    await expect(initContentRuntime({ isDev: false, channel: 'stable', updater: fakeUpdater(check) })).resolves.toBeDefined();
    await Promise.resolve();
  });

  it('development: checks and activates at once, awaiting it', async () => {
    const check = jest.fn().mockResolvedValue({ updated: false, reason: 'up_to_date' });
    await initContentRuntime({ isDev: true, channel: 'beta', updater: fakeUpdater(check), contentBase: 'https://c.example.com' });

    expect(check).toHaveBeenCalledTimes(1);
    expect(check.mock.calls[0][0]).toMatchObject({ channel: 'beta', immediateActivate: true });
  });
});
