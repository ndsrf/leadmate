import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { buildPack, type ContentManifest, type LatestPointer } from './build';
import { loadPackFromDisk } from './loader';
import { validatePack } from './validator';

export interface StorageBucketOps {
  upload(
    path: string,
    data: Buffer | string,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<{ data: unknown; error: Error | null }>;
  download(path: string): Promise<{ data: { text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> } | null; error: Error | null }>;
  list(path?: string, options?: { limit?: number; offset?: number; sortBy?: { column?: string; order?: string } }): Promise<{ data: Array<{ name: string }> | null; error: Error | null }>;
  remove(paths: string[]): Promise<{ data: unknown; error: Error | null }>;
}

export interface StorageClientLike {
  from(bucket: string): StorageBucketOps;
}

export interface PublishOptions {
  channel?: 'beta' | 'stable';
  packDir?: string;
  outDir?: string;
  rollbackVersion?: number;
  yes?: boolean;
  promptFn?: (message: string) => Promise<boolean>;
  storageClient?: StorageClientLike;
  supabaseUrl?: string;
  serviceRoleKey?: string;
  keepVersions?: number;
}

export interface PublishResult {
  success: boolean;
  channel: 'beta' | 'stable';
  mode: 'publish' | 'rollback';
  contentVersion: number;
  filesUploaded: number;
  latestUpdated: boolean;
  prunedFiles?: string[];
}

function getMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase();
  switch (ext) {
    case '.json':
      return 'application/json';
    case '.yaml':
    case '.yml':
      return 'application/x-yaml';
    case '.md':
      return 'text/markdown';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Publishes or rolls back a Content Pack channel to Supabase Storage.
 */
export async function publishPack(options: PublishOptions = {}): Promise<PublishResult> {
  const channel = options.channel ?? 'beta';
  if (channel !== 'beta' && channel !== 'stable') {
    throw new Error(`Invalid channel "${channel}". Must be "beta" or "stable".`);
  }

  // 1. Get storage client
  let storage = options.storageClient;
  if (!storage) {
    const url = options.supabaseUrl ?? process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = options.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    }
    const client = createClient(url, key, { auth: { persistSession: false } });
    storage = client.storage;
  }
  const bucket = storage.from('content');

  // Handle Rollback
  if (typeof options.rollbackVersion === 'number') {
    const version = options.rollbackVersion;
    if (channel === 'stable' && !options.yes) {
      const prompt = options.promptFn ?? (async () => false);
      const confirmed = await prompt(`Roll back channel "stable" to version ${version}?`);
      if (!confirmed) {
        throw new Error('Rollback aborted by user confirmation.');
      }
    }

    const versionManifestPath = `${channel}/packs/${version}/manifest.json`;
    const { data, error } = await bucket.download(versionManifestPath);
    if (error || !data) {
      throw new Error(`Could not find manifest for version ${version} at ${versionManifestPath}: ${error?.message ?? 'Not found'}`);
    }

    const manifestText = await data.text();
    const manifest: ContentManifest = JSON.parse(manifestText);
    const manifestHash = createHash('sha256').update(manifestText).digest('hex');

    const latest: LatestPointer = {
      channel,
      contentVersion: manifest.contentVersion,
      formatVersion: manifest.formatVersion,
      minAppVersion: manifest.minAppVersion,
      manifestPath: `packs/${version}/manifest.json`,
      manifestHash,
      createdAt: new Date().toISOString(),
    };

    const latestJson = JSON.stringify(latest, null, 2) + '\n';
    const { error: latestErr } = await bucket.upload(`${channel}/latest.json`, latestJson, {
      contentType: 'application/json',
      upsert: true,
    });
    if (latestErr) {
      throw new Error(`Failed to upload ${channel}/latest.json during rollback: ${latestErr.message}`);
    }

    return {
      success: true,
      channel,
      mode: 'rollback',
      contentVersion: version,
      filesUploaded: 0,
      latestUpdated: true,
    };
  }

  // Normal Publish:
  const packDir = options.packDir ? resolve(options.packDir) : resolve(process.cwd(), 'content', channel);
  const outDir = options.outDir ? resolve(options.outDir) : resolve(process.cwd(), 'dist', 'content', channel);

  // A. Validate pack
  const pack = loadPackFromDisk(packDir);
  const report = validatePack(pack);
  if (!report.valid) {
    const errs = report.errors.map((e) => `  ✗ [${e.file ?? 'pack'}] ${e.field ? `${e.field}: ` : ''}${e.message}`).join('\n');
    throw new Error(`Cannot publish invalid pack for channel "${channel}":\n${errs}`);
  }

  // B. Build pack
  const buildResult = buildPack({
    channel,
    packDir,
    outDir,
  });
  const { manifest, latest } = buildResult;

  // Check remote latest.json to prevent version drift or overwriting
  const remoteLatestPath = `${channel}/latest.json`;
  const { data: remoteLatestData, error: remoteLatestErr } = await bucket.download(remoteLatestPath);
  if (!remoteLatestErr && remoteLatestData) {
    let remoteContentVersion: number | undefined;
    try {
      const remoteLatestText = await remoteLatestData.text();
      const remoteLatest: LatestPointer = JSON.parse(remoteLatestText);
      if (typeof remoteLatest?.contentVersion === 'number') {
        remoteContentVersion = remoteLatest.contentVersion;
      }
    } catch {
      // Ignore invalid or empty remote latest pointer
    }

    if (typeof remoteContentVersion === 'number' && manifest.contentVersion <= remoteContentVersion) {
      throw new Error(
        `Remote channel "${channel}" is already at version ${remoteContentVersion}. Local pack has version ${manifest.contentVersion}. Please bump contentVersion in content/${channel}/pack.yaml before publishing.`
      );
    }
  }

  // C. Confirm stable channel
  if (channel === 'stable' && !options.yes) {
    const prompt = options.promptFn ?? (async () => false);
    const confirmed = await prompt(`Publish version ${manifest.contentVersion} to channel "stable"?`);
    if (!confirmed) {
      throw new Error('Publication aborted by user confirmation.');
    }
  }

  // D. Upload hashed files and manifest (latest.json is uploaded LAST)
  let filesUploaded = 0;
  const filesDir = join(outDir, 'files');
  if (existsSync(filesDir)) {
    const fileEntries = readdirSync(filesDir);
    for (const file of fileEntries) {
      const localFilePath = join(filesDir, file);
      const buffer = readFileSync(localFilePath);
      const remotePath = `${channel}/files/${file}`;
      const contentType = getMimeType(file);

      const { error } = await bucket.upload(remotePath, buffer, { contentType, upsert: true });
      if (error) {
        throw new Error(`Failed uploading file ${remotePath}: ${error.message}`);
      }
      filesUploaded++;
    }
  }

  // Upload versioned manifest & root manifest
  const manifestJson = JSON.stringify(manifest, null, 2) + '\n';
  const { error: vManErr } = await bucket.upload(`${channel}/packs/${manifest.contentVersion}/manifest.json`, manifestJson, {
    contentType: 'application/json',
    upsert: true,
  });
  if (vManErr) {
    throw new Error(`Failed uploading versioned manifest: ${vManErr.message}`);
  }

  const { error: rootManErr } = await bucket.upload(`${channel}/manifest.json`, manifestJson, {
    contentType: 'application/json',
    upsert: true,
  });
  if (rootManErr) {
    throw new Error(`Failed uploading root manifest: ${rootManErr.message}`);
  }

  // E. Upload latest.json LAST
  const latestJson = JSON.stringify(latest, null, 2) + '\n';
  const { error: latestErr } = await bucket.upload(`${channel}/latest.json`, latestJson, {
    contentType: 'application/json',
    upsert: true,
  });
  if (latestErr) {
    throw new Error(`Failed uploading ${channel}/latest.json: ${latestErr.message}`);
  }

  // F. Prune unreferenced files older than the last N manifests
  const keepN = options.keepVersions ?? 5;
  const prunedFiles: string[] = [];
  try {
    const { data: packsList } = await bucket.list(`${channel}/packs`);
    if (packsList && packsList.length > keepN) {
      // Find referenced files in recent manifests
      const referencedFiles = new Set<string>();
      // Always include current manifest files
      for (const f of Object.values(manifest.files)) {
        referencedFiles.add(f.sha256);
      }

      // Read recent N manifests
      const sortedPackDirs = packsList
        .map((p) => parseInt(p.name, 10))
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a)
        .slice(0, keepN);

      for (const v of sortedPackDirs) {
        const { data: mData } = await bucket.download(`${channel}/packs/${v}/manifest.json`);
        if (mData) {
          const text = await mData.text();
          const m: ContentManifest = JSON.parse(text);
          for (const item of Object.values(m.files)) {
            referencedFiles.add(item.sha256);
          }
        }
      }

      // Check all files in bucket
      const { data: storageFiles } = await bucket.list(`${channel}/files`);
      if (storageFiles) {
        const toDelete: string[] = [];
        for (const sf of storageFiles) {
          const hashPrefix = sf.name.split('.')[0];
          if (!referencedFiles.has(hashPrefix)) {
            toDelete.push(`${channel}/files/${sf.name}`);
            prunedFiles.push(sf.name);
          }
        }
        if (toDelete.length > 0) {
          await bucket.remove(toDelete);
        }
      }
    }
  } catch {
    // Non-fatal if pruning fails
  }

  return {
    success: true,
    channel,
    mode: 'publish',
    contentVersion: manifest.contentVersion,
    filesUploaded,
    latestUpdated: true,
    prunedFiles,
  };
}
