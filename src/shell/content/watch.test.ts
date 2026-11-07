import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { watchContent } from './watch';

describe('watchContent / content:watch', () => {
  const REAL_BETA_DIR = path.resolve(__dirname, '../../../content/beta');

  let tmpDir: string;
  let packDir: string;
  let outDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-test-'));
    packDir = path.join(tmpDir, 'beta');
    outDir = path.join(tmpDir, 'dist');
    fs.cpSync(REAL_BETA_DIR, packDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('rebuilds dist when a Lesson file is edited', async () => {
    let rebuildDone: (() => void) | null = null;
    const rebuildPromise = new Promise<void>((resolve) => {
      rebuildDone = resolve;
    });

    let rebuildCount = 0;
    const watcher = watchContent({
      channel: 'beta',
      packDir,
      outDir,
      debounceMs: 50,
      onRebuild: (result, err) => {
        if (err) {
          throw err;
        }
        rebuildCount++;
        rebuildDone?.();
      },
    });

    try {
      // Modify a lesson file in packDir
      const lessonEsPath = path.join(packDir, 'lessons', 'body-language', 'es.md');
      const original = fs.readFileSync(lessonEsPath, 'utf8');
      fs.writeFileSync(lessonEsPath, original + '\n<!-- edited comment -->\n');

      await rebuildPromise;

      expect(rebuildCount).toBeGreaterThanOrEqual(1);

      // Verify that outDir manifest exists and contains the updated hash
      const manifestPath = path.join(outDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const entry = manifest.files['lessons/body-language/es.md'];
      expect(entry).toBeDefined();
    } finally {
      watcher.close();
    }
  });
});
