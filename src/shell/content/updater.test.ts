import { ContentUpdater, MAX_CONCURRENT_DOWNLOADS, type HttpFetcher, type HttpFetchOptions, type HttpResponse } from './updater';
import { ContentStore, type BaselineSource, type FileStorage, type KeyValueStorage } from './store';
import { type ContentManifest } from './build';
import { sha256Hex } from './hash';
import { getContentProgress, subscribeContentProgress } from './progress';

class FakeHttpServer implements HttpFetcher {
  routes: Map<string, { status: number; body: string | Uint8Array; delayMs?: number }> = new Map();
  requestedUrls: string[] = [];

  setRoute(url: string, body: string | Uint8Array, status = 200, delayMs = 0) {
    this.routes.set(url, { status, body, delayMs });
  }

  async fetch(url: string, options?: { timeoutMs?: number }): Promise<HttpResponse> {
    this.requestedUrls.push(url);
    const route = this.routes.get(url);

    if (!route) {
      return {
        status: 404,
        text: async () => 'Not found',
        binary: async () => new TextEncoder().encode('Not found'),
      };
    }

    if (route.delayMs && options?.timeoutMs && route.delayMs > options.timeoutMs) {
      throw new Error(`Request timed out after ${options.timeoutMs}ms`);
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

describe('ContentUpdater (launch updates, diffs, compatibility, in-app validation)', () => {
  const CONTENT_BASE = 'https://content.example.com';
  let server: FakeHttpServer;
  let fileStorage: MemoryFileStorage;
  let kvStorage: MemoryKeyValueStorage;
  let store: ContentStore;
  let updater: ContentUpdater;

  const validPackYaml = `
formatVersion: 1
contentVersion: 1
minAppVersion: "1.0.0"
languages:
  - es
retired: []
`.trim();

  const validWorldYaml = `
id: world-1
worldNumber: 1
tier: free
stretches: []
`.trim();

  const validWorldEs = `
# World 1
## topics
Topics
`.trim();

  beforeEach(() => {
    server = new FakeHttpServer();
    fileStorage = new MemoryFileStorage();
    kvStorage = new MemoryKeyValueStorage();
    store = new ContentStore(fileStorage, kvStorage, '/app/content');
    updater = new ContentUpdater(store, fileStorage, kvStorage, server);
  });

  async function hostPackVersion(
    version: number,
    files: Record<string, string>,
    manifestOverrides: Partial<ContentManifest> = {}
  ) {
    const manifestFiles: Record<string, { sha256: string; size: number }> = {};
    for (const [relPath, content] of Object.entries(files)) {
      const hash = await sha256Hex(content);
      manifestFiles[relPath] = { sha256: hash, size: Buffer.byteLength(content) };
      // Host hashed file
      const ext = relPath.includes('.') ? `.${relPath.split('.').pop()}` : '';
      server.setRoute(`${CONTENT_BASE}/beta/files/${hash}${ext}`, content);
    }

    const manifest: ContentManifest = {
      channel: 'beta',
      contentVersion: version,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T18:00:00Z',
      files: manifestFiles,
      ...manifestOverrides,
    };

    const latestJson = {
      channel: 'beta',
      contentVersion: version,
      formatVersion: manifest.formatVersion,
      minAppVersion: manifest.minAppVersion,
      manifestPath: `packs/${version}/manifest.json`,
      manifestHash: await sha256Hex(JSON.stringify(manifest)),
      createdAt: '2026-11-06T18:00:00Z',
    };

    server.setRoute(`${CONTENT_BASE}/beta/latest.json`, JSON.stringify(latestJson));
    server.setRoute(`${CONTENT_BASE}/beta/packs/${version}/manifest.json`, JSON.stringify(manifest));

    return { manifest, files };
  }

  it('Scenario: New content published downloads diff and stages for next launch', async () => {
    // 1. Host version 1
    const v1Files = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    };
    await hostPackVersion(1, v1Files);

    const res = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(true);
    expect(res.reason).toBe('staged_for_next_launch');
    expect(res.newVersion).toBe(1);
    expect(res.filesDownloaded).toBe(3);

    // Verify it is staged for next launch, not activated mid-session
    expect(await store.getActivePointer('beta')).toBeNull();
    const pending = await updater.getPendingUpdate('beta');
    expect(pending?.version).toBe(1);

    // Apply pending on next launch
    const applied = await updater.applyPendingUpdateIfAvailable('beta');
    expect(applied).toBe(true);
    expect((await store.getActivePointer('beta'))?.contentVersion).toBe(1);
  });

  it('Scenario: Download progress is reported per file and ends when the update is done', async () => {
    await hostPackVersion(1, {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    });
    const seen: Array<[boolean, number, number]> = [];
    const unsubscribe = subscribeContentProgress(() => {
      const p = getContentProgress();
      seen.push([p.active, p.done, p.total]);
    });

    await updater.checkAndDownloadUpdate({ channel: 'beta', currentAppVersion: '1.0.0', contentBase: CONTENT_BASE });
    unsubscribe();

    expect(seen).toEqual([
      [true, 0, 3],
      [true, 1, 3],
      [true, 2, 3],
      [true, 3, 3],
      [false, 0, 0],
    ]);
    expect(getContentProgress().active).toBe(false);
  });

  it('Scenario: A failed download still clears the progress, and a check with nothing new never shows it', async () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeContentProgress(() => seen.push(getContentProgress().active));

    // nothing hosted: unreachable, no download ever starts
    await updater.checkAndDownloadUpdate({ channel: 'beta', currentAppVersion: '1.0.0', contentBase: CONTENT_BASE });
    expect(seen).toEqual([]);

    // a file that fails midway
    const { manifest } = await hostPackVersion(1, { 'pack.yaml': validPackYaml, 'worlds/world-1.yaml': validWorldYaml });
    const broken = Object.values(manifest.files)[1];
    server.routes.delete(`${CONTENT_BASE}/beta/files/${broken.sha256}.yaml`);
    const res = await updater.checkAndDownloadUpdate({ channel: 'beta', currentAppVersion: '1.0.0', contentBase: CONTENT_BASE });
    unsubscribe();

    expect(res.updated).toBe(false);
    expect(seen[0]).toBe(true);
    expect(getContentProgress().active).toBe(false);
  });

  it('Scenario: Two updates started together run one after the other and both end consistent', async () => {
    await hostPackVersion(1, {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    });
    const options = { channel: 'beta' as const, currentAppVersion: '1.0.0', contentBase: CONTENT_BASE, immediateActivate: true };

    const [a, b] = await Promise.all([updater.checkAndDownloadUpdate(options), updater.checkAndDownloadUpdate(options)]);

    expect(a.reason).toBe('activated');
    expect(b.reason).toBe('up_to_date');
    expect((await store.getActivePointer('beta'))?.contentVersion).toBe(1);
    expect(await store.loadActivePack('beta')).not.toBeNull();
    // the files were fetched once, not once per caller
    expect(server.requestedUrls.filter((u) => u.includes('/files/')).length).toBe(3);
  });

  it('Scenario: Nothing new when published version equals installed version', async () => {
    // Install version 1
    const v1Files = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    };
    const { manifest } = await hostPackVersion(1, v1Files);
    for (const [p, content] of Object.entries(v1Files)) {
      await store.saveFileToStaging('beta', 1, p, content, manifest.files[p].sha256);
    }
    await store.activateStaging('beta', 1, manifest);

    // Check again
    const res = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('up_to_date');
    expect(res.filesDownloaded).toBeUndefined();
  });

  it('Scenario: Fresh install on stable channel with no stored active pack returns up_to_date when baseline matches remote', async () => {
    const v1Files = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    };
    await hostPackVersion(1, v1Files);
    server.setRoute(
      `${CONTENT_BASE}/stable/latest.json`,
      JSON.stringify({
        channel: 'stable',
        contentVersion: 1,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        manifestPath: 'packs/1/manifest.json',
        manifestHash: 'hash',
        createdAt: '2026-11-06T18:00:00Z',
      })
    );

    expect(await store.getActivePointer('stable')).toBeNull();

    const res = await updater.checkAndDownloadUpdate({
      channel: 'stable',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('up_to_date');
    expect(res.remoteVersion).toBe(1);
    expect(res.filesDownloaded).toBeUndefined();
    expect(server.requestedUrls.filter((u) => u.includes('/files/'))).toHaveLength(0);
  });

  it('Scenario: App update where bundled baseline exceeds stored active pointer resolves to up_to_date using baseline version', async () => {
    const mockManifest: ContentManifest = {
      channel: 'stable',
      contentVersion: 0,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T18:00:00Z',
      files: {},
    };
    await kvStorage.setItem(
      '@leadmate:content_active_stable',
      JSON.stringify({
        channel: 'stable',
        contentVersion: 0,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        activatedAt: '2026-11-06T18:00:00Z',
        manifest: mockManifest,
      })
    );

    server.setRoute(
      `${CONTENT_BASE}/stable/latest.json`,
      JSON.stringify({
        channel: 'stable',
        contentVersion: 1,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        manifestPath: 'packs/1/manifest.json',
        manifestHash: 'hash',
        createdAt: '2026-11-06T18:00:00Z',
      })
    );

    const res = await updater.checkAndDownloadUpdate({
      channel: 'stable',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('up_to_date');
    expect(res.remoteVersion).toBe(1);
    expect(server.requestedUrls.filter((u) => u.includes('/files/'))).toHaveLength(0);
  });

  it('Scenario: Slow or unreachable host falls back cleanly with no error thrown', async () => {
    // Server has a timeout on latest.json
    server.setRoute(`${CONTENT_BASE}/beta/latest.json`, '', 200, 10000);

    const res = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
      timeoutMs: 50,
    });

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('unreachable');
  });

  it('Scenario: One Lesson edited downloads only changed file (diff by hash)', async () => {
    // 1. Install v1
    const v1Files = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    };
    const { manifest: v1Manifest } = await hostPackVersion(1, v1Files);
    for (const [p, content] of Object.entries(v1Files)) {
      await store.saveFileToStaging('beta', 1, p, content, v1Manifest.files[p].sha256);
    }
    await store.activateStaging('beta', 1, v1Manifest);

    // 2. Host v2 where only worlds/world-1/es.md is edited
    const v2Files = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': '# World 1 (Edited)\n## topics\nNew topics\n',
    };
    await hostPackVersion(2, v2Files);

    server.requestedUrls = [];
    const res = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(true);
    expect(res.filesDownloaded).toBe(1); // Only 1 file downloaded!

    // Verify that the requested file URLs include only the 1 changed file
    const fileRequests = server.requestedUrls.filter((u) => u.includes('/files/'));
    expect(fileRequests.length).toBe(1);
  });

