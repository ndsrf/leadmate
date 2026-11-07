// Publishes a Content Pack channel to Supabase Storage:
// npm run content:publish [-- --channel beta|stable] [--yes] [--rollback <version>]

import { dirname, resolve } from 'node:path';
import * as readline from 'node:readline';
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
const yes = args.includes('--yes');
const rollbackArg = getArg('--rollback', null);
const rollbackVersion = rollbackArg ? parseInt(rollbackArg, 10) : undefined;

if (channel !== 'beta' && channel !== 'stable') {
  console.error(`Invalid channel "${channel}". Must be "beta" or "stable".`);
  process.exit(1);
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((res) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      res(trimmed === 'y' || trimmed === 'yes');
    });
  });
}

const jiti = createJITI(ROOT);
const { publishPack } = jiti('./src/shell/content/publish.ts');

try {
  console.log(`Starting content publish for channel "${channel}"...`);
  const result = await publishPack({
    channel,
    yes,
    rollbackVersion,
    promptFn: promptUser,
  });

  if (result.mode === 'rollback') {
    console.log(`✓ Successfully rolled back "${channel}" to version ${result.contentVersion}`);
  } else {
    console.log(`✓ Successfully published "${channel}" version ${result.contentVersion} (${result.filesUploaded} files uploaded)`);
  }
  process.exit(0);
} catch (err) {
  console.error(`Publish failed: ${err.message}`);
  process.exit(1);
}
