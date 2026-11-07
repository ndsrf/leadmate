import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { loadPackFromDisk } from './loader';
import { validatePack } from './validator';

export interface ContentManifestFile {
  sha256: string;
  size: number;
}

export interface ContentManifest {
  channel: 'beta' | 'stable';
  contentVersion: number;
  formatVersion: number;
  minAppVersion: string;
  createdAt: string;
  files: Record<string, ContentManifestFile>;
}

export interface LatestPointer {
  channel: 'beta' | 'stable';
  contentVersion: number;
  formatVersion: number;
  minAppVersion: string;
  manifestPath: string;
  manifestHash: string;
  createdAt: string;
}

export interface BuildPackOptions {
  channel: 'beta' | 'stable';
  packDir: string;
  outDir: string;
  contentVersion?: number;
  createdAt?: string;
}

export interface BuildResult {
  manifest: ContentManifest;
  latest: LatestPointer;
  manifestPath: string;
  latestPath: string;
  filesCopied: number;
}

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // ignore hidden files
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Builds a Content Pack directory into a hashed files distribution with a deterministic manifest.
 */
export function buildPack(options: BuildPackOptions): BuildResult {
  const { channel, packDir, outDir } = options;

  if (!existsSync(packDir)) {
    throw new Error(`Pack directory does not exist: ${packDir}`);
  }

  // 1. Load and validate pack
  const pack = loadPackFromDisk(packDir);
  const report = validatePack(pack);
  if (!report.valid) {
    const errorDetails = report.errors
      .map((e) => `  ✗ [${e.file ?? 'pack'}] ${e.field ? `${e.field}: ` : ''}${e.message}`)
      .join('\n');
    throw new Error(`Cannot build invalid pack at ${packDir}:\n${errorDetails}`);
  }

  // 2. Determine versions
  const formatVersion = pack.pack.formatVersion;
  const minAppVersion = pack.pack.minAppVersion;

  let contentVersion = 1;
  if (typeof options.contentVersion === 'number' && Number.isInteger(options.contentVersion) && options.contentVersion > 0) {
    contentVersion = options.contentVersion;
  } else if (typeof (pack.pack as any).contentVersion === 'number') {
    contentVersion = (pack.pack as any).contentVersion;
  } else {
    // Check if previous latest.json exists in outDir
    const existingLatestPath = join(outDir, 'latest.json');
    if (existsSync(existingLatestPath)) {
      try {
        const prevLatest = JSON.parse(readFileSync(existingLatestPath, 'utf8'));
        if (typeof prevLatest.contentVersion === 'number') {
          contentVersion = prevLatest.contentVersion;
        }
      } catch {
        // Fall back to default
      }
    }
  }

  const createdAt = options.createdAt ?? new Date().toISOString();

  // 3. Prepare target output directories
  const filesDir = join(outDir, 'files');
  const versionPacksDir = join(outDir, 'packs', String(contentVersion));
  mkdirSync(filesDir, { recursive: true });
  mkdirSync(versionPacksDir, { recursive: true });

  // 4. Collect and hash all files
  const allFilePaths = collectFiles(packDir);
  const rawFiles: Record<string, ContentManifestFile> = {};
  let filesCopied = 0;

  for (const fullPath of allFilePaths) {
    const relPath = relative(packDir, fullPath).split('\\').join('/');
    const buffer = readFileSync(fullPath);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const size = buffer.length;
    const ext = extname(relPath).toLowerCase();
    const hashedFileName = `${sha256}${ext}`;

    const destPath = join(filesDir, hashedFileName);
    if (!existsSync(destPath)) {
      writeFileSync(destPath, buffer);
      filesCopied++;
    }

    rawFiles[relPath] = {
      sha256,
      size,
    };
  }

  // 5. Sort manifest files keys alphabetically for determinism
  const sortedKeys = Object.keys(rawFiles).sort();
  const sortedFiles: Record<string, ContentManifestFile> = {};
  for (const k of sortedKeys) {
    sortedFiles[k] = rawFiles[k];
  }

  const manifest: ContentManifest = {
    channel,
    contentVersion,
    formatVersion,
    minAppVersion,
    createdAt,
    files: sortedFiles,
  };

  const manifestJson = JSON.stringify(manifest, null, 2) + '\n';
  const manifestHash = createHash('sha256').update(manifestJson).digest('hex');

  const rootManifestPath = join(outDir, 'manifest.json');
  const versionedManifestPath = join(versionPacksDir, 'manifest.json');
  writeFileSync(rootManifestPath, manifestJson);
  writeFileSync(versionedManifestPath, manifestJson);

  // 6. Write latest.json
  const latest: LatestPointer = {
    channel,
    contentVersion,
    formatVersion,
    minAppVersion,
    manifestPath: `packs/${contentVersion}/manifest.json`,
    manifestHash,
    createdAt,
  };
  const latestJson = JSON.stringify(latest, null, 2) + '\n';
  const latestPath = join(outDir, 'latest.json');
  writeFileSync(latestPath, latestJson);

  return {
    manifest,
    latest,
    manifestPath: rootManifestPath,
    latestPath,
    filesCopied,
  };
}
