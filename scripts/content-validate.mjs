// Validates a Content Pack channel:
// npm run content:validate -- --channel beta|stable
// Exits non-zero on any error with file/field/hint output.

import { existsSync } from 'node:fs';
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

if (!customDir && channel !== 'beta' && channel !== 'stable') {
  console.error(`Invalid channel "${channel}". Must be "beta" or "stable".`);
  process.exit(1);
}

const channelDir = customDir ? resolve(ROOT, customDir) : join(ROOT, 'content', channel);

if (!existsSync(channelDir)) {
  console.error(`Channel directory not found at: ${channelDir}`);
  process.exit(1);
}

const jiti = createJITI(ROOT);
const { loadPackFromDisk } = jiti('./src/shell/content/loader.ts');
const { validatePack } = jiti('./src/shell/content/validator.ts');

try {
  const pack = loadPackFromDisk(channelDir);
  const report = validatePack(pack);

  if (!report.valid) {
    console.error(`Validation failed for "${customDir ?? channel}" with ${report.errors.length} error(s):`);
    for (const err of report.errors) {
      console.error(`✗ [${err.file ?? 'pack'}] ${err.field ? `${err.field}: ` : ''}${err.message}`);
      if (err.hint) {
        console.error(`  Hint: ${err.hint}`);
      }
    }
    process.exit(1);
  }

  if (report.warnings.length > 0) {
    console.warn(`Validation passed with ${report.warnings.length} warning(s):`);
    for (const w of report.warnings) {
      console.warn(`! [${w.file ?? 'pack'}] ${w.field ? `${w.field}: ` : ''}${w.message}`);
    }
  }

  console.log(`✓ Content channel "${customDir ?? channel}" is valid.`);
  process.exit(0);
} catch (err) {
  console.error(`Fatal error validating "${customDir ?? channel}": ${err.message}`);
  process.exit(1);
}
