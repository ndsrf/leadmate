// Watches a Content Pack directory and rebuilds on file changes:
// npm run content:watch [-- --channel beta|stable]

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import createJITI from 'jiti';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && args[idx + 1]) {
    return args[idx + 1];
  }
  return fallback;
}

const channel = getArg('--channel', 'beta');
const customDir = getArg('--dir', null);
const customOut = getArg('--out', null);

if (channel !== 'beta' && channel !== 'stable') {
  console.error(`Invalid channel "${channel}". Must be "beta" or "stable".`);
  process.exit(1);
}

const packDir = customDir ? resolve(ROOT, customDir) : join(ROOT, 'content', channel);
const outDir = customOut ? resolve(ROOT, customOut) : join(ROOT, 'dist', 'content', channel);

const jiti = createJITI(ROOT);
const { buildPack } = jiti('./src/shell/content/build.ts');
const { watchContent } = jiti('./src/shell/content/watch.ts');

console.log(`Initial build for "${channel}"...`);
try {
  const res = buildPack({ channel, packDir, outDir });
  console.log(`✓ Initial build complete: version ${res.manifest.contentVersion} (${Object.keys(res.manifest.files).length} files).`);
} catch (err) {
  console.warn(`Initial build warning: ${err.message}`);
}

console.log(`Watching ${packDir} for changes (output -> ${outDir})... (Press Ctrl+C to stop)`);
const handle = watchContent({
  channel,
  packDir,
  outDir,
  onRebuild: (result, err) => {
    if (err) {
      console.error(`\n✗ Rebuild failed:\n${err.message}\n`);
    } else if (result) {
      console.log(`✓ [${new Date().toLocaleTimeString()}] Rebuilt "${channel}" pack (version ${result.manifest.contentVersion}) to ${outDir}`);
    }
  },
});

process.on('SIGINT', () => {
  console.log('\nStopping watcher...');
  handle.close();
  process.exit(0);
});
