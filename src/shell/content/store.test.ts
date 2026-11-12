import { ContentStore, type BaselineSource, type FileStorage, type KeyValueStorage } from './store';
import { type ContentManifest } from './build';
import { sha256Hex } from './hash';

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
    if (this.dirs.has(n)) return true;
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
        const name = rest.split('/')[0];
        names.add(name);
      }
    }
    for (const d of this.dirs) {
      if (d.startsWith(prefix) && d !== normDir) {
        const rest = d.slice(prefix.length);
        const name = rest.split('/')[0];
        names.add(name);
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

    // If file
    if (this.files.has(nFrom)) {
      const data = this.files.get(nFrom)!;
      this.files.delete(nFrom);
      this.files.set(nTo, data);
      return;
    }

    // If directory
    const prefix = `${nFrom}/`;
    for (const [k, v] of [...this.files.entries()]) {
      if (k.startsWith(prefix)) {
        const sub = k.slice(prefix.length);
        this.files.delete(k);
        this.files.set(`${nTo}/${sub}`, v);
      }
    }
    for (const d of [...this.dirs]) {
      if (d === nFrom || d.startsWith(prefix)) {
        this.dirs.delete(d);
        const sub = d.slice(prefix.length);
        this.dirs.add(`${nTo}/${sub}`);
      }
    }
  }
}

