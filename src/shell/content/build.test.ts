import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildPack } from './build';

describe('buildPack / content:build', () => {
  const BETA_DIR = path.resolve(__dirname, '../../../content/beta');

  let tmpOutDir: string;

  beforeEach(() => {
    tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-test-out-'));
  });

  afterEach(() => {
    fs.rmSync(tmpOutDir, { recursive: true, force: true });
  });

  it('builds beta pack producing deterministic manifest and hashed files', () => {
    const result = buildPack({
      channel: 'beta',
      packDir: BETA_DIR,
      outDir: tmpOutDir,
      contentVersion: 1,
    });

    expect(result.manifest.channel).toBe('beta');
    expect(result.manifest.contentVersion).toBe(1);
    expect(result.manifest.formatVersion).toBe(1);
    expect(result.manifest.minAppVersion).toBe('1.0.0');
    expect(typeof result.manifest.createdAt).toBe('string');

    const fileKeys = Object.keys(result.manifest.files);
    expect(fileKeys.length).toBeGreaterThan(50);

    // Keys are sorted alphabetically
    const sorted = [...fileKeys].sort();
    expect(fileKeys).toEqual(sorted);

    // Every file entry has sha256 and size
    for (const key of fileKeys) {
      const entry = result.manifest.files[key];
      expect(typeof entry.sha256).toBe('string');
      expect(entry.sha256).toHaveLength(64);
      expect(typeof entry.size).toBe('number');
      expect(entry.size).toBeGreaterThan(0);

      const ext = path.extname(key).toLowerCase();
      const hashedFile = path.join(tmpOutDir, 'files', `${entry.sha256}${ext}`);
      expect(fs.existsSync(hashedFile)).toBe(true);
      expect(fs.statSync(hashedFile).size).toBe(entry.size);
    }

    // Latest pointer exists and points to versioned manifest
    expect(fs.existsSync(result.latestPath)).toBe(true);
    expect(result.latest.manifestPath).toBe('packs/1/manifest.json');
    expect(fs.existsSync(path.join(tmpOutDir, 'packs', '1', 'manifest.json'))).toBe(true);
  });

  it('two successive builds produce identical manifests apart from the timestamp', () => {
    const outDir1 = path.join(tmpOutDir, 'run1');
    const outDir2 = path.join(tmpOutDir, 'run2');

    const res1 = buildPack({
      channel: 'beta',
      packDir: BETA_DIR,
      outDir: outDir1,
      contentVersion: 1,
    });

    // Slight delay or different timestamp
    const res2 = buildPack({
      channel: 'beta',
      packDir: BETA_DIR,
      outDir: outDir2,
      contentVersion: 1,
    });

    const manifest1 = JSON.parse(fs.readFileSync(res1.manifestPath, 'utf8'));
    const manifest2 = JSON.parse(fs.readFileSync(res2.manifestPath, 'utf8'));

    // Check that apart from createdAt, manifest is identical
    const { createdAt: t1, ...m1Rest } = manifest1;
    const { createdAt: t2, ...m2Rest } = manifest2;

    expect(m1Rest).toEqual(m2Rest);
  });

  it('fails build when pack is invalid', () => {
    const brokenDir = path.join(tmpOutDir, 'broken');
    fs.mkdirSync(brokenDir, { recursive: true });
    fs.writeFileSync(path.join(brokenDir, 'pack.yaml'), 'invalid: yaml');

    expect(() =>
      buildPack({
        channel: 'beta',
        packDir: brokenDir,
        outDir: path.join(tmpOutDir, 'outBroken'),
      })
    ).toThrow(/Cannot build invalid pack/);
  });
});
