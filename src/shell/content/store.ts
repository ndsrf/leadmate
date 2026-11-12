import { BASELINE_PACK } from './baseline.generated';
import { BASELINE_HASHES } from './baseline.hashes.generated';
import { parseYaml, type LessonYaml, type MissionYaml, type NodeYaml, type PackYaml, type WorldYaml } from './schema';
import { type ContentManifest } from './build';
import { sha256Hex } from './hash';
import { validatePack, type ContentPack } from './validator';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface FileStorage {
  readAsString(path: string): Promise<string>;
  writeAsString(path: string, contents: string): Promise<void>;
  readAsBinary(path: string): Promise<Uint8Array>;
  writeAsBinary(path: string, data: Uint8Array): Promise<void>;
  exists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  /** Creates the folder and any missing parents (mkdir -p). */
  makeDirectory(path: string): Promise<void>;
  listDirectory(path: string): Promise<string[]>;
  copy(from: string, to: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
}

export interface ActivePackPointer {
  channel: 'beta' | 'stable';
  contentVersion: number;
  formatVersion: number;
  minAppVersion: string;
  activatedAt: string;
  manifest: ContentManifest;
}

/**
 * The bundled baseline as a stored copy: the parsed stable pack plus the sha256 of each text and structure file it
 * holds (relative path -> hash). Stable only; Beta never uses it.
 */
export interface BaselineSource {
  pack: ContentPack;
  hashes: Record<string, string>;
}

/** The baseline bundled with this build, used by default for Stable. */
export const DEFAULT_BASELINE: BaselineSource = { pack: BASELINE_PACK, hashes: BASELINE_HASHES };

/** What a partial pack may borrow from the baseline: the pack to read from and which files it holds. */
interface BaselineFill {
  pack: ContentPack;
  has(relPath: string): boolean;
}

/**
 * A file counts as supplied by the baseline when the manifest lists it with exactly the hash the baseline holds.
 * A file the manifest does not list (retired) is never supplied.
 */
export function baselineFillFor(baseline: BaselineSource | undefined, manifest: ContentManifest | undefined): BaselineFill | undefined {
  if (!baseline || !manifest) return undefined;
  return {
    pack: baseline.pack,
    has: (relPath) => {
      const want = manifest.files[relPath]?.sha256;
      const held = baseline.hashes[relPath];
      return !!want && !!held && want.toLowerCase() === held.toLowerCase();
    },
  };
}

type TextMap = Record<string, any>;

/**
 * Loads a ContentPack structure from an abstract FileStorage. With `fill`, files the folder lacks but the baseline
 * holds (same hash as the manifest) are taken from the baseline: the merged result is the pack's active content.
 */
export async function loadPackFromStorage(files: FileStorage, packDir: string, fill?: BaselineFill): Promise<ContentPack> {
  const packFilePath = `${packDir}/pack.yaml`;
  let packYaml: PackYaml;
  if (await files.exists(packFilePath)) {
    packYaml = parseYaml<PackYaml>(await files.readAsString(packFilePath));
  } else if (fill?.has('pack.yaml')) {
    packYaml = fill.pack.pack;
  } else {
    throw new Error(`pack.yaml not found at ${packFilePath}`);
  }

  const result: ContentPack = {
    rootPath: packDir,
    pack: packYaml,
    worlds: {},
    lessons: {},
    nodes: {},
    missions: {},
  };

  const listIfExists = async (dir: string): Promise<string[]> => ((await files.exists(dir)) ? files.listDirectory(dir) : []);

  /** Text files of `dir` by language, with the baseline's text for languages the folder lacks. */
  const loadText = async (dir: string, relDir: string, baseText: TextMap | undefined): Promise<TextMap> => {
    const text: TextMap = {};
    if (await files.exists(dir)) {
      for (const f of await files.listDirectory(dir)) {
        if (f.endsWith('.md')) text[f.replace(/\.md$/, '')] = await files.readAsString(`${dir}/${f}`);
      }
    }
    if (fill && baseText) {
      for (const lang of Object.keys(baseText)) {
        if (!(lang in text) && fill.has(`${relDir}/${lang}.md`)) text[lang] = baseText[lang];
      }
    }
    return text;
  };

  // 1. Worlds
  const worldsDir = `${packDir}/worlds`;
  const worldIds = new Set<string>();
  for (const name of await listIfExists(worldsDir)) {
    if (name.endsWith('.yaml') || name.endsWith('.yml')) worldIds.add(name.replace(/\.ya?ml$/, ''));
  }
  if (fill) for (const id of Object.keys(fill.pack.worlds)) worldIds.add(id);
  for (const id of worldIds) {
    const yamlName = (await files.exists(`${worldsDir}/${id}.yaml`)) ? `${id}.yaml` : `${id}.yml`;
    let config: WorldYaml;
    if (await files.exists(`${worldsDir}/${yamlName}`)) {
      config = parseYaml<WorldYaml>(await files.readAsString(`${worldsDir}/${yamlName}`));
    } else if (fill?.has(`worlds/${id}.yaml`) && fill.pack.worlds[id]) {
      config = fill.pack.worlds[id].config;
    } else {
      continue;
    }
    const text = await loadText(`${worldsDir}/${id}`, `worlds/${id}`, fill?.pack.worlds[id]?.text);
    result.worlds[id] = { config, text };
  }

  // 2. Lessons, 3. Nodes, 4. Missions: same shape, different folder and config file
  const items: Array<{ key: 'lessons' | 'nodes' | 'missions'; cfg: string }> = [
    { key: 'lessons', cfg: 'lesson.yaml' },
    { key: 'nodes', cfg: 'node.yaml' },
    { key: 'missions', cfg: 'mission.yaml' },
  ];
  for (const { key, cfg } of items) {
    const dir = `${packDir}/${key}`;
    const ids = new Set<string>(await listIfExists(dir));
    if (fill) for (const id of Object.keys(fill.pack[key])) ids.add(id);
    for (const id of ids) {
      const itemDir = `${dir}/${id}`;
      const configFile = `${itemDir}/${cfg}`;
      const baseItem = fill?.pack[key][id];
      let config: any;
      if (await files.exists(configFile)) {
        config = parseYaml<any>(await files.readAsString(configFile));
      } else if (baseItem && fill?.has(`${key}/${id}/${cfg}`)) {
        config = baseItem.config;
      } else {
        continue;
      }
      const text = await loadText(itemDir, `${key}/${id}`, baseItem?.text);
      const mediaFiles: string[] = [];
      const mediaDir = `${itemDir}/media`;
      if (await files.exists(mediaDir)) {
        for (const m of await files.listDirectory(mediaDir)) mediaFiles.push(`media/${m}`);
      }
      result[key][id] = { config, text, files: mediaFiles };
    }
  }

  return result;
}

export class ContentStore {
  constructor(
    private files: FileStorage,
    private kv: KeyValueStorage,
    private rootDir: string
  ) {}

  getChannelDir(channel: 'beta' | 'stable'): string {
    return `${this.rootDir}/${channel}`;
  }

  getStagingDir(channel: 'beta' | 'stable', version: number): string {
    return `${this.getChannelDir(channel)}/staging/${version}`;
  }

  getActiveDir(channel: 'beta' | 'stable'): string {
    return `${this.getChannelDir(channel)}/active`;
  }

  getPreviousDir(channel: 'beta' | 'stable'): string {
    return `${this.getChannelDir(channel)}/previous`;
  }

  private getPointerKey(channel: 'beta' | 'stable'): string {
    return `@leadmate:content_active_${channel}`;
  }

  async getActivePointer(channel: 'beta' | 'stable'): Promise<ActivePackPointer | null> {
    const raw = await this.kv.getItem(this.getPointerKey(channel));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Saves a downloaded file into staging, verifying its SHA-256 hash against the expected hash.
   * If the hash mismatches, throws an Error and ensures no corrupt file remains.
   */
  async saveFileToStaging(
    channel: 'beta' | 'stable',
    version: number,
    relPath: string,
    data: Uint8Array | string,
    expectedHash: string
  ): Promise<void> {
    const computedHash = await sha256Hex(data);
    if (computedHash.toLowerCase() !== expectedHash.toLowerCase()) {
      throw new Error(`Hash mismatch for ${relPath}: expected ${expectedHash}, got ${computedHash}`);
    }

    const stagingDir = this.getStagingDir(channel, version);
    const destPath = `${stagingDir}/${relPath}`;

    // Ensure parent directory exists
    const parts = destPath.split('/');
    parts.pop();
    const parentDir = parts.join('/');
    await this.ensureDirectory(parentDir);

    if (typeof data === 'string') {
      await this.files.writeAsString(destPath, data);
    } else {
      await this.files.writeAsBinary(destPath, data);
    }
  }

  /**
   * Performs the atomic flip:
   * 1. Verifies that all required files in the manifest are present in staging.
   * 2. Runs validatePack on the staging pack.
   * 3. Moves current active to previous (retaining for rollback).
   * 4. Moves staging to active.
   * 5. Updates AsyncStorage active pointer.
   * 6. Cleans up old staging directories.
   */
  async activateStaging(
    channel: 'beta' | 'stable',
    version: number,
    manifest: ContentManifest,
    baseline: BaselineSource | undefined = DEFAULT_BASELINE
  ): Promise<ActivePackPointer> {
    const fill = channel === 'stable' ? baselineFillFor(baseline, manifest) : undefined;
    const stagingDir = this.getStagingDir(channel, version);
    if (!(await this.files.exists(stagingDir))) {
      throw new Error(`Staging directory does not exist: ${stagingDir}`);
    }

    // 1. Check all manifest files exist in staging
    const missing: string[] = [];
    for (const filePath of Object.keys(manifest.files)) {
      if (!(await this.files.exists(`${stagingDir}/${filePath}`)) && !fill?.has(filePath)) {
        missing.push(filePath);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Cannot activate incomplete pack: missing ${missing.length} file(s) (${missing.slice(0, 3).join(', ')})`);
    }

    // 2. Load and validate pack in staging, merged with the baseline for the files it supplies. A failure throws
    // before anything moves, so the previous content stays active.
    const stagingPack = await loadPackFromStorage(this.files, stagingDir, fill);
    const report = validatePack(stagingPack);
    if (!report.valid) {
      const msgs = report.errors.map((e) => e.message).join('; ');
      throw new Error(`Cannot activate invalid pack: ${msgs}`);
    }

    // Also write manifest.json to staging so active pack is self-contained
    await this.files.writeAsString(`${stagingDir}/manifest.json`, JSON.stringify(manifest, null, 2));

    const channelDir = this.getChannelDir(channel);
    const activeDir = this.getActiveDir(channel);
    const prevDir = this.getPreviousDir(channel);

    // 3. Atomic Flip:
    // Move current active to previous
    if (await this.files.exists(activeDir)) {
      if (await this.files.exists(prevDir)) {
        await this.files.deleteDirectory(prevDir);
      }
      await this.files.move(activeDir, prevDir);
    }

    // Move staging to active
    await this.files.move(stagingDir, activeDir);

    // 4. Update pointer in AsyncStorage
    const pointer: ActivePackPointer = {
      channel,
      contentVersion: version,
      formatVersion: manifest.formatVersion,
      minAppVersion: manifest.minAppVersion,
      activatedAt: new Date().toISOString(),
      manifest,
    };
    await this.kv.setItem(this.getPointerKey(channel), JSON.stringify(pointer));

    // 5. Cleanup other staging directories
    try {
      const stagingParent = `${channelDir}/staging`;
      if (await this.files.exists(stagingParent)) {
        await this.files.deleteDirectory(stagingParent);
      }
    } catch {
      // Non-fatal
    }

    return pointer;
  }

  /**
   * Rolls back from active to previous version if available.
   */
  async rollbackToPrevious(channel: 'beta' | 'stable'): Promise<boolean> {
    const activeDir = this.getActiveDir(channel);
    const prevDir = this.getPreviousDir(channel);

    if (!(await this.files.exists(prevDir))) {
      return false;
    }

    if (await this.files.exists(activeDir)) {
      await this.files.deleteDirectory(activeDir);
    }
    await this.files.move(prevDir, activeDir);

    // Reconstruct pointer from manifest.json if present
    const manifestFile = `${activeDir}/manifest.json`;
    if (await this.files.exists(manifestFile)) {
      try {
        const manifestText = await this.files.readAsString(manifestFile);
        const manifest: ContentManifest = JSON.parse(manifestText);
        const pointer: ActivePackPointer = {
          channel,
          contentVersion: manifest.contentVersion,
          formatVersion: manifest.formatVersion,
          minAppVersion: manifest.minAppVersion,
          activatedAt: new Date().toISOString(),
          manifest,
        };
        await this.kv.setItem(this.getPointerKey(channel), JSON.stringify(pointer));
      } catch {
        // Leave pointer as is
      }
    }

    return true;
  }

  /**
   * Loads the active pack for a channel.
   * If cache is corrupt or missing, falls back to previous version or null (for baseline fallback).
   */
  async loadActivePack(channel: 'beta' | 'stable', baseline: BaselineSource | undefined = DEFAULT_BASELINE): Promise<ContentPack | null> {
    const pointer = await this.getActivePointer(channel);
    if (!pointer) {
      return null;
    }
    // Stable only: the installed pack's files, with the baseline filling any file the pack lacks.
    const fill = channel === 'stable' ? baselineFillFor(baseline, pointer.manifest) : undefined;

    const activeDir = this.getActiveDir(channel);
    const packFile = `${activeDir}/pack.yaml`;

    if (!(await this.files.exists(packFile)) && !fill?.has('pack.yaml')) {
      // Corrupt cache: pack.yaml missing from active directory
      const rolledBack = await this.rollbackToPrevious(channel);
      if (rolledBack) {
        return this.loadActivePack(channel, baseline);
      }
      // Cannot rollback; remove corrupt pointer
      await this.kv.removeItem(this.getPointerKey(channel));
      return null;
    }

    try {
      const pack = await loadPackFromStorage(this.files, activeDir, fill);
      const report = validatePack(pack);
      if (!report.valid) {
        // Corrupt content; attempt rollback
        const rolledBack = await this.rollbackToPrevious(channel);
        if (rolledBack) {
          return this.loadActivePack(channel, baseline);
        }
        await this.kv.removeItem(this.getPointerKey(channel));
        return null;
      }
      return pack;
    } catch {
      // Parse or load failure; attempt rollback to previous version
      const rolledBack = await this.rollbackToPrevious(channel);
      if (rolledBack) {
        return this.loadActivePack(channel, baseline);
      }
      await this.kv.removeItem(this.getPointerKey(channel));
      return null;
    }
  }

  /**
   * Garbage collects unreferenced files in the channel's shared storage.
   */
  async garbageCollect(channel: 'beta' | 'stable', keepHashes: Set<string>): Promise<number> {
    const filesDir = `${this.getChannelDir(channel)}/files`;
    if (!(await this.files.exists(filesDir))) {
      return 0;
    }

    const entries = await this.files.listDirectory(filesDir);
    let deletedCount = 0;
    for (const name of entries) {
      const hash = name.split('.')[0];
      if (!keepHashes.has(hash)) {
        await this.files.deleteFile(`${filesDir}/${name}`);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /** Creates the folder and any missing parents in one call; never walks the path, whose first parts ("file:", "data") are not creatable. */
  private async ensureDirectory(path: string): Promise<void> {
    if (!path || (await this.files.exists(path))) return;
    await this.files.makeDirectory(path);
  }
}
