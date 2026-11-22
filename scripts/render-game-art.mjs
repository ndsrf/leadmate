// Renders the Dog Game illustrations: every scripts/art/games/<game-id>.svg (640 by 360, same kit, palette and no-text
// rules as the Lesson art) to content/<channel>/games/<game-id>/media/<game-id>-1.png at 960 by 540. Pack media, never
// bundled in the app. Fails on a colour outside tokens.json (plus GAME_COLOURS), any <text>, an unknown kit symbol or a
// PNG over 250 KB. Run: node scripts/render-game-art.mjs [game-id ...] [--channel beta] [--src dir]
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium } from 'playwright-core';
import { inline, loadKit, palette, problems, ROOT, sized } from './art/lessons/_kit/svg.mjs';

const WIDTH = 960;
const MAX_BYTES = 250 * 1024;
/** Tones the games added to the Lesson palette: the blue of the step and the cups, and the croquette brown family is already the Dog's coat. */
export const GAME_COLOURS = ['#5C8DBE', '#8DB4DC'];

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  return args.splice(i, 2)[1];
};
const channel = flag('--channel', 'beta');
const src = flag('--src', join(ROOT, 'scripts/art/games'));
const only = new Set(args);
const kit = loadKit();
const colours = new Set([...palette(), ...GAME_COLOURS]);
const names = readdirSync(src).filter((f) => f.endsWith('.svg')).map((f) => basename(f, '.svg')).filter((n) => only.size === 0 || only.has(n)).sort();
let failed = false;
for (const n of only) if (!names.includes(n)) { console.error(`no such game illustration: ${n}`); failed = true; }

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: (WIDTH * 9) / 16 } });
for (const id of names) {
  let svg;
  try { svg = inline(readFileSync(join(src, `${id}.svg`), 'utf8'), kit); } catch (e) { console.error(`✗ ${id}: ${e.message}`); failed = true; continue; }
  const found = problems(svg, colours);
  if (found.length > 0) { for (const p of found) console.error(`✗ ${id}: ${p}`); failed = true; continue; }
  await page.setContent(`<html><body style="margin:0">${sized(svg, WIDTH)}</body></html>`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: (WIDTH * 9) / 16 } });
  const dir = join(ROOT, 'content', channel, 'games', id, 'media');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${id}-1.png`), png);
  const over = png.length > MAX_BYTES;
  if (over) failed = true;
  console.log(`${over ? '✗' : '✓'} ${id} (${(png.length / 1024).toFixed(0)} kB${over ? ', over 250 kB' : ''})`);
}
await browser.close();
process.exit(failed ? 1 : 0);
