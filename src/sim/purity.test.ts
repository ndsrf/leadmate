import fs from 'fs';
import path from 'path';

function findFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Simulation Purity (Task 6.3 & ADR 0002)', () => {
  it('ensures src/sim/** and bundle/src/** contain no analytics or posthog imports', () => {
    const simDir = path.resolve(__dirname, '../../src/sim');
    const bundleDir = path.resolve(__dirname, '../../bundle/src');

    const files = [...findFiles(simDir), ...findFiles(bundleDir)];
    expect(files.length).toBeGreaterThan(0);

    const importRegex = /(?:import\s+.*?\s+from\s+['"][^'"]*(?:analytics|posthog)[^'"]*['"]|require\(['"][^'"]*(?:analytics|posthog)[^'"]*['"]\))/i;

    const offending: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (importRegex.test(content)) {
        offending.push(path.relative(path.resolve(__dirname, '../..'), file));
      }
    }

    expect(offending).toEqual([]);
  });
});
