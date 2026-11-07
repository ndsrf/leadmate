import { BASELINE_PACK } from './baseline.generated';
import { ContentManifest, ContentManifestFile, LatestPointer } from './build';
import { switchChannel } from './channelSwitcher';
import { channelFileUrl, channelLatestUrl, channelManifestUrl } from './config';
import { sha256Hex } from './hash';
import { getActiveContent, initContentRuntime, setActiveContent } from './runtime';
import { ContentStore, type FileStorage, type KeyValueStorage } from './store';
import { ContentUpdater, type HttpFetcher, type HttpResponse } from './updater';
import { WORLDS, findWorld, stopsOf } from '../world';
import { findLesson, LESSONS } from '../lessons/content';
import { es } from '../../i18n';

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

class FakeRemoteHost implements HttpFetcher {
  routes = new Map<string, { status: number; body: string | Uint8Array }>();
  offline = false;

  setRoute(url: string, body: string | Uint8Array, status = 200) {
    this.routes.set(url, { status, body });
  }

  async fetch(url: string): Promise<HttpResponse> {
    if (this.offline) {
      throw new Error(`Network offline: could not reach ${url}`);
    }
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

describe('Task 7.1 End-to-End Verification Scenario', () => {
  const CONTENT_BASE = 'https://remote-storage.example.com/content';
  let server: FakeRemoteHost;
  let fileStorage: MemoryFileStorage;
  let kvStorage: MemoryKeyValueStorage;
  let store: ContentStore;
  let updater: ContentUpdater;

  beforeEach(() => {
    setActiveContent(null);
    server = new FakeRemoteHost();
    fileStorage = new MemoryFileStorage();
    kvStorage = new MemoryKeyValueStorage();
    store = new ContentStore(fileStorage, kvStorage, '/app/content');
    updater = new ContentUpdater(store, fileStorage, kvStorage, server);
  });

  afterEach(() => {
    setActiveContent(null);
  });

  it('publishes beta with edited lesson, new lesson with image & Spanish-only video, reorder, retirement; verifies stable baseline, immediate beta switch, offline rollback, and corrupt manifest rejection', async () => {
    // -------------------------------------------------------------------------
    // 1. SETUP PUBLISHED STORAGE
    // -------------------------------------------------------------------------
    // Stable: published unchanged (matches baseline)
    const stableFiles: Record<string, string> = {
      'pack.yaml': 'formatVersion: 1\nminAppVersion: 1.0.0\nlanguages:\n  - es\nretired: []\n',
      'worlds/basics.yaml': 'id: basics\nworldNumber: 1\ntier: free\nstretches:\n  - - kind: lesson\n      id: calm-leash\n',
      'worlds/basics/es.md': '# Fundamentos\n\n## topics\nBásicos\n',
      'lessons/calm-leash/lesson.yaml': 'id: calm-leash\nkind: theory\nday: 1\nsteps: 3\ntakeaways: 2\n',
      'lessons/calm-leash/es.md': '# Paseo tranquilo\n\n## heading\nEncabezado original\n\n## hook\nGancho original\n\n## why\nPor qué original\n\n## steps\n1. Paso 1\n2. Paso 2\n3. Paso 3\n\n## example\n### Ejemplo\nEjemplo original\n\n## compare\n### do\nHacer\n### dont\nNo hacer\n\n## tip\nConsejo original\n\n## takeaways\n- Punto 1\n- Punto 2\n',
    };

    const hostFiles = async (channel: 'beta' | 'stable', version: number, filesMap: Record<string, string | Uint8Array>) => {
      const manifestFiles: Record<string, ContentManifestFile> = {};
      for (const [relPath, content] of Object.entries(filesMap)) {
        const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
        const hash = await sha256Hex(bytes);
        manifestFiles[relPath] = { sha256: hash, size: bytes.length };
        const ext = relPath.includes('.') ? `.${relPath.split('.').pop()}` : '';
        const fileUrl = channelFileUrl(channel, `${hash}${ext}`, CONTENT_BASE)!;
        server.setRoute(fileUrl, bytes);
      }

      const manifest: ContentManifest = {
        channel,
        contentVersion: version,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        files: manifestFiles,
      };

      const manifestStr = JSON.stringify(manifest, null, 2);
      const manifestHash = await sha256Hex(new TextEncoder().encode(manifestStr));
      const manifestPath = `packs/${version}/manifest.json`;
      const manifestUrl = channelManifestUrl(channel, manifestPath, CONTENT_BASE)!;
      server.setRoute(manifestUrl, manifestStr);

      const latest: LatestPointer = {
        channel,
        contentVersion: version,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        manifestPath,
        manifestHash,
        createdAt: new Date().toISOString(),
      };
      const latestUrl = channelLatestUrl(channel, CONTENT_BASE)!;
      server.setRoute(latestUrl, JSON.stringify(latest, null, 2));
    };

    await hostFiles('stable', 1, stableFiles);

    // Beta:
    // a) one edited Lesson (calm-leash with edited title and hook)
    // b) one new Lesson (special-lesson with image special.png and Spanish-only video)
    // c) a reorder (special-lesson placed first in stretch 0)
    // d) a retirement (retired-old-stop listed in pack.yaml retired)
    const specialPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header magic bytes
    const betaFiles: Record<string, string | Uint8Array> = {
      'pack.yaml': 'formatVersion: 1\nminAppVersion: 1.0.0\nlanguages:\n  - es\nretired:\n  - retired-old-stop\n',
      'worlds/basics.yaml': 'id: basics\nworldNumber: 1\ntier: free\nstretches:\n  - - kind: lesson\n      id: special-lesson\n    - kind: lesson\n      id: calm-leash\n',
      'worlds/basics/es.md': '# Fundamentos Beta\n\n## topics\nBásicos en beta\n',
      'lessons/calm-leash/lesson.yaml': 'id: calm-leash\nkind: theory\nday: 1\nsteps: 3\ntakeaways: 2\n',
      'lessons/calm-leash/es.md': '# Paseo tranquilo EDITADO\n\n## heading\nEncabezado editado en beta\n\n## hook\nGancho editado en beta\n\n## why\nPor qué editado\n\n## steps\n1. Paso 1 beta\n2. Paso 2 beta\n3. Paso 3 beta\n\n## example\n### Ejemplo\nEjemplo editado\n\n## compare\n### do\nHacer bien\n### dont\nNo tirar\n\n## tip\nConsejo beta\n\n## takeaways\n- Punto 1 beta\n- Punto 2 beta\n',
      'lessons/special-lesson/lesson.yaml': 'id: special-lesson\nkind: theory\nimages:\n  - special.png\nyoutube:\n  es: dQw4w9WgXcQ\nsteps: 3\ntakeaways: 2\n',
      'lessons/special-lesson/media/special.png': specialPngBytes,
      'lessons/special-lesson/es.md': '# Lección Especial\n\n## heading\nTécnica especial\n\n## hook\nAprende la técnica especial\n\n## why\nMejora el foco\n\n## steps\n1. Observa\n2. Recompensa\n3. Avanza\n\n## example\n### Ejemplo\nEjemplo en parque\n\n## compare\n### do\nPremia con calma\n### dont\nNo des tirones\n\n## tip\nPrueba esto hoy en el paseo\n\n## takeaways\n- Siempre con calma\n- Paciencia diaria\n\n## images\n### special.png\n- alt: Perro en posición calmada\n- caption: Foto de la técnica\n',
    };

    await hostFiles('beta', 2, betaFiles);

    // -------------------------------------------------------------------------
    // 2. INSTALLED BUILD STARTUP ON STABLE
    // -------------------------------------------------------------------------
    // Initial launch: default channel is stable, using bundled baseline
    const app = await initContentRuntime({
      channel: 'stable',
      store,
      kvStorage,
      updater,
    });

    expect(app.channel).toBe('stable');
    expect(app.isBaseline).toBe(true);

    // Verify Stable shows the baseline trail:
    // `calm-leash` is present with baseline title, `special-lesson` is absent
    const baselineBasics = findWorld('basics');
    expect(baselineBasics).toBeDefined();
    expect(findLesson('special-lesson')).toBeUndefined();
    const calmBaseline = findLesson('calm-leash');
    expect(calmBaseline).toBeDefined();

    // -------------------------------------------------------------------------
    // 3. SWITCHING TO BETA SHOWS NEW CONTENT IMMEDIATELY
    // -------------------------------------------------------------------------
    const switchRes = await switchChannel({
      channel: 'beta',
      store,
      updater,
      kvStorage,
      contentBase: CONTENT_BASE,
    });

    expect(switchRes.success).toBe(true);
    expect(switchRes.channel).toBe('beta');

    const activeBeta = getActiveContent();
    expect(activeBeta.channel).toBe('beta');
    expect(activeBeta.contentVersion).toBe(2);

    // a) Verify reorder on the trail: `special-lesson` comes first in stretch 0
    const betaBasics = findWorld('basics')!;
    expect(betaBasics.stretches[0][0]).toEqual({ kind: 'lesson', id: 'special-lesson' });
    expect(betaBasics.stretches[0][1]).toEqual({ kind: 'lesson', id: 'calm-leash' });

    // b) Verify edited lesson: title & catalog text updated
    const calmEdited = findLesson('calm-leash')!;
    expect(es[calmEdited.title]).toBe('Paseo tranquilo EDITADO');

    // c) Verify new lesson: image and Spanish-only YouTube video present
    const special = findLesson('special-lesson')!;
    expect(special).toBeDefined();
    expect(special.blocks.some((b) => b.type === 'image')).toBe(true);
    const videoBlock = special.blocks.find((b) => b.type === 'video');
    expect(videoBlock).toBeDefined();
    expect(videoBlock).toMatchObject({
      source: { kind: 'youtube', id: 'dQw4w9WgXcQ' },
    });

    // d) Verify retirement: `retired-old-stop` is registered as retired in pack
    expect(activeBeta.pack.pack.retired).toContain('retired-old-stop');

    // -------------------------------------------------------------------------
    // 4. SWITCHING BACK TO STABLE WORKS OFFLINE
    // -------------------------------------------------------------------------
    // Simulate going completely offline
    server.offline = true;

    const rollbackRes = await switchChannel({
      channel: 'stable',
      store,
      updater,
      kvStorage,
      contentBase: CONTENT_BASE,
    });

    expect(rollbackRes.success).toBe(true);
    expect(rollbackRes.channel).toBe('stable');
    expect(rollbackRes.offlineCached).toBe(true);

    const activeStable = getActiveContent();
    expect(activeStable.channel).toBe('stable');

    // Stable trail is restored immediately offline:
    // `special-lesson` is no longer on the trail
    expect(findLesson('special-lesson')).toBeUndefined();
    expect(findWorld('basics')!.stretches[0].some((s) => s.id === 'special-lesson')).toBe(false);

    // -------------------------------------------------------------------------
    // 5. CORRUPT MANIFEST IS IGNORED WITHOUT BREAKING ACTIVE CONTENT
    // -------------------------------------------------------------------------
    // Bring network back online, but serve corrupt manifest for beta v3
    server.offline = false;

    const corruptLatest: LatestPointer = {
      channel: 'beta',
      contentVersion: 3,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      manifestPath: 'packs/3/manifest.json',
      manifestHash: 'bad-hash',
      createdAt: new Date().toISOString(),
    };
    const betaLatestUrl = channelLatestUrl('beta', CONTENT_BASE)!;
    server.setRoute(betaLatestUrl, JSON.stringify(corruptLatest));

    // Corrupt manifest route returns broken invalid JSON
    const betaV3ManifestUrl = channelManifestUrl('beta', 'packs/3/manifest.json', CONTENT_BASE)!;
    server.setRoute(betaV3ManifestUrl, '{ "corrupted": INVALID_JSON ...');

    // Launch background update check on beta
    const updateCheck = await updater.checkAndDownloadUpdate({
      channel: 'beta',
      currentAppVersion: '1.0.0',
      contentBase: CONTENT_BASE,
    });

    // Update check fails gracefully
    expect(updateCheck.updated).toBe(false);

    // Local cached beta pack v2 remains completely untouched and valid
    const cachedBeta = await store.loadActivePack('beta');
    expect(cachedBeta).not.toBeNull();
    expect(cachedBeta?.pack?.formatVersion).toBe(1);
    expect(cachedBeta?.lessons?.['special-lesson']).toBeDefined();

    // Active session still functional
    expect(getActiveContent().channel).toBe('stable');
  });
});
