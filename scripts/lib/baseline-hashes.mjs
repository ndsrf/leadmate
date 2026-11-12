// Shared by gen-baseline and its tests: sha256 index of the text and structure files of a pack.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

// The baseline holds no image bytes, so images are never indexed (nor compared by the release check).
export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue; // same rule as the build's collectFiles
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/** Relative path (forward slashes, sorted) -> sha256 hex of the raw bytes, same hashing as buildPack. */
export function computeHashIndex(packDir) {
  const index = {};
  for (const full of collect(packDir).sort()) {
    const rel = relative(packDir, full).split('\\').join('/');
    if (IMAGE_EXTENSIONS.has(extname(rel).toLowerCase())) continue;
    index[rel] = createHash('sha256').update(readFileSync(full)).digest('hex');
  }
  return Object.fromEntries(Object.entries(index).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

export function renderHashIndexModule(index) {
  return `// generated from content/stable — do not edit
export const BASELINE_HASHES: Record<string, string> = ${JSON.stringify(index, null, 2)};
`;
}
