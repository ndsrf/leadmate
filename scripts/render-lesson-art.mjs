// Renders the Lesson illustrations: every scripts/art/lessons/<name>.svg (640 by 360, built from the kit in
// scripts/art/lessons/_kit/) to assets/lessons/<name>.png at 1280 by 720, then writes src/shell/lessons/lessonArtRegistry.ts
// from the PNGs present, so the registry never drifts from the files. Fails on a colour outside tokens.json, on any
// <text>, on an unknown kit symbol, or when the PNGs together pass 6 MB. See docs/content/lesson-guide.md.
// Run: node scripts/render-lesson-art.mjs [name ...] [--src dir] [--out dir] [--registry file]
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { chromium } from 'playwright-core';
import { BUDGET, inline, loadKit, palette, problems, ROOT, sized, writeRegistry } from './art/lessons/_kit/svg.mjs';

const WIDTH = 1280;

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};
const src = flag('--src', join(ROOT, 'scripts/art/lessons'));
const out = flag('--out', join(ROOT, 'assets/lessons'));
const registry = flag('--registry', join(ROOT, 'src/shell/lessons/lessonArtRegistry.ts'));
const only = new Set(args);

const kit = loadKit();
const colours = palette();
const names = readdirSync(src)
  .filter((f) => f.endsWith('.svg'))
  .map((f) => basename(f, '.svg'))
  .filter((n) => only.size === 0 || only.has(n))
  .sort();
if (only.size > 0) for (const n of only) if (!names.includes(n)) console.error(`no such illustration: ${n}`);

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: (WIDTH * 9) / 16 } });
let failed = only.size > names.length;
for (const name of names) {
  let svg;
  try {
    svg = inline(readFileSync(join(src, `${name}.svg`), 'utf8'), kit);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
    failed = true;
    continue;
  }
  const found = problems(svg, colours);
  if (found.length > 0) {
    for (const p of found) console.error(`✗ ${name}: ${p}`);
    failed = true;
    continue;
  }
  await page.setContent(`<html><body style="margin:0">${sized(svg, WIDTH)}</body></html>`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: (WIDTH * 9) / 16 } });
  writeFileSync(join(out, `${name}.png`), png);
  console.log(`✓ ${name} (${(png.length / 1024).toFixed(0)} kB)`);
}
await browser.close();

const { count, total } = writeRegistry(out, registry);
console.log(`${count} illustrations, ${(total / 1024 / 1024).toFixed(2)} MB of ${(BUDGET / 1024 / 1024).toFixed(0)} MB; wrote ${relative(ROOT, registry)}`);
if (total > BUDGET) {
  console.error('over the 6 MB budget: simplify the art or lower the resolution');
  failed = true;
}
process.exit(failed ? 1 : 0);
