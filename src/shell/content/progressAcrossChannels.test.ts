import {
  isWorldComplete,
  stopLock,
  stopsOf,
  type Progress,
  type WorldDef,
} from '../world';
import { newDogRecord, type DogRecord } from '../dogRecord';
import { BASELINE_PACK } from './baseline.generated';
import { resolvePack } from './resolver';
import { switchChannel } from './channelSwitcher';
import { setActiveContent, getActiveContent } from './runtime';
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
    return this.files.has(n) || this.dirs.has(n);
  }

  async deleteFile(p: string): Promise<void> {
    this.files.delete(this.norm(p));
  }

  async deleteDirectory(p: string): Promise<void> {
    const prefix = `${this.norm(p)}/`;
    for (const k of [...this.files.keys()]) {
      if (k.startsWith(prefix)) this.files.delete(k);
    }
    for (const d of [...this.dirs]) {
      if (d === this.norm(p) || d.startsWith(prefix)) this.dirs.delete(d);
    }
  }

  async makeDirectory(p: string): Promise<void> {
    const parts = this.norm(p).split('/');
    for (let i = 1; i <= parts.length; i++) this.dirs.add(parts.slice(0, i).join('/'));
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

describe('Progress rules across content updates and channels (Task 5.4)', () => {
  describe('Scenario 1: Reordered trail & inserted Nodes', () => {
    const originalWorld: WorldDef = {
      id: 'world-alpha',
      worldNumber: 1,
      title: 'lesson.noticeLabel' as any,
      topics: 'lesson.noticeLabel' as any,
      stretches: [
        [
          { kind: 'node', id: 'node-1' },
          { kind: 'node', id: 'node-2' },
          { kind: 'node', id: 'node-3' },
        ],
      ],
    };

    it('keeps completed stops completed and follows new order for the next open stop', () => {
      // User has completed node-1 and node-2
      const progress: Progress = {
        completedNodes: ['node-1', 'node-2'],
        readLessons: [],
        missions: {},
        legacyNodes: [],
      };

      // Trail is reordered: node-2 first, then node-1, then new inserted node-inserted, then node-3
      const reorderedWorld: WorldDef = {
        ...originalWorld,
        stretches: [
          [
            { kind: 'node', id: 'node-2' },
            { kind: 'node', id: 'node-1' },
            { kind: 'node', id: 'node-inserted' },
            { kind: 'node', id: 'node-3' },
          ],
        ],
      };

      // Completed stops stay completed
      expect(progress.completedNodes).toContain('node-1');
      expect(progress.completedNodes).toContain('node-2');

      // The next open stop is node-inserted (previous stops node-2 and node-1 are done)
      expect(stopLock({ kind: 'node', id: 'node-inserted' }, progress, [reorderedWorld])).toBeNull();

      // node-3 is locked waiting for node-inserted
      const lockForNode3 = stopLock({ kind: 'node', id: 'node-3' }, progress, [reorderedWorld]);
      expect(lockForNode3).not.toBeNull();
      expect(lockForNode3).toEqual({ kind: 'stops', stops: [{ kind: 'node', id: 'node-inserted' }] });
    });

    it('preserves World completion when new Nodes are inserted into an already completed World', () => {
      // User has completed the entire original World
      const progress: Progress = {
        completedNodes: ['node-1', 'node-2', 'node-3'],
        readLessons: [],
        missions: {},
        legacyNodes: [],
      };

      expect(isWorldComplete(originalWorld, progress)).toBe(true);

      // An update inserts node-inserted into the first stretch ahead of node-3
      const updatedWorld: WorldDef = {
        ...originalWorld,
        stretches: [
          [
            { kind: 'node', id: 'node-1' },
            { kind: 'node', id: 'node-inserted' },
            { kind: 'node', id: 'node-2' },
            { kind: 'node', id: 'node-3' },
          ],
        ],
      };

      // Even though node-inserted is not in completedNodes, node-2 and node-3 after it were completed!
      // So World completion is unaffected (grandfathered/satisfied rule).
      expect(isWorldComplete(updatedWorld, progress)).toBe(true);
    });
  });

  describe('Scenario 2: Retired Node', () => {
    it('preserves progress and Stars when a Node is retired and no longer on the trail', () => {
      const record: DogRecord = {
        ...newDogRecord(),
        completedNodes: ['calm-hands', 'harness-ritual', 'retired-node-xyz'],
        stars: {
          'calm-hands': 3,
          'harness-ritual': 3,
          'retired-node-xyz': 2,
        },
      };

      // A world where retired-node-xyz has been removed from the trail
      const activeWorld: WorldDef = {
        id: 'world-1',
        worldNumber: 1,
        title: 'lesson.noticeLabel' as any,
        topics: 'lesson.noticeLabel' as any,
        stretches: [
          [
            { kind: 'node', id: 'calm-hands' },
            { kind: 'node', id: 'doorbell-mat' },
          ],
        ],
      };

      // Retired stop does not appear on trail
      const stops = stopsOf(activeWorld);
      expect(stops.find((s) => s.id === 'retired-node-xyz')).toBeUndefined();

      // Dog record still keeps completed id and stars intact
      expect(record.completedNodes).toContain('retired-node-xyz');
      expect(record.stars['retired-node-xyz']).toBe(2);

      // Other stops on the trail remain valid and checkable
      const lock = stopLock({ kind: 'node', id: 'doorbell-mat' }, record, [activeWorld]);
      expect(lock).toBeNull(); // calm-hands is done, so doorbell-mat is open
    });
  });

  describe('Scenario 3: Progress on beta-only content across channel switch', () => {
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

    async function hostBetaPackWithNode(nodeId: string) {
      const files: Record<string, string> = {
        'pack.yaml': `
formatVersion: 1
minAppVersion: "1.0.0"
languages:
  - es
retired: []
`.trim(),
        'worlds/world-beta.yaml': `
id: world-beta
worldNumber: 1
tier: free
stretches:
  - - kind: node
      id: ${nodeId}
`.trim(),
        'worlds/world-beta/es.md': `
# World Beta
## topics
Beta Topics
`.trim(),
        [`nodes/${nodeId}/node.yaml`]: `
id: ${nodeId}
mode: minigame
prerequisites: []
simulation:
  minigame: calm-first
`.trim(),
        [`nodes/${nodeId}/es.md`]: `
# Beta Node Title
## primer
Beta primer text
`.trim(),
      };

      const manifestFiles: Record<string, { sha256: string; size: number }> = {};
      for (const [relPath, content] of Object.entries(files)) {
        const hash = await sha256Hex(content);
        manifestFiles[relPath] = { sha256: hash, size: Buffer.byteLength(content) };
        const ext = relPath.includes('.') ? `.${relPath.split('.').pop()}` : '';
        server.setRoute(`${CONTENT_BASE}/beta/files/${hash}${ext}`, content);
      }

      const manifest: ContentManifest = {
        channel: 'beta',
        contentVersion: 2,
        formatVersion: 1,
        minAppVersion: '1.0.0',
        createdAt: '2026-11-06T18:00:00Z',
        files: manifestFiles,
      };

      server.setRoute(
        `${CONTENT_BASE}/beta/latest.json`,
        JSON.stringify({
          channel: 'beta',
          contentVersion: 2,
          formatVersion: 1,
          minAppVersion: '1.0.0',
          manifestPath: 'packs/2/manifest.json',
          manifestHash: 'hash',
          createdAt: '2026-11-06T18:00:00Z',
        })
      );

      server.setRoute(`${CONTENT_BASE}/beta/packs/2/manifest.json`, JSON.stringify(manifest));
    }

    it('preserves beta-only progress in DogRecord when switching back to stable', async () => {
      // Start on stable with baseline pack
      setActiveContent({
        channel: 'stable',
        isBaseline: true,
        contentVersion: 1,
        pack: BASELINE_PACK,
        resolved: resolvePack(BASELINE_PACK, 'es'),
      });

      // User dog record
      let record: DogRecord = {
        ...newDogRecord(),
        completedNodes: ['calm-hands'],
        stars: { 'calm-hands': 3 },
      };

      // 1. Host beta pack that has a beta-only node: 'beta-agility-challenge'
      await hostBetaPackWithNode('beta-agility-challenge');

      // Switch to beta channel
      const switchResult = await switchChannel({
        channel: 'beta',
        store,
        updater,
        kvStorage,
        contentBase: CONTENT_BASE,
      });

      expect(switchResult.success).toBe(true);
      expect(getActiveContent().channel).toBe('beta');
      expect(getActiveContent().pack.nodes['beta-agility-challenge']).toBeDefined();

      // 2. User completes the beta-only node
      record = {
        ...record,
        completedNodes: [...record.completedNodes, 'beta-agility-challenge'],
        stars: {
          ...record.stars,
          'beta-agility-challenge': 3,
        },
      };

      expect(record.completedNodes).toContain('beta-agility-challenge');

      // 3. Switch back to stable channel (which falls back to baseline since no remote stable was fetched)
      const switchBackResult = await switchChannel({
        channel: 'stable',
        store,
        updater,
        kvStorage,
        contentBase: CONTENT_BASE,
      });

      expect(switchBackResult.success).toBe(true);
      expect(getActiveContent().channel).toBe('stable');

      // On stable channel:
      // The stable pack does not have 'beta-agility-challenge'
      expect(getActiveContent().pack.nodes['beta-agility-challenge']).toBeUndefined();

      // But the Dog record's completedNodes and stars STILL contain 'beta-agility-challenge'!
      expect(record.completedNodes).toContain('beta-agility-challenge');
      expect(record.stars['beta-agility-challenge']).toBe(3);

      // Stable trail operations ignore unknown completed node without error
      const stableWorlds = getActiveContent().resolved.worlds;
      const isComplete = isWorldComplete(stableWorlds[0], record);
      expect(typeof isComplete).toBe('boolean');

      // 4. Switching back to beta restores access to the beta node as already completed!
      const reSwitchBeta = await switchChannel({
        channel: 'beta',
        store,
        updater,
        kvStorage,
        contentBase: CONTENT_BASE,
      });
      expect(reSwitchBeta.success).toBe(true);
      expect(getActiveContent().channel).toBe('beta');
      expect(record.completedNodes).toContain('beta-agility-challenge');
    });
  });
});
