// A contact sheet for reviewing Lesson illustrations in one pass: every rendered assets/lessons/<name>.png with its
// name, caption and alt text (from the Spanish catalog, via the SVG's data-caption / data-alt keys) and a copy at
// 320 points, the narrowest phone. With --kit, a preview of every kit symbol instead. Writes an HTML page and a
// full-page PNG of it. Run render-lesson-art.mjs first.
// Run: node scripts/lesson-art-sheet.mjs [--kit] [name-prefix ...] [--out dir] [--src svg-dir] [--png png-dir]
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { inline, loadKit, ROOT } from './art/lessons/_kit/svg.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};
const kitMode = args.includes('--kit');
const out = flag('--out', join(ROOT, 'dist'));
const svgDir = flag('--src', join(ROOT, 'scripts/art/lessons'));
const pngDir = flag('--png', join(ROOT, 'assets/lessons'));
const prefixes = args.filter((a) => !a.startsWith('--'));
mkdirSync(out, { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
/** Catalog text by key, read straight from the Spanish catalog sources. */
const catalog = new Map(
  ['src/i18n/es.ts', 'src/i18n/es.trail.ts'].flatMap((f) =>
    [...readFileSync(join(ROOT, f), 'utf8').matchAll(/^\s*'([^']+)':\s*'((?:[^'\\]|\\.)*)',?$/gm)].map((m) => [m[1], m[2].replace(/\\'/g, "'")]),
  ),
);
const style = `body{font:14px/1.4 system-ui,sans-serif;background:#F6EFE0;color:#1E2A3A;margin:24px}
h1{font-size:20px}.grid{display:flex;flex-wrap:wrap;gap:20px}.card{background:#FFFBF1;border:2.5px solid #1E2A3A;border-radius:14px;padding:12px;width:980px}
.row{display:flex;gap:16px;align-items:flex-start}.name{font:600 15px monospace}.cap{font-weight:600;margin-top:6px}.alt{color:#4A5578}
.missing{color:#A63A22;font-weight:600}img{border:1px solid #D8CFB8;border-radius:8px;display:block}
.sym{width:220px;background:#FFFBF1;border:2px solid #1E2A3A;border-radius:10px;padding:8px}.sym svg{width:200px;height:140px;background:#CFE6EE}`;

let body;
let title;
if (kitMode) {
  const kit = loadKit();
  title = `Kit: ${kit.size} symbols`;
  const cells = [...kit.keys()]
    .filter((id) => prefixes.length === 0 || prefixes.some((p) => id.startsWith(p)))
    .map((id) => `<div class="sym"><svg data-fit xmlns="http://www.w3.org/2000/svg">${inline(`<use href="#${id}"/>`, kit)}</svg><div class="name">${esc(id)}</div></div>`);
  body = `<div class="grid">${cells.join('')}</div>`;
} else {
  const dir = pngDir;
  const names = readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .map((f) => basename(f, '.png'))
    .filter((n) => prefixes.length === 0 || prefixes.some((p) => n.startsWith(p)))
    .sort();
  title = `Lesson illustrations: ${names.length}`;
  const text = (svg, attr) => {
    const key = new RegExp(`${attr}="([^"]+)"`).exec(svg)?.[1];
    if (!key) return `<span class="missing">no ${attr}</span>`;
    return catalog.has(key) ? esc(catalog.get(key)) : `<span class="missing">${esc(key)} not in the catalog</span>`;
  };
  const cards = names.map((n) => {
    let svg = '';
    try {
      svg = readFileSync(join(svgDir, `${n}.svg`), 'utf8');
    } catch {
      // a control capture has no SVG source: its texts are the How-to-play Lesson's `c<n>` keys
      const capture = /^(howto-.+)-(\d+)$/.exec(n);
      if (capture) svg = `data-caption="trail.${capture[1]}.c${capture[2]}.caption" data-alt="trail.${capture[1]}.c${capture[2]}.alt"`;
    }
    const src = pathToFileURL(join(dir, `${n}.png`)).href;
    return `<div class="card"><div class="name">${esc(n)}</div><div class="row"><img src="${src}" width="640" height="360" alt=""><img src="${src}" width="320" height="180" alt=""></div>
<div class="cap">${svg ? text(svg, 'data-caption') : ''}</div><div class="alt">${svg ? text(svg, 'data-alt') : ''}</div></div>`;
  });
  body = `<div class="grid">${cards.join('')}</div>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${style}</style></head><body><h1>${esc(title)}</h1>${body}
<script>for (const s of document.querySelectorAll('svg[data-fit]')) { const b = s.getBBox(); const p = 8; s.setAttribute('viewBox', [b.x - p, b.y - p, b.width + 2 * p, b.height + 2 * p].join(' ')); }</script></body></html>`;
const file = join(out, kitMode ? 'lesson-kit-sheet.html' : 'lesson-art-sheet.html');
writeFileSync(file, html);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: kitMode ? 1240 : 1060, height: 800 } });
await page.goto(pathToFileURL(file).href);
await page.waitForLoadState('load');
const png = file.replace(/\.html$/, '.png');
await page.screenshot({ path: png, fullPage: true });
await browser.close();
console.log(`wrote ${file}\nwrote ${png}`);
