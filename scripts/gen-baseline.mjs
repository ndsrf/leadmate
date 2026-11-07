// Generates src/shell/content/baseline.generated.ts from content/stable
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import createJITI from 'jiti';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const stableDir = join(ROOT, 'content', 'stable');

const jiti = createJITI(ROOT);
const { loadPackFromDisk } = jiti('./src/shell/content/loader.ts');

const pack = loadPackFromDisk(stableDir);
// Do not include rootPath in baseline pack
delete pack.rootPath;

const outPath = join(ROOT, 'src', 'shell', 'content', 'baseline.generated.ts');
const content = `// generated from content/stable — do not edit
import type { ContentPack } from './validator';

export const BASELINE_PACK: ContentPack = ${JSON.stringify(pack, null, 2)};
`;

writeFileSync(outPath, content, 'utf8');
console.log(`✓ Generated ${outPath} from content/stable`);