  it('Scenario: Incompatible pack (needs newer app or format version)', async () => {
    const v1Files = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    };
    // Pack requires app version 2.0.0, current app is 1.0.0
    await hostPackVersion(2, v1Files, { minAppVersion: '2.0.0' });

    const res = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('incompatible');
  });

  it('Scenario: Hash mismatch in downloaded file discards pack and does not activate', async () => {
    const v1Files = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    };
    const { manifest } = await hostPackVersion(1, v1Files);

    // Corrupt one file in the fake server
    const worldHash = manifest.files['worlds/world-1/es.md'].sha256;
    server.setRoute(`${CONTENT_BASE}/beta/files/${worldHash}.md`, 'corrupt bytes differing from hash');

    const res = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('hash_mismatch');
    expect(await updater.getPendingUpdate('beta')).toBeNull();
  });

  it('Scenario: In-app validatePack rejects invalid published pack', async () => {
    // Pack with dangling reference
    const invalidFiles = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': `
id: world-1
worldNumber: 1
tier: free
stretches:
  - - kind: node
      id: non-existent-node-123
`.trim(),
      'worlds/world-1/es.md': validWorldEs,
    };
    await hostPackVersion(1, invalidFiles);

    const res = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('validation_failed');
    expect(await updater.getPendingUpdate('beta')).toBeNull();
  });
});

describe('ContentUpdater (baseline seeding, merged content, concurrent downloads)', () => {
  const BASE = 'https://content.example.com';
  const packYaml = (v: number) =>
    `formatVersion: 1\ncontentVersion: ${v}\nminAppVersion: "1.0.0"\nlanguages:\n  - es\nretired: []`;
  const worldYaml = 'id: world-1\nworldNumber: 1\ntier: free\nstretches: []';
  const worldEs = '# World 1\n## topics\nTopics';

  let server: FakeHttpServer;
  let fileStorage: MemoryFileStorage;
  let kv: MemoryKeyValueStorage;
  let store: ContentStore;
  let baseline: BaselineSource;
  let updater: ContentUpdater;

  beforeEach(async () => {
    server = new FakeHttpServer();
    fileStorage = new MemoryFileStorage();
    kv = new MemoryKeyValueStorage();
    store = new ContentStore(fileStorage, kv, '/app/content');
    baseline = {
      pack: {
        pack: { formatVersion: 1, contentVersion: 1, minAppVersion: '1.0.0', languages: ['es'], retired: [] },
        worlds: { 'world-1': { config: { id: 'world-1', worldNumber: 1, tier: 'free', stretches: [] } as any, text: { es: worldEs } } },
        lessons: {},
        nodes: {},
        missions: {},
      },
      hashes: {
        'pack.yaml': await sha256Hex(packYaml(1)),
        'worlds/world-1.yaml': await sha256Hex(worldYaml),
        'worlds/world-1/es.md': await sha256Hex(worldEs),
      },
    };
    updater = new ContentUpdater(store, fileStorage, kv, server, baseline);
  });

  async function host(channel: 'beta' | 'stable', version: number, files: Record<string, string>) {
    const manifestFiles: Record<string, { sha256: string; size: number }> = {};
    for (const [relPath, content] of Object.entries(files)) {
      const hash = await sha256Hex(content);
      manifestFiles[relPath] = { sha256: hash, size: Buffer.byteLength(content) };
      const ext = relPath.includes('.') ? `.${relPath.split('.').pop()}` : '';
      server.setRoute(`${BASE}/${channel}/files/${hash}${ext}`, content);
    }
    const manifest: ContentManifest = {
      channel,
      contentVersion: version,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T18:00:00Z',
      files: manifestFiles,
    };
    server.setRoute(
      `${BASE}/${channel}/latest.json`,
      JSON.stringify({ channel, contentVersion: version, formatVersion: 1, minAppVersion: '1.0.0', manifestPath: `packs/${version}/manifest.json`, manifestHash: 'h', createdAt: 'x' })
    );
    server.setRoute(`${BASE}/${channel}/packs/${version}/manifest.json`, JSON.stringify(manifest));
    return manifest;
  }

  const run = (channel: 'beta' | 'stable', u: ContentUpdater = updater, immediateActivate = false) =>
    u.checkAndDownloadUpdate({ channel, currentAppVersion: '1.0.0', contentBase: BASE, immediateActivate });

  const fileRequests = () => server.requestedUrls.filter((u) => u.includes('/files/'));

  it('Scenario: first install seeded from the baseline downloads only what differs, and the merged content is complete', async () => {
    await host('stable', 2, { 'pack.yaml': packYaml(2), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs });

    const res = await run('stable', updater, true);

    expect(res).toMatchObject({ updated: true, reason: 'activated', filesDownloaded: 1 });
    expect(fileRequests()).toHaveLength(1);
    // the installed pack holds only the downloaded file
    expect(await fileStorage.exists('/app/content/stable/active/pack.yaml')).toBe(true);
    expect(await fileStorage.exists('/app/content/stable/active/worlds/world-1.yaml')).toBe(false);
    // the active content is the pack merged with the baseline
    const merged = await store.loadActivePack('stable', baseline);
    expect(merged?.pack.contentVersion).toBe(2);
    expect(merged?.worlds['world-1'].text?.es).toBe(worldEs);
  });

  it('Scenario: Beta has no baseline, so every file is downloaded and the baseline is never used', async () => {
    await host('beta', 2, { 'pack.yaml': packYaml(2), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs });

    const res = await run('beta', updater, true);

    expect(res.filesDownloaded).toBe(3);
    expect(fileRequests()).toHaveLength(3);
    // a beta pack missing a file is not completed from the baseline
    await fileStorage.deleteFile('/app/content/beta/active/worlds/world-1.yaml');
    const loaded = await store.loadActivePack('beta', baseline);
    expect(Object.keys(loaded?.worlds ?? {})).toEqual([]);
  });

  it('Scenario: update after a partial first install stages a complete set', async () => {
    await host('stable', 2, { 'pack.yaml': packYaml(2), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs });
    await run('stable', updater, true);

    const editedEs = '# World 1 edited\n## topics\nNew';
    await host('stable', 3, { 'pack.yaml': packYaml(3), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': editedEs });
    server.requestedUrls = [];
    const res = await run('stable', updater, true);

    expect(res.updated).toBe(true);
    // every file of the new pack is on disk: partial packs never chain
    for (const f of ['pack.yaml', 'worlds/world-1.yaml', 'worlds/world-1/es.md']) {
      expect(await fileStorage.exists(`/app/content/stable/active/${f}`)).toBe(true);
    }
    const loaded = await store.loadActivePack('stable', baseline);
    expect(loaded?.worlds['world-1'].text?.es).toBe(editedEs);
  });

  it('Scenario: merged pack fails validation, so it is not activated and the previous content stays', async () => {
    // Valid on its own (the pack has no lessons), invalid once merged: the baseline's lesson is not on any trail.
    const lessonYaml = 'id: theory-x\nkind: theory';
    baseline.pack.lessons['theory-x'] = { config: { id: 'theory-x', kind: 'theory' } as any, text: {}, files: [] };
    baseline.hashes['lessons/theory-x/lesson.yaml'] = await sha256Hex(lessonYaml);
    await host('stable', 2, { 'pack.yaml': packYaml(2), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs, 'lessons/theory-x/lesson.yaml': lessonYaml });

    const res = await run('stable', updater, true);

    expect(res.updated).toBe(false);
    expect(res.reason).toBe('validation_failed');
    expect(await store.getActivePointer('stable')).toBeNull();
    expect(await updater.getPendingUpdate('stable')).toBeNull();
  });

  describe('concurrency', () => {
    /** Fetcher that tracks in-flight file requests and lets a test pick when each finishes. */
    class GateFetcher implements HttpFetcher {
      inFlight = 0;
      maxInFlight = 0;
      started: string[] = [];
      signals: AbortSignal[] = [];
      resolvers: Array<() => void> = [];
      constructor(private inner: FakeHttpServer, private failOn?: (url: string) => boolean) {}
      async fetch(url: string, options?: HttpFetchOptions): Promise<HttpResponse> {
        if (!url.includes('/files/')) return this.inner.fetch(url, options);
        this.started.push(url);
        if (options?.signal) this.signals.push(options.signal);
        this.inFlight++;
        this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
        await new Promise<void>((resolve) => this.resolvers.push(resolve));
        this.inFlight--;
        if (this.failOn?.(url)) return { status: 500, text: async () => '', binary: async () => new Uint8Array() };
        return this.inner.fetch(url, options);
      }
    }
    const flush = () => new Promise((r) => setTimeout(r, 0));
    const media = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`media/img-${i}.png`, `img-${i}`]));

    it('Scenario: up to the limit are in flight at once, structure and text before media', async () => {
      await host('beta', 1, { 'pack.yaml': packYaml(1), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs, ...media(10) });
      const gate = new GateFetcher(server);
      const u = new ContentUpdater(store, fileStorage, kv, gate, baseline);
      const done = run('beta', u);

      await flush(); await flush();
      expect(gate.inFlight).toBe(MAX_CONCURRENT_DOWNLOADS);
      // the first requests are the structure/text files, never media
      expect(gate.started.slice(0, 3).every((url) => !url.endsWith('.png'))).toBe(true);
      while (gate.resolvers.length) { gate.resolvers.shift()!(); await flush(); await flush(); }
      const res = await done;
      expect(res.updated).toBe(true);
      expect(res.filesDownloaded).toBe(13);
      expect(gate.maxInFlight).toBe(MAX_CONCURRENT_DOWNLOADS);
    });

    it('Scenario: progress under concurrency counts finished files and never decreases when they finish out of order', async () => {
      await host('beta', 1, { 'pack.yaml': packYaml(1), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs, ...media(5) });
      const gate = new GateFetcher(server);
      const u = new ContentUpdater(store, fileStorage, kv, gate, baseline);
      const seen: number[] = [];
      const unsub = subscribeContentProgress(() => { const p = getContentProgress(); if (p.active) seen.push(p.done); });
      const done = run('beta', u);
      await flush(); await flush();
      // finish in reverse order of request
      while (gate.resolvers.length) { gate.resolvers.pop()!(); await flush(); await flush(); }
      await done;
      unsub();
      expect(seen[0]).toBe(0);
      expect(seen[seen.length - 1]).toBe(8);
      for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    });

    it('Scenario: one of several downloads fails, the rest are abandoned, cancelled and never staged', async () => {
      await host('beta', 1, { 'pack.yaml': packYaml(1), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs, ...media(10) });
      const gate: GateFetcher = new GateFetcher(server, (url: string) => url === gate.started[1]);
      const u = new ContentUpdater(store, fileStorage, kv, gate, baseline);
      const done = run('beta', u);
      await flush(); await flush();
      expect(gate.started).toHaveLength(MAX_CONCURRENT_DOWNLOADS);

      gate.resolvers[1](); // the second request fails
      await flush(); await flush();
      expect(gate.signals.every((sg) => sg.aborted)).toBe(true);
      gate.resolvers.forEach((r, i) => i !== 1 && r()); // the others still finish
      const res = await done;

      expect(res.updated).toBe(false);
      expect(res.reason).toBe('unreachable');
      expect(gate.started).toHaveLength(MAX_CONCURRENT_DOWNLOADS); // no new request after the failure
      expect(await fileStorage.exists('/app/content/beta/staging/1')).toBe(false);
      expect(await u.getPendingUpdate('beta')).toBeNull();
      expect(await store.getActivePointer('beta')).toBeNull();
    });
  });
});
