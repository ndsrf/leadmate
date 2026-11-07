import { ContentUpdater, type HttpFetcher, type HttpResponse } from './updater';
import { ContentStore, type FileStorage, type KeyValueStorage } from './store';
import { type ContentManifest } from './build';
import { sha256Hex } from './hash';

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
