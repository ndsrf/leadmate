// Renders the Lesson illustrations: every scripts/art/lessons/<name>.svg (640 by 360, built from the kit in
// scripts/art/lessons/_kit/) to assets/lessons/<name>.png at 1280 by 720, then writes src/shell/lessons/lessonArtRegistry.ts
// from the PNGs present, so the registry never drifts from the files. A default run (no --src) also renders the Node
// media drawn with the same kit, every scripts/art/nodes/<node-id>/<file>.svg, to assets/nodes/<node-id>/<file>.png and
// writes src/shell/content/nodeMediaRegistry.ts, so the bundled baseline shows a Node's pictures (an Image Duel pair)
// with no content host. Fails on a colour outside tokens.json, on any <text>, on an unknown kit symbol, or when the
// PNGs together pass 7 MB. See docs/content/lesson-guide.md.
// Run: node scripts/render-lesson-art.mjs [name ...] [--src dir] [--out dir] [--registry file]
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { chromium } from 'playwright-core';
import { BUDGET, inline, loadKit, palette, problems, ROOT, sized, writeNodeRegistry, writeRegistry } from './art/lessons/_kit/svg.mjs';

const WIDTH = 1280;

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};
const defaultRun = !args.includes('--src');
const src = flag('--src', join(ROOT, 'scripts/art/lessons'));
const out = flag('--out', join(ROOT, 'assets/lessons'));
const registry = flag('--registry', join(ROOT, 'src/shell/lessons/lessonArtRegistry.ts'));
const nodeSrc = join(ROOT, 'scripts/art/nodes');
const nodeOut = join(ROOT, 'assets/nodes');
const nodeRegistry = join(ROOT, 'src/shell/content/nodeMediaRegistry.ts');
const only = new Set(args);

const kit = loadKit();
const colours = palette();
const svgNames = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .map((f) => basename(f, '.svg'))
    .filter((n) => only.size === 0 || only.has(n))
    .sort();
const names = svgNames(src);
const nodeIds = defaultRun && existsSync(nodeSrc)
  ? readdirSync(nodeSrc, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
  : [];
const nodeNames = new Map(nodeIds.map((id) => [id, svgNames(join(nodeSrc, id))]));
const known = new Set([...names, ...[...nodeNames.values()].flat()]);
let failed = false;
for (const n of only) {
  if (!known.has(n)) {
    console.error(`no such illustration: ${n}`);
    failed = true;
  }
}

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: (WIDTH * 9) / 16 } });

/** Renders `<from>/<name>.svg` to `<to>/<name>.png` for every name, after the style checks. */
async function render(from, to, list, label = (n) => n) {
  if (list.length > 0) mkdirSync(to, { recursive: true });
  for (const name of list) {
    let svg;
    try {
      svg = inline(readFileSync(join(from, `${name}.svg`), 'utf8'), kit);
    } catch (e) {
      console.error(`✗ ${label(name)}: ${e.message}`);
      failed = true;
      continue;
    }
    const found = problems(svg, colours);
    if (found.length > 0) {
      for (const p of found) console.error(`✗ ${label(name)}: ${p}`);
      failed = true;
      continue;
    }
    await page.setContent(`<html><body style="margin:0">${sized(svg, WIDTH)}</body></html>`);
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: (WIDTH * 9) / 16 } });
    writeFileSync(join(to, `${name}.png`), png);
    console.log(`✓ ${label(name)} (${(png.length / 1024).toFixed(0)} kB)`);
  }
}

mkdirSync(out, { recursive: true });
await render(src, out, names);
for (const [id, list] of nodeNames) await render(join(nodeSrc, id), join(nodeOut, id), list, (n) => `nodes/${id}/${n}`);
await browser.close();

const { count, total } = writeRegistry(out, registry);
console.log(`${count} illustrations, ${(total / 1024 / 1024).toFixed(2)} MB; wrote ${relative(ROOT, registry)}`);
let bundled = total;
if (defaultRun) {
  const nodes = writeNodeRegistry(nodeOut, nodeRegistry);
  bundled += nodes.total;
  console.log(`${nodes.count} Node pictures, ${(nodes.total / 1024 / 1024).toFixed(2)} MB; wrote ${relative(ROOT, nodeRegistry)}`);
}
console.log(`${(bundled / 1024 / 1024).toFixed(2)} MB bundled of ${(BUDGET / 1024 / 1024).toFixed(0)} MB`);
if (bundled > BUDGET) {
  console.error('over the 7 MB budget: simplify the art or lower the resolution');
  failed = true;
}
process.exit(failed ? 1 : 0);
