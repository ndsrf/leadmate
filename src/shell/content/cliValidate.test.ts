import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('content:validate CLI', () => {
  const SCRIPT_PATH = path.resolve(__dirname, '../../../scripts/content-validate.mjs');

  function runValidate(args: string[]): { status: number; stdout: string; stderr: string } {
    try {
      const stdout = execSync(`node "${SCRIPT_PATH}" ${args.join(' ')}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { status: 0, stdout, stderr: '' };
    } catch (err: any) {
      return {
        status: err.status ?? 1,
        stdout: err.stdout?.toString() ?? '',
        stderr: err.stderr?.toString() ?? '',
      };
    }
  }

  it('validates beta and stable channels successfully with exit code 0', () => {
    const resBeta = runValidate(['--channel', 'beta']);
    expect(resBeta.status).toBe(0);
    expect(resBeta.stdout).toContain('Content channel "beta" is valid');

    const resStable = runValidate(['--channel', 'stable']);
    expect(resStable.status).toBe(0);
    expect(resStable.stdout).toContain('Content channel "stable" is valid');
  });

  describe('three deliberately broken fixtures', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-val-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('Fixture 1: schema error (malformed pack.yaml / missing required fields) fails with file/hint and exit non-zero', () => {
      // Create invalid pack.yaml missing contentVersion and worlds
      fs.writeFileSync(path.join(tmpDir, 'pack.yaml'), 'formatVersion: 1\n# missing contentVersion, worlds\n');
      const res = runValidate(['--dir', tmpDir]);
      expect(res.status).not.toBe(0);
      expect(res.stderr).toContain('pack.yaml');
      expect(res.stderr).toContain('Hint:');
    });

    it('Fixture 2: dangling reference (stretch references unknown node) fails with file/field/hint and exit non-zero', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'pack.yaml'),
        `
formatVersion: 1
contentVersion: 1
minAppVersion: "1.0.0"
languages:
  - es
retired: []
`.trim()
      );
      fs.mkdirSync(path.join(tmpDir, 'worlds', 'world-1'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, 'worlds', 'world-1.yaml'),
        `
id: world-1
worldNumber: 1
tier: free
stretches:
  - - kind: node
      id: nonexistent-node-999
`.trim()
      );
      fs.writeFileSync(
        path.join(tmpDir, 'worlds', 'world-1', 'es.md'),
        `
# World 1

## topics
Some topics
`.trim()
      );
      fs.mkdirSync(path.join(tmpDir, 'lessons'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'nodes'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'missions'), { recursive: true });

      const res = runValidate(['--dir', tmpDir]);
      expect(res.status).not.toBe(0);
      expect(res.stderr).toContain('nonexistent-node-999');
      expect(res.stderr).toContain('worlds/world-1.yaml');
      expect(res.stderr).toContain('Hint:');
    });

    it('Fixture 3: missing Spanish text fails with file/field/hint and exit non-zero', () => {
      fs.writeFileSync(
        path.join(tmpDir, 'pack.yaml'),
        `
contentVersion: 1
formatVersion: 1
minAppVersion: "1.0.0"
languages:
  - es
worlds:
  - id: world-1
    title: Mundo 1
    tier: free
    preview: false
    nodeCount: 1
    stretches:
      - id: s1
        nodes:
          - test-node
`.trim()
      );
      fs.mkdirSync(path.join(tmpDir, 'lessons'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'missions'), { recursive: true });
      const nodeDir = path.join(tmpDir, 'nodes', 'test-node');
      fs.mkdirSync(nodeDir, { recursive: true });
      fs.writeFileSync(
        path.join(nodeDir, 'node.yaml'),
        `
id: test-node
title: Test Node
type: exercise
mode: minigame
minigameId: read_dog
`.trim()
      );
      // only en.md provided, no es.md
      fs.writeFileSync(path.join(nodeDir, 'en.md'), '# Title\n\n## Instructions\nEnglish text\n');

      const res = runValidate(['--dir', tmpDir]);
      expect(res.status).not.toBe(0);
      expect(res.stderr).toContain('nodes/test-node/es.md');
      expect(res.stderr).toContain('Spanish');
      expect(res.stderr).toContain('Hint:');
    });
  });
});
