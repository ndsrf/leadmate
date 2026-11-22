// Renders the Shop product pictures: every scripts/art/shop/<product-id>.svg (640 by 360, same kit, palette and no-text
// rules as the Lesson and game art) to content/<channel>/shop/products/<product-id>/media/<product-id>.png at 1280 by
// 720, the size of the other product pictures. Fails on a colour outside tokens.json (plus EXTRA_COLOURS), any <text>,
// an unknown kit symbol or a PNG over 500 KB. Beta and stable carry the same picture, so by default both are written.
// Run: node scripts/render-shop-art.mjs [product-id ...] [--channel beta|stable] [--src dir]
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium } from 'playwright-core';
import { inline, loadKit, palette, problems, ROOT, sized } from './art/lessons/_kit/svg.mjs';

const WIDTH = 1280;
const MAX_BYTES = 500 * 1024;
/** Tones beyond the Lesson palette that the Dog Games already use (blue of the step and cups). */
const EXTRA_COLOURS = ['#5C8DBE', '#8DB4DC'];

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  return args.splice(i, 2)[1];
};
const channels = flag('--channel', 'beta,stable').split(',');
const src = flag('--src', join(ROOT, 'scripts/art/shop'));
const only = new Set(args);
const kit = loadKit();
const colours = new Set([...palette(), ...EXTRA_COLOURS]);
const names = readdirSync(src).filter((f) => f.endsWith('.svg')).map((f) => basename(f, '.svg')).filter((n) => only.size === 0 || only.has(n)).sort();
let failed = false;
for (const n of only) if (!names.includes(n)) { console.error(`no such product illustration: ${n}`); failed = true; }

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: (WIDTH * 9) / 16 } });
for (const id of names) {
  let svg;
  try { svg = inline(readFileSync(join(src, `${id}.svg`), 'utf8'), kit); } catch (e) { console.error(`✗ ${id}: ${e.message}`); failed = true; continue; }
  const found = problems(svg, colours);
  if (found.length > 0) { for (const p of found) console.error(`✗ ${id}: ${p}`); failed = true; continue; }
  await page.setContent(`<html><body style="margin:0">${sized(svg, WIDTH)}</body></html>`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: (WIDTH * 9) / 16 } });
  const over = png.length > MAX_BYTES;
  if (over) failed = true;
  for (const channel of channels) {
    const dir = join(ROOT, 'content', channel, 'shop', 'products', id, 'media');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${id}.png`), png);
  }
  console.log(`${over ? '✗' : '✓'} ${id} (${(png.length / 1024).toFixed(0)} kB${over ? ', over 500 kB' : ''})`);
}
await browser.close();
process.exit(failed ? 1 : 0);
