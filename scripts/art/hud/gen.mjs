// Writes scripts/art/hud/svg/<frame>.svg: the in-Stage feedback icons, effect shapes and Stage Meter icons that
// scripts/render-hud-art.mjs renders and packs into bundle/assets/hud/sprites.{png,json}. Same flat paper-cut style as the
// lesson kit (ink outline, round joins), colours from src/shell/ui/tokens.json only, no text. Icons are 64 by 64 and must
// read at 24-32 px: one bold silhouette each, told apart by shape (not colour alone).
// Run: node scripts/art/hud/gen.mjs   (or node scripts/render-hud-art.mjs, which runs it first)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, '../../../src/shell/ui/tokens.json'), 'utf8'));
const c = tokens.color;
const m = tokens.mascot;
const INK = c.ink;
const W = 3; // outline width at 64 px

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${body.trim()}\n</svg>\n`;
const line = `stroke="${INK}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round"`;
/** A union of shapes with one outline: the outline colour drawn fat underneath, the fill on top. */
const union = (shapes, fill, outline = INK, w = W) =>
  `<g fill="${outline}" stroke="${outline}" stroke-width="${w * 2}" stroke-linejoin="round">${shapes}</g><g fill="${fill}">${shapes}</g>`;
const star4 = (cx, cy, r, k = 0.2) =>
  `M${cx} ${cy - r}Q${cx + r * k} ${cy - r * k} ${cx + r} ${cy}Q${cx + r * k} ${cy + r * k} ${cx} ${cy + r}Q${cx - r * k} ${cy + r * k} ${cx - r} ${cy}Q${cx - r * k} ${cy - r * k} ${cx} ${cy - r}Z`;
const spikes = (cx, cy, n, ro, ri, rot = -90) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const r = i % 2 === 0 ? ro : ri;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join('L');

const f = {};

// paw: a followed turn
f.icon_paw = svg(64, 64, `
  ${union(`<ellipse cx="14" cy="30" rx="6.5" ry="8" transform="rotate(-25 14 30)"/><ellipse cx="25" cy="18" rx="6.5" ry="8.5"/><ellipse cx="39" cy="18" rx="6.5" ry="8.5"/><ellipse cx="50" cy="30" rx="6.5" ry="8" transform="rotate(25 50 30)"/><path d="M32 29C42 29 52 42 50 50C48 57 40 55 32 55C24 55 16 57 14 50C12 42 22 29 32 29Z"/>`, c.brand)}
  <path d="M24 44Q32 39 40 44" fill="none" stroke="${c.brandDeep}" stroke-width="3" stroke-linecap="round"/>`);

// eye: a Check-in (looking at the Handler)
f.icon_eye = svg(64, 64, `
  <path d="M3 32Q32 6 61 32Q32 58 3 32Z" fill="${c.surface}" ${line}/>
  <circle cx="32" cy="32" r="12" fill="${c.info}" ${line}/>
  <circle cx="32" cy="32" r="5" fill="${INK}"/>
  <circle cx="36.5" cy="27.5" r="3" fill="${c.surface}"/>`);

// heart: a Check-in (the bond)
f.icon_heart = svg(64, 64, `
  <path d="M32 57C8 40 4 24 14 14C22 7 30 12 32 19C34 12 42 7 50 14C60 24 56 40 32 57Z" fill="${c.coral}" ${line}/>
  <path d="M14 24Q15 18 21 16" fill="none" stroke="${c.surface}" stroke-width="3.5" stroke-linecap="round"/>`);

// nose: Go Sniff (a front view of a Dog's nose, nostrils, a glint)
f.icon_nose = svg(64, 64, `
  <path d="M8 20Q32 8 56 20Q60 36 46 48Q32 58 18 48Q4 36 8 20Z" fill="${m.coatDark}" ${line}/>
  <path d="M32 32V44" fill="none" ${line}/><path d="M18 17Q27 12 36 13" fill="none" stroke="${m.coatLight}" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="21" cy="30" rx="8" ry="4" fill="${INK}" transform="rotate(-22 21 30)"/>
  <ellipse cx="43" cy="30" rx="8" ry="4" fill="${INK}" transform="rotate(22 43 30)"/>
  <path d="M16 19Q24 14 31 15" fill="none" stroke="${m.coatLight}" stroke-width="3" stroke-linecap="round"/>`);

// hourglass: waiting
f.icon_hourglass = svg(64, 64, `
  <path d="M16 10H48C48 27 36 28 36 32C36 36 48 37 48 54H16C16 37 28 36 28 32C28 28 16 27 16 10Z" fill="${c.surface}" ${line}/>
  <path d="M21 14H43C42 22 36 24 32 28C28 24 22 22 21 14Z" fill="${c.accent}"/>
  <path d="M20 51H44C43 45 38 42 32 38C26 42 21 45 20 51Z" fill="${c.accent}"/>
  <path d="M32 28V40" stroke="${c.accent}" stroke-width="2.4" stroke-linecap="round"/>
  <rect x="9" y="4" width="46" height="7" rx="3.5" fill="${c.brandDeep}" ${line}/>
  <rect x="9" y="53" width="46" height="7" rx="3.5" fill="${c.brandDeep}" ${line}/>`);

// sparkle: a fresh move (one big four-point glint and two small ones)
f.icon_sparkle = svg(64, 64, `
  <path d="${star4(28, 36, 25, 0.2)}" fill="${c.accent}" ${line}/>
  <path d="${star4(52, 12, 10, 0.2)}" fill="${c.accentSoft}" ${line}/>
  <path d="${star4(53, 50, 7, 0.2)}" fill="${c.accentSoft}" ${line}/>`);

// star: a Chain / Perfect
f.icon_star = svg(64, 64, `
  <path d="M${spikes(32, 35, 5, 29, 13)}Z" fill="${c.star}" ${line}/>
  <path d="M25 26L32 12" fill="none" stroke="${c.accentSoft}" stroke-width="3.5" stroke-linecap="round"/>`);

// puff: a mistake. Grey (never red), soft, round.
const puffShapes = '<circle cx="22" cy="38" r="12"/><circle cx="38" cy="34" r="15"/><circle cx="46" cy="44" r="10"/><rect x="14" y="40" width="40" height="14" rx="7"/>';
f.icon_puff = svg(64, 64, `
  ${union(puffShapes, c.locked, c.lockedText)}
  ${union('<circle cx="12" cy="20" r="4"/><circle cx="52" cy="18" r="3"/>', c.locked, c.lockedText, 2)}
  <path d="M26 33Q31 28 38 28" fill="none" stroke="${c.surface}" stroke-width="3.5" stroke-linecap="round"/>`);

// mark: the Marker (a clicker button being pressed, three click ticks)
f.icon_mark = svg(64, 64, `
  <path d="M14 14L19 22M32 8V18M50 14L45 22" fill="none" stroke="${c.accent}" stroke-width="5" stroke-linecap="round"/>
  <path d="M10 44C10 34 20 28 32 28C44 28 54 34 54 44V50C54 55 44 58 32 58C20 58 10 55 10 50Z" fill="${c.brandDeep}" ${line}/>
  <ellipse cx="32" cy="42" rx="20" ry="11" fill="${c.accent}" ${line}/>
  <path d="M20 40Q24 35 31 35" fill="none" stroke="${c.accentSoft}" stroke-width="3.5" stroke-linecap="round"/>`);

// Stage Meter icons: a round badge so a meter reads as a meter at 24 px, not as the action's icon
const badge = (inner) => svg(64, 64, `
  <circle cx="32" cy="32" r="29" fill="${c.surface}" ${line}/>
  <circle cx="32" cy="32" r="22" fill="${c.accentSoft}"/>
  ${inner}`);
// Nose: the Dog's nose with two sniff waves
f.meter_nose = badge(`
  <path d="M14 25Q32 16 50 25Q53 36 43 44Q32 52 21 44Q11 36 14 25Z" fill="${m.coatDark}" ${line}/>
  <ellipse cx="25" cy="31" rx="6" ry="3.2" fill="${INK}" transform="rotate(-22 25 31)"/>
  <ellipse cx="39" cy="31" rx="6" ry="3.2" fill="${INK}" transform="rotate(22 39 31)"/><path d="M32 34V41" fill="none" ${line}/>`);
// Connection: two linked rings, the Handler's and the Dog's
const ring = (cx, col) => `<ellipse cx="${cx}" cy="32" rx="10" ry="8" fill="none" stroke="${INK}" stroke-width="8"/><ellipse cx="${cx}" cy="32" rx="10" ry="8" fill="none" stroke="${col}" stroke-width="3.5"/>`;
f.meter_connection = badge(`${ring(22, c.brand)}${ring(42, c.coral)}`);

// burst_spark: one pooled particle (the small tier throws a few)
f.burst_spark = svg(32, 32, `<path d="${star4(16, 16, 14, 0.22)}" fill="${c.accent}" stroke="${c.accentSoft}" stroke-width="1.5" stroke-linejoin="round"/>`);

// burst_star: the medium tier's burst behind the icon
f.burst_star = svg(128, 128, `
  <path d="M${spikes(64, 64, 12, 61, 36, -90)}Z" fill="${c.accent}" ${line}/>
  <circle cx="64" cy="64" r="30" fill="${c.accentSoft}" stroke="${c.accent}" stroke-width="3"/>`);

// banner_frame: the big tier's banner, stretches in the middle (keep 56 px at each end); text goes on top at run time
f.banner_frame = svg(512, 96, `
  <path d="M4 34H64V88H4L22 61Z" fill="${c.accent}" ${line.replace(`stroke-width="${W}"`, 'stroke-width="4"')}/>
  <path d="M508 34H448V88H508L490 61Z" fill="${c.accent}" ${line.replace(`stroke-width="${W}"`, 'stroke-width="4"')}/>
  <rect x="36" y="8" width="440" height="68" rx="14" fill="${c.surface}" ${line.replace(`stroke-width="${W}"`, 'stroke-width="4"')}/>
  <rect x="46" y="17" width="420" height="50" rx="8" fill="none" stroke="${c.accent}" stroke-width="3"/>`);

// glow_edge: the big tier's glowing screen edge: a soft frame, clear in the middle. Slice it 40 px from each side
// and stretch the middle to the screen (the centre stays empty). Rings fade inwards; no gradients (palette rules).
f.glow_edge = svg(128, 128, [0, 1, 2, 3, 4].map((i) => `<rect x="${4 + i * 7}" y="${4 + i * 7}" width="${120 - i * 14}" height="${120 - i * 14}" rx="${34 - i * 5}" fill="none" stroke="${c.accent}" stroke-width="8" opacity="${[0.5, 0.36, 0.24, 0.14, 0.07][i]}"/>`).join('\n'));

mkdirSync(join(here, 'svg'), { recursive: true });
for (const [name, body] of Object.entries(f)) writeFileSync(join(here, 'svg', `${name}.svg`), body);
console.log(`${Object.keys(f).length} HUD sources written to scripts/art/hud/svg/`);