describe('ContentStore (staging, hash verification, pointer, retention, GC)', () => {
  let fileStorage: MemoryFileStorage;
  let kvStorage: MemoryKeyValueStorage;
  let store: ContentStore;

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
Topics text
`.trim();

  beforeEach(() => {
    fileStorage = new MemoryFileStorage();
    kvStorage = new MemoryKeyValueStorage();
    store = new ContentStore(fileStorage, kvStorage, '/app/content');
  });

  async function createSampleManifest(version: number): Promise<{
    manifest: ContentManifest;
    files: Record<string, string>;
  }> {
    const files: Record<string, string> = {
      'pack.yaml': validPackYaml,
      'worlds/world-1.yaml': validWorldYaml,
      'worlds/world-1/es.md': validWorldEs,
    };

    const manifestFiles: Record<string, { sha256: string; size: number }> = {};
    for (const [relPath, content] of Object.entries(files)) {
      const hash = await sha256Hex(content);
      manifestFiles[relPath] = {
        sha256: hash,
        size: Buffer.byteLength(content),
      };
    }

    const manifest: ContentManifest = {
      channel: 'beta',
      contentVersion: version,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T18:00:00Z',
      files: manifestFiles,
    };

    return { manifest, files };
  }

  it('Scenario: Hash mismatch throws and discards file from staging', async () => {
    const badContent = 'corrupt content';
    const expectedHash = '0000000000000000000000000000000000000000000000000000000000000000';

    await expect(
      store.saveFileToStaging('beta', 1, 'pack.yaml', badContent, expectedHash)
    ).rejects.toThrow(/Hash mismatch/);

    expect(await fileStorage.exists('/app/content/beta/staging/1/pack.yaml')).toBe(false);
  });

  it('Scenario: Interrupted download prevents activation and leaves previous pack active', async () => {
    const { manifest, files } = await createSampleManifest(1);

    // Only save pack.yaml, omitting world files
    await store.saveFileToStaging(
      'beta',
      1,
      'pack.yaml',
      files['pack.yaml'],
      manifest.files['pack.yaml'].sha256
    );

    // Attempting activation fails because pack is incomplete
    await expect(store.activateStaging('beta', 1, manifest)).rejects.toThrow(
      /Cannot activate incomplete pack/
    );

    // Active pointer is null, no active dir exists
    expect(await store.getActivePointer('beta')).toBeNull();
    expect(await fileStorage.exists('/app/content/beta/active')).toBe(false);
  });

  it('Scenario: Atomic flip, previous-version retention, and rollback', async () => {
    // 1. Activate Version 1
    const v1 = await createSampleManifest(1);
    for (const [p, content] of Object.entries(v1.files)) {
      await store.saveFileToStaging('beta', 1, p, content, v1.manifest.files[p].sha256);
    }
    const pointer1 = await store.activateStaging('beta', 1, v1.manifest);
    expect(pointer1.contentVersion).toBe(1);
    expect((await store.getActivePointer('beta'))?.contentVersion).toBe(1);
    expect(await fileStorage.exists('/app/content/beta/active/pack.yaml')).toBe(true);

    // 2. Activate Version 2
    const v2 = await createSampleManifest(2);
    for (const [p, content] of Object.entries(v2.files)) {
      await store.saveFileToStaging('beta', 2, p, content, v2.manifest.files[p].sha256);
    }
    const pointer2 = await store.activateStaging('beta', 2, v2.manifest);
    expect(pointer2.contentVersion).toBe(2);
    expect((await store.getActivePointer('beta'))?.contentVersion).toBe(2);

    // Previous version 1 is retained in previous/
    expect(await fileStorage.exists('/app/content/beta/previous/pack.yaml')).toBe(true);

    // 3. Rollback
    const rolledBack = await store.rollbackToPrevious('beta');
    expect(rolledBack).toBe(true);
    expect((await store.getActivePointer('beta'))?.contentVersion).toBe(1);
  });

  it('Scenario: Corrupt cache triggers fallback to previous pack or null (baseline)', async () => {
    // Activate Version 1
    const v1 = await createSampleManifest(1);
    for (const [p, content] of Object.entries(v1.files)) {
      await store.saveFileToStaging('beta', 1, p, content, v1.manifest.files[p].sha256);
    }
    await store.activateStaging('beta', 1, v1.manifest);

    // Activate Version 2
    const v2 = await createSampleManifest(2);
    for (const [p, content] of Object.entries(v2.files)) {
      await store.saveFileToStaging('beta', 2, p, content, v2.manifest.files[p].sha256);
    }
    await store.activateStaging('beta', 2, v2.manifest);

    // Corrupt active pack.yaml by writing invalid content
    await fileStorage.writeAsString('/app/content/beta/active/pack.yaml', 'invalid yaml: [');

    // loadActivePack should detect corruption, rollback to previous (v1), and return v1 pack
    const pack = await store.loadActivePack('beta');
    expect(pack).not.toBeNull();
    expect(pack?.pack.formatVersion).toBe(1);

    // If previous pack is also corrupt, loadActivePack returns null (falling back to baseline)
    await fileStorage.deleteDirectory('/app/content/beta/active');
    await fileStorage.deleteDirectory('/app/content/beta/previous');

    const fallbackPack = await store.loadActivePack('beta');
    expect(fallbackPack).toBeNull();
    // Pointer is cleaned up
    expect(await store.getActivePointer('beta')).toBeNull();
  });

  it('Garbage collects unreferenced files', async () => {
    await fileStorage.writeAsString('/app/content/beta/files/keep1.png', 'img1');
    await fileStorage.writeAsString('/app/content/beta/files/delete1.png', 'img2');

    const deleted = await store.garbageCollect('beta', new Set(['keep1']));
    expect(deleted).toBe(1);
    expect(await fileStorage.exists('/app/content/beta/files/keep1.png')).toBe(true);
    expect(await fileStorage.exists('/app/content/beta/files/delete1.png')).toBe(false);
  });
});

describe('ContentStore merged active content (installed pack + baseline)', () => {
  const packYaml = (v: number) => `formatVersion: 1\ncontentVersion: ${v}\nminAppVersion: "1.0.0"\nlanguages:\n  - es\nretired: []`;
  const worldYaml = 'id: world-1\nworldNumber: 1\ntier: free\nstretches: []';
  const worldEs = '# World 1\n## topics\nTopics';
  let files: MemoryFileStorage;
  let kv: MemoryKeyValueStorage;
  let store: ContentStore;
  let baseline: BaselineSource;

  beforeEach(async () => {
    files = new MemoryFileStorage();
    kv = new MemoryKeyValueStorage();
    store = new ContentStore(files, kv, '/app/content');
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
  });

  /** Stages a pack holding only `own` files while the manifest lists all three. */
  async function install(channel: 'beta' | 'stable', own: Record<string, string>) {
    const all: Record<string, string> = { 'pack.yaml': packYaml(2), 'worlds/world-1.yaml': worldYaml, 'worlds/world-1/es.md': worldEs };
    const manifest: ContentManifest = {
      channel,
      contentVersion: 2,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: 'x',
      files: Object.fromEntries(await Promise.all(Object.entries(all).map(async ([k, v]) => [k, { sha256: await sha256Hex(v), size: v.length }]))),
    };
    for (const [k, v] of Object.entries(own)) await store.saveFileToStaging(channel, 2, k, v, manifest.files[k].sha256);
    return manifest;
  }

  it('Scenario: a partial stable pack is activated and loaded merged with the baseline', async () => {
    const manifest = await install('stable', { 'pack.yaml': packYaml(2) });
    await store.activateStaging('stable', 2, manifest, baseline);

    const pack = await store.loadActivePack('stable', baseline);
    expect(pack?.pack.contentVersion).toBe(2);
    expect(pack?.worlds['world-1'].config.id).toBe('world-1');
    expect(pack?.worlds['world-1'].text?.es).toBe(worldEs);
  });

  it('Scenario: Beta never uses the baseline, so a partial beta pack cannot be activated', async () => {
    const manifest = await install('beta', { 'pack.yaml': packYaml(2) });
    await expect(store.activateStaging('beta', 2, manifest, baseline)).rejects.toThrow(/incomplete pack/);
  });

  it('Scenario: a baseline file whose hash differs from the manifest is not used', async () => {
    const manifest = await install('stable', { 'pack.yaml': packYaml(2) });
    manifest.files['worlds/world-1/es.md'].sha256 = await sha256Hex('something else');
    await expect(store.activateStaging('stable', 2, manifest, baseline)).rejects.toThrow(/incomplete pack/);
  });

  it('Scenario: merged pack fails validation, so the previous content stays active', async () => {
    const manifest = await install('stable', { 'pack.yaml': packYaml(2) });
    await store.activateStaging('stable', 2, manifest, baseline);

    // v3: the baseline's lesson is held but no trail places it, so the merged pack is invalid
    const bad = { ...baseline, pack: { ...baseline.pack, lessons: { 'theory-x': { config: { id: 'theory-x', kind: 'theory' } as any, text: {}, files: [] } } } };
    const lessonYaml = 'id: theory-x\nkind: theory';
    bad.hashes = { ...baseline.hashes, 'lessons/theory-x/lesson.yaml': await sha256Hex(lessonYaml) };
    const m3 = await install('stable', {});
    m3.contentVersion = 3;
    m3.files['lessons/theory-x/lesson.yaml'] = { sha256: bad.hashes['lessons/theory-x/lesson.yaml'], size: 1 };
    m3.files['pack.yaml'] = { sha256: baseline.hashes['pack.yaml'], size: 1 };
    await files.makeDirectory(store.getStagingDir('stable', 3));
    await files.writeAsString(`${store.getStagingDir('stable', 3)}/pack.yaml`, packYaml(1));
    await expect(store.activateStaging('stable', 3, m3, bad)).rejects.toThrow(/invalid pack/);
    expect((await store.getActivePointer('stable'))?.contentVersion).toBe(2);
  });
});
