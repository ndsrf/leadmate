import { initContentRuntime, getActiveContent, setActiveContent } from './runtime';
import { ContentUpdater, type HttpFetcher, type HttpResponse } from './updater';
import { ContentStore, type FileStorage, type KeyValueStorage } from './store';
import { type ContentManifest } from './build';
import { sha256Hex } from './hash';

class FakeHttpServer implements HttpFetcher {
  routes: Map<string, { status: number; body: string | Uint8Array }> = new Map();

  setRoute(url: string, body: string | Uint8Array) {
    this.routes.set(url, { status: 200, body });
  }

  async fetch(url: string): Promise<HttpResponse> {
    const route = this.routes.get(url);
    if (!route) {
      return {
        status: 404,
        text: async () => 'Not found',
        binary: async () => new Uint8Array(),
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

describe('Dev mode pack loading (Task 4.6)', () => {
  const DEV_SERVER_URL = 'http://localhost:8081/dist/content';

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

  async function hostDevBetaPack(version: number, lessonTitle: string) {
    const files: Record<string, string> = {
      'pack.yaml': `
formatVersion: 1
minAppVersion: "1.0.0"
languages:
  - es
retired: []
`.trim(),
      'worlds/world-1.yaml': `
id: world-1
worldNumber: 1
tier: free
stretches:
  - - kind: lesson
      id: test-lesson
`.trim(),
      'worlds/world-1/es.md': `
# World 1
## topics
Topics
`.trim(),
      'lessons/test-lesson/lesson.yaml': `
id: test-lesson
kind: theory
`.trim(),
      'lessons/test-lesson/es.md': `
# ${lessonTitle}
## hook
Hook
## why
Why
## steps
1. Paso 1
2. Paso 2
## example
### Ejemplo
Texto del ejemplo
## compare
### do
Do
### dont
Dont
## tip
Tip
## takeaways
- Takeaway 1
`.trim(),
    };

    const manifestFiles: Record<string, { sha256: string; size: number }> = {};
    for (const [relPath, content] of Object.entries(files)) {
      const hash = await sha256Hex(content);
      manifestFiles[relPath] = { sha256: hash, size: Buffer.byteLength(content) };
      const ext = relPath.includes('.') ? `.${relPath.split('.').pop()}` : '';
      server.setRoute(`${DEV_SERVER_URL}/beta/files/${hash}${ext}`, content);
    }

    const manifest: ContentManifest = {
      channel: 'beta',
      contentVersion: version,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T18:00:00Z',
      files: manifestFiles,
    };

    server.setRoute(
      `${DEV_SERVER_URL}/beta/latest.json`,
      JSON.stringify({
        channel: 'beta',
        contentVersion: version,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        manifestPath: `packs/${version}/manifest.json`,
        manifestHash: 'hash',
        createdAt: '2026-11-06T18:00:00Z',
      })
    );
    server.setRoute(`${DEV_SERVER_URL}/beta/packs/${version}/manifest.json`, JSON.stringify(manifest));
  }

  it('in __DEV__, loads locally built beta pack at start, and reloading reflects edited lesson', async () => {
    // 1. Host Initial Dev Beta Pack (version 1)
    await hostDevBetaPack(1, 'Initial Lesson Title');

    // Start dev app
    const initialContent = await initContentRuntime({
      isDev: true,
      contentBase: DEV_SERVER_URL,
      store,
      kvStorage,
      updater,
    });

    expect(initialContent.channel).toBe('beta');
    expect(initialContent.contentVersion).toBe(1);
    expect(initialContent.resolved.catalog['trail.test-lesson.title']).toBe('Initial Lesson Title');

    // 2. Author edits the lesson (version 2)
    await hostDevBetaPack(2, 'Updated Lesson Title After Edit');

    // 3. Author reloads the dev app
    const reloadedContent = await initContentRuntime({
      isDev: true,
      contentBase: DEV_SERVER_URL,
      store,
      kvStorage,
      updater,
    });

    // Dev app immediately activates the new beta pack at load!
    expect(reloadedContent.channel).toBe('beta');
    expect(reloadedContent.contentVersion).toBe(2);
    expect(reloadedContent.resolved.catalog['trail.test-lesson.title']).toBe(
      'Updated Lesson Title After Edit'
    );
    expect(getActiveContent().resolved.catalog['trail.test-lesson.title']).toBe(
      'Updated Lesson Title After Edit'
    );
  });
});
