import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { publishPack, type StorageBucketOps, type StorageClientLike } from './publish';

class MockStorageBucket implements StorageBucketOps {
  files: Map<string, Buffer | string> = new Map();
  failOnUploadPattern: RegExp | null = null;

  async upload(
    filePath: string,
    data: Buffer | string,
    _options?: { contentType?: string; upsert?: boolean }
  ): Promise<{ data: unknown; error: Error | null }> {
    if (this.failOnUploadPattern && this.failOnUploadPattern.test(filePath)) {
      return { data: null, error: new Error(`Simulated network error on ${filePath}`) };
    }
    this.files.set(filePath, data);
    return { data: { path: filePath }, error: null };
  }

  async download(filePath: string): Promise<{ data: { text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> } | null; error: Error | null }> {
    const content = this.files.get(filePath);
    if (!content) {
      return { data: null, error: new Error(`File not found: ${filePath}`) };
    }
    const str = typeof content === 'string' ? content : content.toString('utf8');
    return {
      data: {
        text: async () => str,
        arrayBuffer: async () => new TextEncoder().encode(str).buffer as ArrayBuffer,
      },
      error: null,
    };
  }

  async list(prefix?: string): Promise<{ data: Array<{ name: string }> | null; error: Error | null }> {
    const results: Array<{ name: string }> = [];
    const cleanPrefix = prefix ? (prefix.endsWith('/') ? prefix : `${prefix}/`) : '';
    for (const k of this.files.keys()) {
      if (!cleanPrefix || k.startsWith(cleanPrefix)) {
        const sub = k.slice(cleanPrefix.length);
        const firstSeg = sub.split('/')[0];
        if (!results.some((r) => r.name === firstSeg)) {
          results.push({ name: firstSeg });
        }
      }
    }
    return { data: results, error: null };
  }

  async remove(paths: string[]): Promise<{ data: unknown; error: Error | null }> {
    for (const p of paths) {
      this.files.delete(p);
    }
    return { data: paths, error: null };
  }
}

class MockStorageClient implements StorageClientLike {
  bucket = new MockStorageBucket();
  from(b: string) {
    if (b !== 'content') throw new Error(`Unexpected bucket ${b}`);
    return this.bucket;
  }
}

describe('publishPack / content:publish', () => {
  const BETA_DIR = path.resolve(__dirname, '../../../content/beta');

  let tmpOutDir: string;
  let mockClient: MockStorageClient;

  beforeEach(() => {
    tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-test-out-'));
    mockClient = new MockStorageClient();
  });

  afterEach(() => {
    fs.rmSync(tmpOutDir, { recursive: true, force: true });
  });

  it('no channel flag defaults to beta and uploads latest.json last', async () => {
    const res = await publishPack({
      packDir: BETA_DIR,
      outDir: tmpOutDir,
      storageClient: mockClient,
    });

    expect(res.channel).toBe('beta');
    expect(res.mode).toBe('publish');
    expect(res.success).toBe(true);
    expect(res.latestUpdated).toBe(true);

    // Verify storage has files, manifest and latest.json under beta/
    expect(mockClient.bucket.files.has('beta/latest.json')).toBe(true);
    expect(mockClient.bucket.files.has('beta/manifest.json')).toBe(true);
    expect(mockClient.bucket.files.has('beta/packs/4/manifest.json')).toBe(true);

    // Verify latest.json points to packs/4/manifest.json
    const latestRaw = mockClient.bucket.files.get('beta/latest.json')!.toString();
    const latest = JSON.parse(latestRaw);
    expect(latest.channel).toBe('beta');
    expect(latest.contentVersion).toBe(4);
    expect(latest.manifestPath).toBe('packs/4/manifest.json');
  });

  it('interrupted upload leaves latest.json untouched', async () => {
    // Put an existing latest.json in storage
    mockClient.bucket.files.set('beta/latest.json', 'existing-latest-v0');

    // Simulate upload failure during file upload
    mockClient.bucket.failOnUploadPattern = /files\//;

    await expect(
      publishPack({
        channel: 'beta',
        packDir: BETA_DIR,
        outDir: tmpOutDir,
        storageClient: mockClient,
      })
    ).rejects.toThrow(/Simulated network error/);

    // latest.json MUST remain the existing one!
    expect(mockClient.bucket.files.get('beta/latest.json')).toBe('existing-latest-v0');
  });

  it('rejects publishing when pack contentVersion does not advance beyond remote latest.json', async () => {
    const remoteLatest = {
      channel: 'beta',
      contentVersion: 4,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      manifestPath: 'packs/4/manifest.json',
      manifestHash: 'hash',
      createdAt: '2026-11-06T18:00:00Z',
    };
    mockClient.bucket.files.set('beta/latest.json', JSON.stringify(remoteLatest));

    await expect(
      publishPack({
        channel: 'beta',
        packDir: BETA_DIR,
        outDir: tmpOutDir,
        storageClient: mockClient,
      })
    ).rejects.toThrow(/Remote channel "beta" is already at version 4/);
  });

  it('publishing to stable prompts for confirmation and aborts if not confirmed', async () => {
    let promptCalled = false;
    const promptFn = async (msg: string) => {
      promptCalled = true;
      expect(msg).toContain('stable');
      return false; // User denies
    };

    await expect(
      publishPack({
        channel: 'stable',
        packDir: BETA_DIR,
        outDir: tmpOutDir,
        storageClient: mockClient,
        promptFn,
      })
    ).rejects.toThrow(/Publication aborted by user/);

    expect(promptCalled).toBe(true);
    expect(mockClient.bucket.files.has('stable/latest.json')).toBe(false);
  });

  it('publishing to stable proceeds when confirmed or when yes is true', async () => {
    let promptCalled = false;
    const promptFn = async () => {
      promptCalled = true;
      return true; // User accepts
    };

    const res = await publishPack({
      channel: 'stable',
      packDir: BETA_DIR,
      outDir: tmpOutDir,
      storageClient: mockClient,
      promptFn,
    });

    expect(promptCalled).toBe(true);
    expect(res.channel).toBe('stable');
    expect(mockClient.bucket.files.has('stable/latest.json')).toBe(true);

    // Also test with yes: true (should not call promptFn) using fresh storage client
    promptCalled = false;
    const mockClientYes = new MockStorageClient();
    const resYes = await publishPack({
      channel: 'stable',
      packDir: BETA_DIR,
      outDir: tmpOutDir,
      storageClient: mockClientYes,
      yes: true,
      promptFn,
    });
    expect(promptCalled).toBe(false);
    expect(resYes.channel).toBe('stable');
  });

  it('supports rollback to previous version by repointing latest.json', async () => {
    // Put version 2 manifest in storage
    const v2Manifest = {
      channel: 'beta',
      contentVersion: 2,
      formatVersion: 1,
      minAppVersion: '1.0.0',
      createdAt: '2026-11-06T12:00:00Z',
      files: {},
    };
    mockClient.bucket.files.set('beta/packs/2/manifest.json', JSON.stringify(v2Manifest));

    const res = await publishPack({
      channel: 'beta',
      rollbackVersion: 2,
      storageClient: mockClient,
    });

    expect(res.mode).toBe('rollback');
    expect(res.contentVersion).toBe(2);

    const latest = JSON.parse(mockClient.bucket.files.get('beta/latest.json')!.toString());
    expect(latest.contentVersion).toBe(2);
    expect(latest.manifestPath).toBe('packs/2/manifest.json');
  });
});
