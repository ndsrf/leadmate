// Compares the bundled baseline (version + text/structure file hashes) with the published stable pack.
// Usage: node scripts/content-release-check.mjs [--base-url <url>] [--allow-offline]
// Base URL defaults to EXPO_PUBLIC_CONTENT_BASE, else <EXPO_PUBLIC_SUPABASE_URL|SUPABASE_URL>/storage/v1/object/public/content.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import createJITI from 'jiti';
import { IMAGE_EXTENSIONS } from './lib/baseline-hashes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const allowOffline = argv.includes('--allow-offline');
const flagIdx = argv.indexOf('--base-url');
const supa = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const base = (
  (flagIdx >= 0 && argv[flagIdx + 1]) ||
  process.env.EXPO_PUBLIC_CONTENT_BASE ||
  (supa ? `${supa.replace(/\/+$/, '')}/storage/v1/object/public/content` : '')
).replace(/\/+$/, '');

const jiti = createJITI(ROOT, { cache: false, requireCache: false });
const { BASELINE_PACK } = jiti('./src/shell/content/baseline.generated.ts');
const { BASELINE_HASHES } = jiti('./src/shell/content/baseline.hashes.generated.ts');
const baselineVersion = BASELINE_PACK.pack.contentVersion;

const fail = (msg) => {
  console.error(`✗ content:release-check failed: ${msg}`);
  process.exit(1);
};

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

let latest;
let manifest;
try {
  if (!base) throw new Error('no content host configured (set EXPO_PUBLIC_CONTENT_BASE or pass --base-url)');
  latest = await getJson(`${base}/stable/latest.json`);
  manifest = await getJson(`${base}/stable/${String(latest.manifestPath).replace(/^\/+/, '')}`);
} catch (err) {
  if (allowOffline) {
    console.warn(`⚠ Could not reach the published stable pack (${err.message}). Release NOT verified (--allow-offline).`);
    process.exit(0);
  }
  fail(`could not verify the release: ${err.message}. Fix connectivity, or pass --allow-offline to skip (release stays unverified).`);
}

const published = latest.contentVersion;
if (published > baselineVersion) {
  fail(`baseline is older than published stable (baseline v${baselineVersion}, published v${published}). Rebuild the baseline from the published stable pack.`);
}
if (baselineVersion > published) {
  fail(`baseline is newer than published stable (baseline v${baselineVersion}, published v${published}). Publish stable before releasing.`);
}

const isImage = (p) => IMAGE_EXTENSIONS.has(p.slice(p.lastIndexOf('.')).toLowerCase());
const remote = manifest.files ?? {};
const differing = [];
for (const [path, hash] of Object.entries(BASELINE_HASHES)) {
  if (remote[path]?.sha256 !== hash) differing.push(path);
}
for (const path of Object.keys(remote)) {
  if (!isImage(path) && !(path in BASELINE_HASHES)) differing.push(path);
}
if (differing.length > 0) {
  const list = [...new Set(differing)].sort().map((p) => `  - ${p}`).join('\n');
  fail(`same version (v${baselineVersion}) but content differs from published stable in:\n${list}\nBump contentVersion and publish.`);
}
console.log(`✓ Baseline v${baselineVersion} matches published stable (text and structure files).`);
