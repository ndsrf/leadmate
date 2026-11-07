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
 * Loads a ContentPack structure from an abstract FileStorage.
 */
export async function loadPackFromStorage(files: FileStorage, packDir: string): Promise<ContentPack> {
  const packFilePath = `${packDir}/pack.yaml`;
  if (!(await files.exists(packFilePath))) {
    throw new Error(`pack.yaml not found at ${packFilePath}`);
  }
  const packYaml = parseYaml<PackYaml>(await files.readAsString(packFilePath));

  const result: ContentPack = {
    rootPath: packDir,
    pack: packYaml,
    worlds: {},
    lessons: {},
    nodes: {},
    missions: {},
  };

  // 1. Worlds
  const worldsDir = `${packDir}/worlds`;
  if (await files.exists(worldsDir)) {
    const entries = await files.listDirectory(worldsDir);
    for (const name of entries) {
      if (name.endsWith('.yaml') || name.endsWith('.yml')) {
        const id = name.replace(/\.ya?ml$/, '');
        const config = parseYaml<WorldYaml>(await files.readAsString(`${worldsDir}/${name}`));
        const text: Record<string, string> = {};

        const subDir = `${worldsDir}/${id}`;
        if (await files.exists(subDir)) {
          const subFiles = await files.listDirectory(subDir);
          for (const f of subFiles) {
            if (f.endsWith('.md')) {
              const lang = f.replace(/\.md$/, '');
              text[lang] = await files.readAsString(`${subDir}/${f}`);
            }
          }
        }
        result.worlds[id] = { config, text };
      }
    }
  }

  // 2. Lessons
  const lessonsDir = `${packDir}/lessons`;
  if (await files.exists(lessonsDir)) {
    const lessonDirs = await files.listDirectory(lessonsDir);
    for (const id of lessonDirs) {
      const itemDir = `${lessonsDir}/${id}`;
      const configFile = `${itemDir}/lesson.yaml`;
      if (await files.exists(configFile)) {
        const config = parseYaml<LessonYaml>(await files.readAsString(configFile));
        const text: Record<string, string> = {};
        const mediaFiles: string[] = [];

        const entries = await files.listDirectory(itemDir);
        for (const f of entries) {
          if (f.endsWith('.md')) {
            const lang = f.replace(/\.md$/, '');
            text[lang] = await files.readAsString(`${itemDir}/${f}`);
          }
        }

        const mediaDir = `${itemDir}/media`;
        if (await files.exists(mediaDir)) {
          const mediaEntries = await files.listDirectory(mediaDir);
          for (const m of mediaEntries) {
            mediaFiles.push(`media/${m}`);
          }
        }

        result.lessons[id] = { config, text, files: mediaFiles };
      }
    }
  }

  // 3. Nodes
  const nodesDir = `${packDir}/nodes`;
  if (await files.exists(nodesDir)) {
    const nodeDirs = await files.listDirectory(nodesDir);
    for (const id of nodeDirs) {
      const itemDir = `${nodesDir}/${id}`;
      const configFile = `${itemDir}/node.yaml`;
      if (await files.exists(configFile)) {
        const config = parseYaml<NodeYaml>(await files.readAsString(configFile));
        const text: Record<string, string> = {};
        const mediaFiles: string[] = [];

        const entries = await files.listDirectory(itemDir);
        for (const f of entries) {
          if (f.endsWith('.md')) {
            const lang = f.replace(/\.md$/, '');
            text[lang] = await files.readAsString(`${itemDir}/${f}`);
          }
        }

        const mediaDir = `${itemDir}/media`;
        if (await files.exists(mediaDir)) {
          const mediaEntries = await files.listDirectory(mediaDir);
          for (const m of mediaEntries) {
            mediaFiles.push(`media/${m}`);
          }
        }

        result.nodes[id] = { config, text, files: mediaFiles };
      }
    }
  }

  // 4. Missions
  const missionsDir = `${packDir}/missions`;
  if (await files.exists(missionsDir)) {
    const missionDirs = await files.listDirectory(missionsDir);
    for (const id of missionDirs) {
      const itemDir = `${missionsDir}/${id}`;
      const configFile = `${itemDir}/mission.yaml`;
      if (await files.exists(configFile)) {
        const config = parseYaml<MissionYaml>(await files.readAsString(configFile));
        const text: Record<string, string> = {};
        const mediaFiles: string[] = [];

        const entries = await files.listDirectory(itemDir);
        for (const f of entries) {
          if (f.endsWith('.md')) {
            const lang = f.replace(/\.md$/, '');
            text[lang] = await files.readAsString(`${itemDir}/${f}`);
          }
        }

        const mediaDir = `${itemDir}/media`;
        if (await files.exists(mediaDir)) {
          const mediaEntries = await files.listDirectory(mediaDir);
          for (const m of mediaEntries) {
            mediaFiles.push(`media/${m}`);
          }
        }

        result.missions[id] = { config, text, files: mediaFiles };
      }
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
    manifest: ContentManifest
  ): Promise<ActivePackPointer> {
    const stagingDir = this.getStagingDir(channel, version);
    if (!(await this.files.exists(stagingDir))) {
      throw new Error(`Staging directory does not exist: ${stagingDir}`);
    }

    // 1. Check all manifest files exist in staging
    const missing: string[] = [];
    for (const filePath of Object.keys(manifest.files)) {
      if (!(await this.files.exists(`${stagingDir}/${filePath}`))) {
        missing.push(filePath);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Cannot activate incomplete pack: missing ${missing.length} file(s) (${missing.slice(0, 3).join(', ')})`);
    }

    // 2. Load and validate pack in staging
    const stagingPack = await loadPackFromStorage(this.files, stagingDir);
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
  async loadActivePack(channel: 'beta' | 'stable'): Promise<ContentPack | null> {
    const pointer = await this.getActivePointer(channel);
    if (!pointer) {
      return null;
    }

    const activeDir = this.getActiveDir(channel);
    const packFile = `${activeDir}/pack.yaml`;

    if (!(await this.files.exists(packFile))) {
      // Corrupt cache: pack.yaml missing from active directory
      const rolledBack = await this.rollbackToPrevious(channel);
      if (rolledBack) {
        return this.loadActivePack(channel);
      }
      // Cannot rollback; remove corrupt pointer
      await this.kv.removeItem(this.getPointerKey(channel));
      return null;
    }

    try {
      const pack = await loadPackFromStorage(this.files, activeDir);
      const report = validatePack(pack);
      if (!report.valid) {
        // Corrupt content; attempt rollback
        const rolledBack = await this.rollbackToPrevious(channel);
        if (rolledBack) {
          return this.loadActivePack(channel);
        }
        await this.kv.removeItem(this.getPointerKey(channel));
        return null;
      }
      return pack;
    } catch {
      // Parse or load failure; attempt rollback to previous version
      const rolledBack = await this.rollbackToPrevious(channel);
      if (rolledBack) {
        return this.loadActivePack(channel);
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
