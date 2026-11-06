// Builds a Content Pack channel into deterministic manifest and hashed files:
// npm run content:build -- --channel beta|stable
// Outputs to dist/content/<channel>/

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
const versionArg = getArg('--content-version', null);
const contentVersion = versionArg ? parseInt(versionArg, 10) : undefined;

if (!customDir && channel !== 'beta' && channel !== 'stable') {
  console.error(`Invalid channel "${channel}". Must be "beta" or "stable".`);
  process.exit(1);
}

const packDir = customDir ? resolve(ROOT, customDir) : join(ROOT, 'content', channel);
const outDir = customOut ? resolve(ROOT, customOut) : join(ROOT, 'dist', 'content', channel);

const jiti = createJITI(ROOT);
const { buildPack } = jiti('./src/shell/content/build.ts');

try {
  console.log(`Building content channel "${channel}" from ${packDir}...`);
  const result = buildPack({
    channel,
    packDir,
    outDir,
    contentVersion,
  });

  const fileCount = Object.keys(result.manifest.files).length;
  console.log(`✓ Built "${channel}" version ${result.manifest.contentVersion} (${fileCount} files) into ${outDir}`);
  console.log(`  Manifest: ${result.manifestPath}`);
  console.log(`  Pointer:  ${result.latestPath}`);
  process.exit(0);
} catch (err) {
  console.error(`Build failed: ${err.message}`);
  process.exit(1);
}
