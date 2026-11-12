import { spawn } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { BASELINE_PACK } from './baseline.generated';
import { BASELINE_HASHES } from './baseline.hashes.generated';

const ROOT = join(__dirname, '../../..');
const V = BASELINE_PACK.pack.contentVersion as number;

interface Stub {
  version?: number;
  mutate?: (files: Record<string, { sha256: string; size: number }>) => void;
  down?: boolean;
}

let server: Server;
let stub: Stub = {};
let base = '';

beforeAll(async () => {
  server = createServer((req, res) => {
    if (stub.down) return void res.writeHead(503).end();
    const version = stub.version ?? V;
    if (req.url === '/stable/latest.json') {
      return void res.end(JSON.stringify({ contentVersion: version, manifestPath: `packs/${version}/manifest.json` }));
    }
    if (req.url === `/stable/packs/${version}/manifest.json`) {
      const files: Record<string, { sha256: string; size: number }> = {};
      for (const [p, h] of Object.entries(BASELINE_HASHES)) files[p] = { sha256: h, size: 1 };
      stub.mutate?.(files);
      return void res.end(JSON.stringify({ contentVersion: version, files }));
    }
    res.writeHead(404).end();
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((r) => server.close(() => r(undefined))));
beforeEach(() => {
  stub = {};
});

function run(args: string[], baseUrl = base) {
  return new Promise<{ code: number | null; out: string }>((resolve) => {
    const p = spawn('node', ['scripts/content-release-check.mjs', '--base-url', baseUrl, ...args], { cwd: ROOT });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    p.on('close', (code) => resolve({ code, out }));
  });
}

describe('content:release-check', () => {
  it('passes when version and hashes match', async () => {
    const r = await run([]);
    expect(r.code).toBe(0);
  });

  it('fails when the baseline is older than published stable', async () => {
    stub.version = V + 1;
    const r = await run([]);
    expect(r.code).toBe(1);
    expect(r.out).toContain(`baseline v${V}`);
    expect(r.out).toContain(`published v${V + 1}`);
    expect(r.out).toContain('Rebuild the baseline');
  });

  it('fails when the baseline is newer than published stable', async () => {
    stub.version = V - 1;
    const r = await run([]);
    expect(r.code).toBe(1);
    expect(r.out).toContain('Publish stable before releasing');
  });

  it('fails naming differing files for the same version', async () => {
    const first = Object.keys(BASELINE_HASHES)[0];
    stub.mutate = (f) => {
      f[first] = { sha256: 'deadbeef', size: 1 };
    };
    const r = await run([]);
    expect(r.code).toBe(1);
    expect(r.out).toContain(first);
    expect(r.out).toContain('Bump contentVersion');
  });

  it('does not compare images', async () => {
    stub.mutate = (f) => {
      f['lessons/x/media/extra.png'] = { sha256: 'abc', size: 1 };
    };
    expect((await run([])).code).toBe(0);
  });

  it('fails when the host is unreachable', async () => {
    stub.down = true;
    const r = await run([]);
    expect(r.code).toBe(1);
    expect(r.out).toContain('could not verify the release');
  });

  it('passes with a warning under --allow-offline when unreachable', async () => {
    stub.down = true;
    const r = await run(['--allow-offline']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('NOT verified');
  });
});

describe('release:prepare', () => {
  it('chains sim:embed, gen-baseline, release-check in order, without --allow-offline', () => {
    const pkg = require('../../../package.json');
    const steps = (pkg.scripts['release:prepare'] as string).split('&&').map((s) => s.trim());
    expect(steps).toEqual([
      'npm run sim:embed',
      'node scripts/gen-baseline.mjs',
      'npm run content:release-check',
    ]);
    expect(pkg.scripts['content:release-check']).not.toContain('--allow-offline');
    expect(pkg.scripts['eas-build-post-install']).toBe('npm run release:prepare');
  });
});
