import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { BASELINE_HASHES } from './baseline.hashes.generated';

const ROOT = join(__dirname, '../../..');
const stable = join(ROOT, 'content/stable');
const IMAGES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function walk(dir: string, base = ''): string[] {
  return readdirSync(join(dir, base), { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.')) return [];
    const rel = base ? `${base}/${e.name}` : e.name;
    return e.isDirectory() ? walk(dir, rel) : [rel];
  });
}

describe('baseline hash index', () => {
  it('matches the sha256 of every text and structure file in content/stable', () => {
    const expected: Record<string, string> = {};
    for (const rel of walk(stable)) {
      if (IMAGES.has(extname(rel).toLowerCase())) continue;
      expected[rel] = createHash('sha256').update(readFileSync(join(stable, rel))).digest('hex');
    }
    expect(BASELINE_HASHES).toEqual(expected);
    expect(Object.keys(BASELINE_HASHES).length).toBeGreaterThan(0);
  });

  it('holds no images', () => {
    expect(Object.keys(BASELINE_HASHES).some((p) => IMAGES.has(extname(p)))).toBe(false);
  });

  it('is identical across two generations', () => {
    const outs = [0, 1].map(() => {
      const out = mkdtempSync(join(tmpdir(), 'gen-baseline-'));
      const r = spawnSync('node', ['scripts/gen-baseline.mjs', '--out-dir', out], { cwd: ROOT, encoding: 'utf8' });
      expect(r.status).toBe(0);
      const files = ['baseline.generated.ts', 'baseline.hashes.generated.ts'].map((f) => readFileSync(join(out, f), 'utf8'));
      rmSync(out, { recursive: true, force: true });
      return files;
    });
    expect(outs[0]).toEqual(outs[1]);
    // and equal to the committed files
    expect(outs[0][0]).toBe(readFileSync(join(__dirname, 'baseline.generated.ts'), 'utf8'));
    expect(outs[0][1]).toBe(readFileSync(join(__dirname, 'baseline.hashes.generated.ts'), 'utf8'));
  }, 60000);
});
