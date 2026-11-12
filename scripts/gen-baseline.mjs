// Generates src/shell/content/baseline.generated.ts from content/stable
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import createJITI from 'jiti';
import { computeHashIndex, renderHashIndexModule } from './lib/baseline-hashes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// --stable-dir / --out-dir exist so tests can generate into a temp folder
const argv = process.argv.slice(2);
const argOf = (flag, fallback) => (argv.includes(flag) && argv[argv.indexOf(flag) + 1] ? resolve(argv[argv.indexOf(flag) + 1]) : fallback);
const stableDir = argOf('--stable-dir', join(ROOT, 'content', 'stable'));
const outDir = argOf('--out-dir', join(ROOT, 'src', 'shell', 'content'));

const jiti = createJITI(ROOT);
const { loadPackFromDisk } = jiti('./src/shell/content/loader.ts');

const pack = loadPackFromDisk(stableDir);
// Do not include rootPath in baseline pack
delete pack.rootPath;

const outPath = join(outDir, 'baseline.generated.ts');
const hashesPath = join(outDir, 'baseline.hashes.generated.ts');
const content = `// generated from content/stable — do not edit
import type { ContentPack } from './validator';

export const BASELINE_PACK: ContentPack = ${JSON.stringify(pack, null, 2)};
`;

writeFileSync(outPath, content, 'utf8');
writeFileSync(hashesPath, renderHashIndexModule(computeHashIndex(stableDir)), 'utf8');
console.log(`✓ Generated ${outPath} and ${hashesPath} from ${stableDir}`);
