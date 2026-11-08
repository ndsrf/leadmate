import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { promotePack } from './promote';

describe('promotePack / content:promote', () => {
  const REAL_BETA_DIR = path.resolve(__dirname, '../../../content/beta');

  let tmpDir: string;
  let betaMock: string;
  let stableMock: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promote-test-'));
    betaMock = path.join(tmpDir, 'beta');
    stableMock = path.join(tmpDir, 'stable');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function getDirDigest(dir: string): Record<string, string> {
    const result: Record<string, string> = {};
    function walk(curr: string, rel: string = '') {
      for (const entry of fs.readdirSync(curr, { withFileTypes: true })) {
        const full = path.join(curr, entry.name);
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(full, relPath);
        } else if (entry.isFile()) {
          result[relPath] = fs.readFileSync(full, 'utf8');
        }
      }
    }
    walk(dir);
    return result;
  }

  it('promotes beta to stable: stable equals beta and beta is untouched', () => {
    // Copy real beta into betaMock
    fs.cpSync(REAL_BETA_DIR, betaMock, { recursive: true });
    // Write an initial dummy file in stable
    fs.mkdirSync(stableMock, { recursive: true });
    fs.writeFileSync(path.join(stableMock, 'old.txt'), 'old stable content');

    const betaSnapshotBefore = getDirDigest(betaMock);

    const res = promotePack({ fromDir: betaMock, toDir: stableMock });
    expect(res.success).toBe(true);

    const betaSnapshotAfter = getDirDigest(betaMock);
    const stableSnapshotAfter = getDirDigest(stableMock);

    // Beta must be untouched
    expect(betaSnapshotAfter).toEqual(betaSnapshotBefore);

    // Stable must equal beta
    expect(stableSnapshotAfter).toEqual(betaSnapshotBefore);
    expect(stableSnapshotAfter['old.txt']).toBeUndefined();
  });

  it('refuses promotion if beta has validation errors, leaving stable untouched', () => {
    fs.mkdirSync(betaMock, { recursive: true });
    fs.writeFileSync(path.join(betaMock, 'pack.yaml'), 'formatVersion: 1\n'); // missing languages, etc.

    fs.mkdirSync(stableMock, { recursive: true });
    fs.writeFileSync(path.join(stableMock, 'keep.txt'), 'original content');

    expect(() => promotePack({ fromDir: betaMock, toDir: stableMock })).toThrow(/Source validation failed/);

    expect(fs.readFileSync(path.join(stableMock, 'keep.txt'), 'utf8')).toBe('original content');
  });

  it('preserves existing contentVersion of destination pack during promotion', () => {
    fs.cpSync(REAL_BETA_DIR, betaMock, { recursive: true });
    // Stable has its own existing pack.yaml with contentVersion: 1
    fs.cpSync(REAL_BETA_DIR, stableMock, { recursive: true });
    const stablePackYamlPath = path.join(stableMock, 'pack.yaml');
    fs.writeFileSync(
      stablePackYamlPath,
      'formatVersion: 1\ncontentVersion: 1\nminAppVersion: 1.0.0\nlanguages:\n  - es\nretired: []\n'
    );

    // Beta has contentVersion: 4
    const betaPackYamlPath = path.join(betaMock, 'pack.yaml');
    fs.writeFileSync(
      betaPackYamlPath,
      'formatVersion: 1\ncontentVersion: 4\nminAppVersion: 1.0.0\nlanguages:\n  - es\nretired: []\n'
    );

    const res = promotePack({ fromDir: betaMock, toDir: stableMock });
    expect(res.success).toBe(true);

    const promotedStableYaml = fs.readFileSync(stablePackYamlPath, 'utf8');
    expect(promotedStableYaml).toContain('contentVersion: 1');
  });
});
