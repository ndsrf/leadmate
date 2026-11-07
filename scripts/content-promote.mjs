// Promotes content from beta to stable:
// 1. Validates content/beta. If invalid, aborts with errors.
// 2. Copies content/beta to content/stable.
// 3. Validates content/stable.
// Usage: node scripts/content-promote.mjs [--from <dir>] [--to <dir>] [--channel <stable>]

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

const fromArg = getArg('--from', null);
const toArg = getArg('--to', null);
const channelArg = getArg('--channel', null);

const fromDir = fromArg ? resolve(ROOT, fromArg) : join(ROOT, 'content', 'beta');
const toDir = toArg ? resolve(ROOT, toArg) : channelArg ? join(ROOT, 'content', channelArg) : join(ROOT, 'content', 'stable');

const jiti = createJITI(ROOT);
const { promotePack } = jiti('./src/shell/content/promote.ts');

try {
  console.log(`Promoting content from ${fromDir} to ${toDir}...`);
  promotePack({ fromDir, toDir });
  console.log(`✓ Successfully promoted ${fromDir} to ${toDir}! Both channels are valid.`);

  // If promoting to real stable, regenerate baseline.generated.ts
  if (toDir === join(ROOT, 'content', 'stable')) {
    jiti('./scripts/gen-baseline.mjs');
  }
  process.exit(0);
} catch (err) {
  console.error(`Promotion failed: ${err.message}`);
  process.exit(1);
}
