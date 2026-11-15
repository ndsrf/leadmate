// Renders the HUD feedback art (scripts/art/hud/) and the Dog portrait layers (scripts/art/portrait/): runs each set's
// generator, checks every SVG with the lesson kit's rules (colours only from tokens.json, no <text>, no foreign content),
// renders it to PNG at its own size on a transparent background, then packs each set into a palette-quantised Phaser atlas
// bundle/assets/<hud|portrait>/sprites.{png,json} with scripts/pack-art-atlas.py. Also writes a contact sheet per set to
// the scratch dir given with --sheets (default none). Fails on any style problem.
// Run: node scripts/render-hud-art.mjs [hud] [portrait] [--sheets dir]
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { chromium } from 'playwright-core';
import { palette, problems, ROOT } from './art/lessons/_kit/svg.mjs';

const args = process.argv.slice(2);
const si = args.indexOf('--sheets');
const sheets = si >= 0 ? args.splice(si, 2)[1] : null;
const SETS = {
  hud: { pack: [] },
  portrait: { pack: ['--trim', '--pivot', '0.5,0.6172'] }, // pivot: the neck anchor (128, 158) of the 256 canvas
};
const wanted = args.length > 0 ? args : Object.keys(SETS);
const colours = palette();
let failed = false;

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage();
for (const set of wanted) {
  if (!SETS[set]) { console.error(`no such set: ${set}`); failed = true; continue; }
  execFileSync('node', [join(ROOT, `scripts/art/${set}/gen.mjs`)], { stdio: 'inherit' });
  const dir = join(ROOT, `scripts/art/${set}/svg`);
  const tmp = mkdtempSync(join(tmpdir(), `leadmate-${set}-`));
  const rendered = [];
  for (const file of readdirSync(dir).filter((n) => n.endsWith('.svg')).sort()) {
    const name = basename(file, '.svg');
    const text = readFileSync(join(dir, file), 'utf8');
    const found = problems(text, colours);
    if (found.length > 0) { for (const p of found) console.error(`✗ ${set}/${name}: ${p}`); failed = true; continue; }
    const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(text);
    await page.setViewportSize({ width: +w, height: +h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${text}</body></html>`);
    writeFileSync(join(tmp, `${name}.png`), await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: +w, height: +h } }));
    rendered.push(name);
  }
  if (failed) continue;
  execFileSync('python3', [join(ROOT, 'scripts/pack-art-atlas.py'), tmp, join(ROOT, `bundle/assets/${set}`), ...SETS[set].pack], { stdio: 'inherit' });
  if (sheets) {
    mkdirSync(sheets, { recursive: true });
    const imgs = rendered.map((n) => `<figure><img src="data:image/png;base64,${readFileSync(join(tmp, `${n}.png`)).toString('base64')}"/><figcaption>${n}</figcaption></figure>`);
    // two stage-like backdrops per frame: light (the Stage) and dark, plus 1x small to judge legibility
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.setContent(`<html><body style="margin:0;background:#F6EFE0;font:11px sans-serif;display:flex;flex-wrap:wrap;gap:8px;padding:8px">${imgs.join('')}</body></html>`);
    await page.screenshot({ path: join(sheets, `${set}-sheet.png`), fullPage: true });
  }
  rmSync(tmp, { recursive: true });
}
await browser.close();
process.exit(failed ? 1 : 0);
