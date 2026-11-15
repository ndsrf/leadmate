// Writes scripts/art/portrait/svg/portrait_<layer>.svg: the Dog portrait's layers (readable-dog design Decision 5),
// rendered and packed into bundle/assets/portrait/sprites.{png,json} by scripts/render-hud-art.mjs.
//
// Every layer is a 256 by 256 canvas on ONE shared registration, so any combination composes by stacking at the same
// origin, in this order: tail, body, head, ears, eyes.
//   - the neck anchor is (128, 158) (the atlas pivot): the skull is a circle of radius 50 at (128, 104) in EVERY head layer,
//     so the ears (attached on its top corners) and the eyes (at (104, 98) and (152, 98)) fit any head; a head layer only
//     moves the muzzle (up, down, to a side, to the viewer), like a cartoon three-quarter turn
//   - the tail grows from the rump at (50, 214), behind the body
//   - the Dog faces the viewer's right (turned_left is the mirror)
// Coat: light (coat.blanco with a shade) so the game can tint it to any coat colour, as it tints the walking Dog (a tint can
// only darken); the harness collar and the nose, eyes and outline are ink and brand colours (a tint darkens them too).
// Colours from src/shell/ui/tokens.json only, no text.
// Run: node scripts/art/portrait/gen.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, '../../../src/shell/ui/tokens.json'), 'utf8'));
const c = tokens.color;
const INK = c.ink;
const COAT = tokens.coat.blanco; // light, tintable
const SHADE = c.surfaceSunken;
const EAR = c.edge;
const W = 5;

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">\n${body.trim()}\n</svg>\n`;
const line = (w = W) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
/** The same markup mirrored about the vertical axis x = 128. */
const mirror = (inner) => `<g transform="translate(256 0) scale(-1 1)">${inner}</g>`;
/** A two-tone tube: ink under, coat on top. */
const tube = (d, w = 19) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 2 * W}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${COAT}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const f = {};

// body: shoulders and chest under the head, with the harness collar and its ring
f.portrait_body = svg(`
  <path d="M42 256C42 196 72 162 128 160C184 162 214 196 214 256Z" fill="${COAT}" ${line()}/>
  <ellipse cx="128" cy="236" rx="44" ry="26" fill="${SHADE}"/>
  <path d="M82 176Q128 196 174 176" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
  <path d="M82 176Q128 196 174 176" fill="none" stroke="${c.brand}" stroke-width="13" stroke-linecap="round"/>
  <circle cx="128" cy="192" r="9" fill="${c.accent}" ${line(4)}/>`);

// heads: the skull is the same in all; the muzzle moves
const skull = `<circle cx="128" cy="104" r="50" fill="${COAT}" ${line()}/><ellipse cx="128" cy="134" rx="34" ry="14" fill="${SHADE}" opacity="0.55"/>`;
/** A side-on muzzle: ellipse (cx, cy, rx, ry) turned by `rot`, with its nose at the tip and a mouth line. */
const muzzle = (cx, cy, rx, ry, rot) => `
  <g transform="rotate(${rot} ${cx} ${cy})">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.surface}" ${line()}/>
    <ellipse cx="${cx + rx - 5}" cy="${cy - ry * 0.35}" rx="9" ry="7.5" fill="${INK}"/>
    <path d="M${cx - 4} ${cy + ry * 0.45}Q${cx + rx * 0.35} ${cy + ry * 0.9} ${cx + rx * 0.7} ${cy + ry * 0.4}" fill="none" ${line(3.5)}/>
  </g>`;
f.portrait_head_level = svg(skull + muzzle(138, 124, 30, 19, 0));
f.portrait_head_up = svg(skull + muzzle(140, 116, 31, 19, -26));
f.portrait_head_down = svg(skull + muzzle(138, 134, 30, 19, 24));
f.portrait_head_right = svg(skull + muzzle(148, 124, 36, 18, 0));
f.portrait_head_left = svg(mirror(skull + muzzle(148, 124, 36, 18, 0)));
f.portrait_head_viewer = svg(`${skull}
  <ellipse cx="128" cy="126" rx="29" ry="23" fill="${c.surface}" ${line()}/>
  <ellipse cx="128" cy="116" rx="11" ry="8" fill="${INK}"/>
  <path d="M128 124V132M128 132Q119 142 111 134M128 132Q137 142 145 134" fill="none" ${line(3.5)}/>`);

// ears: a pair, attached on the skull's top corners; forward is tall and pricked, neutral floppy, back pinned flat and out
const earPair = (left) => `${left}${mirror(left)}`;
f.portrait_ears_forward = svg(earPair(`<path d="M84 82C72 54 80 26 100 16C114 34 120 54 116 72Z" fill="${EAR}" ${line()}/><path d="M92 68C86 52 90 38 100 30C108 42 110 54 108 66Z" fill="${SHADE}"/>`));
f.portrait_ears_neutral = svg(earPair(`<path d="M86 66C58 56 46 86 56 118C68 128 82 114 92 92Z" fill="${EAR}" ${line()}/>`));
f.portrait_ears_back = svg(earPair(`<path d="M92 80C66 64 36 76 24 92C44 106 78 104 100 94Z" fill="${EAR}" ${line()}/>`));

// eyes: the gaze. Handler = looking out of the picture at the viewer (the Handler), with a bright glint
const eye = (cx, dx, dy, glint) => `
  <ellipse cx="${cx}" cy="98" rx="13" ry="14" fill="${c.surface}" ${line(3.5)}/>
  <circle cx="${cx + dx}" cy="${98 + dy}" r="7.5" fill="${INK}"/>
  <circle cx="${cx + dx + 2.6}" cy="${98 + dy - 2.8}" r="${glint}" fill="${c.surface}"/>`;
const eyes = (dx, dy, glint = 2.4) => svg(eye(104, dx, dy, glint) + eye(152, dx, dy, glint));
f.portrait_eyes_handler = svg(eye(104, 0, 1, 3.2) + eye(152, 0, 1, 3.2) + `<path d="M90 76Q104 68 118 76M138 76Q152 68 166 76" fill="none" ${line(3.5)}/>`);
f.portrait_eyes_left = eyes(-6, 0);
f.portrait_eyes_right = eyes(6, 0);
f.portrait_eyes_down = eyes(0, 6);

// tails, from the rump at (50, 214): high, two wag poses, neutral (out and low), tucked (curled under)
f.portrait_tail_high = svg(tube('M52 216C32 196 30 160 38 128'));
f.portrait_tail_wag_a = svg(tube('M52 216C24 212 8 190 12 160'));
f.portrait_tail_wag_b = svg(tube('M52 216C44 192 60 170 58 138'));
f.portrait_tail_neutral = svg(tube('M52 214C32 218 18 210 12 192'));
f.portrait_tail_tucked = svg(tube('M52 218C36 230 38 246 54 252'));

mkdirSync(join(here, 'svg'), { recursive: true });
for (const [name, body] of Object.entries(f)) writeFileSync(join(here, 'svg', `${name}.svg`), body);
console.log(`${Object.keys(f).length} portrait layers written to scripts/art/portrait/svg/`);
