// Writes scripts/art/lessons/_kit/kit.svg: the shared cast and props of every Lesson illustration, as <symbol>s.
// The Dog is Migas from src/shell/ui/lessonArt.tsx (same proportions, coat and harness); the Person and props follow
// the app icon's flat paper-cut style. Colours come from src/shell/ui/tokens.json only.
// Run: node scripts/art/lessons/_kit/kit.mjs
//
// Conventions (see docs/content/lesson-guide.md):
// - side-view figures face right and stand on y = 0 with their origin under their middle; mirror with scale(-1 1)
// - the Dog's harness ring is at (14, -66); a walking Person's hand at (18, -82); with the Dog 200 to the right of
//   the Person, leash-u / leash-j / leash-taut join the two exactly (leash-still-* from person-still's hand at (16, -100))
// - a leash drawn by hand: the same path twice, stroke ink 8.5 then brand 4.5, round caps
// - top-down pieces (top-*) are seen from above, centred on their origin, for diagrams of positions
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, '../../../../src/shell/ui/tokens.json'), 'utf8'));
const c = tokens.color;
const m = tokens.mascot;
const INK = c.ink;
const S = 2.5; // outline width

const symbols = [];
const sym = (id, body) => symbols.push(`  <symbol id="${id}" overflow="visible">\n    ${body.trim().replace(/\n\s*/g, '\n    ')}\n  </symbol>`);
/** A two-tone stroke: ink underneath, `fill` on top, like the app icon's leash. */
const duo = (d, fill, w = 5) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// -- the Dog, in parts, for two coats ----------------------------------------------------------------------------------

function dogParts(p, coat, dark, light) {
  sym(`${p}-leg`, `<rect x="-6" y="0" width="12" height="28" rx="6" fill="${coat}" stroke="${INK}" stroke-width="${S}"/>`);
  sym(`${p}-leg-back`, `<rect x="-6" y="0" width="12" height="28" rx="6" fill="${dark}" stroke="${INK}" stroke-width="${S}"/>`);
  sym(`${p}-tail`, duo('M0 0C-14 -6 -16 -20 -6 -28', dark));
  sym(`${p}-tail-up`, duo('M0 0C-6 -10 -8 -22 -4 -32', dark));
  sym(`${p}-tail-down`, duo('M0 0C-12 4 -18 14 -18 24', dark));
  sym(`${p}-body`, `
    <rect x="-40" y="-20" width="80" height="40" rx="20" fill="${coat}" stroke="${INK}" stroke-width="${S}"/>
    <ellipse cx="-4" cy="12" rx="24" ry="4.5" fill="${light}"/>
    ${duo('M14 -20V19', c.brand, 4)}
    <circle cx="14" cy="-22" r="5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>`);
  sym(`${p}-head`, `
    <circle cx="0" cy="0" r="17" fill="${coat}" stroke="${INK}" stroke-width="${S}"/>
    <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${light}" stroke="${INK}" stroke-width="${S}"/>
    <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
    <circle cx="5" cy="-4" r="2.8" fill="${INK}"/>
    <path d="M16 14q5 3 9 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M-10 -12C-22 -12 -24 8 -16 14C-6 10 -4 -4 -6 -10z" fill="${dark}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`);
  // alert: ear up and forward, mouth closed and tight
  sym(`${p}-head-alert`, `
    <path d="M-8 -12L-2 -36L8 -13z" fill="${dark}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
    <circle cx="0" cy="0" r="17" fill="${coat}" stroke="${INK}" stroke-width="${S}"/>
    <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${light}" stroke="${INK}" stroke-width="${S}"/>
    <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
    <circle cx="5" cy="-4" r="3.4" fill="${INK}"/>
    <path d="M16 13h9" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`);
  // calm: soft eye, open relaxed mouth
  sym(`${p}-head-calm`, `
    <circle cx="0" cy="0" r="17" fill="${coat}" stroke="${INK}" stroke-width="${S}"/>
    <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${light}" stroke="${INK}" stroke-width="${S}"/>
    <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
    <path d="M2 -4q3 -3 6 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M15 13q6 6 12 0" fill="${c.coral}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-10 -12C-22 -12 -24 8 -16 14C-6 10 -4 -4 -6 -10z" fill="${dark}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`);

  const shadow = '<ellipse cx="2" cy="1" rx="50" ry="5" fill="' + INK + '" opacity="0.14"/>';
  const legs = (back, front) =>
    `<use href="#${p}-leg-back" transform="translate(-26 -28) rotate(${back[0]})"/><use href="#${p}-leg-back" transform="translate(22 -28) rotate(${back[1]})"/>` +
    `<use href="#${p}-leg" transform="translate(-18 -28) rotate(${front[0]})"/><use href="#${p}-leg" transform="translate(30 -28) rotate(${front[1]})"/>`;
  const walkBody = (head, tail = 'tail') => `${legs([14, -14], [-12, 10])}<use href="#${p}-${tail}" transform="translate(-36 -56)"/><use href="#${p}-body" transform="translate(0 -44)"/>${head}`;

  sym(`${p}-walk`, `${shadow}${walkBody(`<use href="#${p}-head" transform="translate(46 -66)"/>`)}`);
  sym(`${p}-walk-calm`, `${shadow}${walkBody(`<use href="#${p}-head-calm" transform="translate(46 -66)"/>`, 'tail-down')}`);
  // standing square, weight forward, head and tail up: fixed on something ahead
  sym(`${p}-look`, `${shadow}${legs([4, 0], [0, -4])}<use href="#${p}-tail-up" transform="translate(-36 -56)"/><use href="#${p}-body" transform="translate(0 -44)"/><use href="#${p}-head-alert" transform="translate(48 -70)"/>`);
  // leaning into the harness: legs stretched, head forward
  sym(`${p}-pull`, `${shadow}${legs([34, 20], [-6, -30])}<use href="#${p}-tail-up" transform="translate(-36 -54)"/><use href="#${p}-body" transform="translate(0 -42) rotate(6)"/><use href="#${p}-head-alert" transform="translate(52 -60) rotate(10)"/>`);
  // walking but looking back and up at the Person
  sym(`${p}-checkin`, `${shadow}${walkBody(`<use href="#${p}-head-calm" transform="translate(40 -74) rotate(18) scale(-1 1)"/>`, 'tail-down')}`);
  sym(`${p}-sniff`, `${shadow}${walkBody(`<use href="#${p}-head-calm" transform="translate(52 -34) rotate(38)"/>`, 'tail-down')}`);
  sym(`${p}-sit`, `
    ${shadow}
    <use href="#${p}-tail-down" transform="translate(-30 -10) rotate(70)"/>
    <ellipse cx="-16" cy="-16" rx="22" ry="16" fill="${dark}" stroke="${INK}" stroke-width="${S}"/>
    <use href="#${p}-leg" transform="translate(16 -46) scale(1 1.62)"/>
    <use href="#${p}-body" transform="translate(-2 -46) rotate(-42)"/>
    <use href="#${p}-leg" transform="translate(28 -46) scale(1 1.62)"/>
    <use href="#${p}-head-calm" transform="translate(30 -92)"/>`);
  sym(`${p}-down`, `
    ${shadow}
    <use href="#${p}-tail-down" transform="translate(-36 -14) rotate(60)"/>
    <rect x="20" y="-11" width="40" height="11" rx="5.5" fill="${dark}" stroke="${INK}" stroke-width="${S}"/>
    <use href="#${p}-body" transform="translate(0 -21)"/>
    <rect x="28" y="-11" width="40" height="11" rx="5.5" fill="${coat}" stroke="${INK}" stroke-width="${S}"/>
    <use href="#${p}-head-calm" transform="translate(48 -40)"/>`);
  // on the hind legs, front paws up
  sym(`${p}-jump`, `${shadow}<g transform="rotate(-32 -26 0)">${legs([10, -40], [-10, -50])}<use href="#${p}-tail-up" transform="translate(-36 -56)"/><use href="#${p}-body" transform="translate(0 -44)"/><use href="#${p}-head-alert" transform="translate(48 -66)"/></g>`);
}

dogParts('dog', m.coat, m.coatDark, m.coatLight);
dogParts('dog2', tokens.coat.grisAzulado, tokens.coat.negro, tokens.coat.blanco);

// -- the Person -------------------------------------------------------------------------------------------------------

const skin = tokens.coat.crema;
const hair = tokens.coat.negro;
const jacket = c.coral;
const trousers = c.inkMuted;
sym('person-leg', `<rect x="-7" y="0" width="14" height="80" rx="7" fill="${trousers}" stroke="${INK}" stroke-width="${S}"/><ellipse cx="4" cy="80" rx="11" ry="5" fill="${INK}"/>`);
sym('person-arm', `<rect x="-6.5" y="-4" width="13" height="52" rx="6.5" fill="${jacket}" stroke="${INK}" stroke-width="${S}"/><circle cx="0" cy="50" r="7" fill="${skin}" stroke="${INK}" stroke-width="${S}"/>`);
sym('person-forearm', `<rect x="-6.5" y="-4" width="13" height="30" rx="6.5" fill="${jacket}" stroke="${INK}" stroke-width="${S}"/><circle cx="0" cy="28" r="7" fill="${skin}" stroke="${INK}" stroke-width="${S}"/>`);
sym('person-top', `
  <rect x="-22" y="-66" width="44" height="70" rx="18" fill="${jacket}" stroke="${INK}" stroke-width="${S}"/>
  <circle cx="2" cy="-84" r="17" fill="${skin}" stroke="${INK}" stroke-width="${S}"/>
  <path d="M-15 -86C-16 -104 12 -108 18 -92C10 -96 -2 -94 -6 -86z" fill="${hair}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  <circle cx="10" cy="-84" r="2.4" fill="${INK}"/>`);
// hand at (18, -82)
sym('person-stand', `
  <ellipse cx="0" cy="1" rx="30" ry="5" fill="${INK}" opacity="0.14"/>
  <use href="#person-leg" transform="translate(-7 -80)"/><use href="#person-leg" transform="translate(7 -80)"/>
  <use href="#person-top" transform="translate(0 -76)"/>
  <use href="#person-arm" transform="translate(4 -130) rotate(-14)"/>`);
sym('person-walk', `
  <ellipse cx="0" cy="1" rx="34" ry="5" fill="${INK}" opacity="0.14"/>
  <use href="#person-leg" transform="translate(-2 -80) rotate(16)"/><use href="#person-leg" transform="translate(2 -80) rotate(-16)"/>
  <use href="#person-top" transform="translate(0 -76)"/>
  <use href="#person-arm" transform="translate(4 -130) rotate(-14)"/>`);
// the Poste: feet planted, hand anchored at the belly (16, -100)
sym('person-still', `
  <ellipse cx="0" cy="1" rx="32" ry="5" fill="${INK}" opacity="0.14"/>
  <use href="#person-leg" transform="translate(-10 -80) rotate(4)"/><use href="#person-leg" transform="translate(10 -80) rotate(-4)"/>
  <use href="#person-top" transform="translate(0 -76)"/>
  <use href="#person-arm" transform="translate(2 -130) scale(1 0.5)"/>
  <use href="#person-forearm" transform="translate(4 -106) rotate(-74)"/>`);
// kneeling on one knee with a treat held out low at (50, -60)
sym('person-crouch', `
  <ellipse cx="-10" cy="1" rx="50" ry="5" fill="${INK}" opacity="0.14"/>
  <rect x="-66" y="-14" width="46" height="14" rx="7" fill="${trousers}" stroke="${INK}" stroke-width="${S}"/>
  <ellipse cx="-64" cy="-4" rx="7" ry="6" fill="${INK}"/>
  <rect x="-7" y="0" width="14" height="40" rx="7" fill="${trousers}" stroke="${INK}" stroke-width="${S}" transform="translate(-2 -38) rotate(32)"/>
  <rect x="26" y="-44" width="14" height="44" rx="7" fill="${trousers}" stroke="${INK}" stroke-width="${S}"/>
  <ellipse cx="38" cy="0" rx="11" ry="5" fill="${INK}"/>
  <rect x="-6" y="-48" width="46" height="14" rx="7" fill="${trousers}" stroke="${INK}" stroke-width="${S}"/>
  <use href="#person-top" transform="translate(-2 -40) rotate(14)"/>
  <use href="#person-arm" transform="translate(8 -100) rotate(-42) scale(1 1.14)"/>
  <circle cx="53" cy="-62" r="6.5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>`);
// running: a jogger, in a different top so it reads as someone else
sym('person-run', `
  <ellipse cx="0" cy="1" rx="34" ry="5" fill="${INK}" opacity="0.14"/>
  <use href="#person-leg" transform="translate(-2 -78) rotate(34)"/><use href="#person-leg" transform="translate(2 -78) rotate(-30)"/>
  <rect x="-20" y="-142" width="40" height="70" rx="18" fill="${c.info}" stroke="${INK}" stroke-width="${S}" transform="rotate(10 0 -76)"/>
  <circle cx="14" cy="-160" r="16" fill="${skin}" stroke="${INK}" stroke-width="${S}"/>
  <path d="M0 -164C0 -180 26 -182 30 -166C22 -170 10 -168 6 -162z" fill="${hair}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  <use href="#person-forearm" transform="translate(4 -126) rotate(-110)"/>`);

// -- the leash between a Person at 0 and a Dog at +200 ----------------------------------------------------------------

const leash = (d) => duo(d, c.brand, 4.5) + `<circle cx="214" cy="-66" r="3.5" fill="${INK}"/>`;
sym('leash-u', leash('M18 -82C60 -4 170 -4 214 -66'));
sym('leash-j', leash('M18 -82C22 -30 120 -32 214 -66'));
sym('leash-taut', leash('M18 -82L214 -66'));
// from a Person in the Poste stance (person-still, hand at the belly) to a Dog at +200
sym('leash-still-u', leash('M16 -100C60 -10 170 -6 214 -66'));
sym('leash-still-taut', leash('M16 -100L214 -66'));

// -- props --------------------------------------------------------------------------------------------------------------

sym('treat', `<circle cx="0" cy="0" r="7" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/>`);
sym('food', `<path d="M-16 0C-16 -10 16 -12 18 -2C18 4 -16 6 -16 0z" fill="${c.coral}" stroke="${INK}" stroke-width="${S}"/><path d="M-6 -6l2 4M4 -7l1 4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`);
sym('mat', `<rect x="-70" y="-10" width="140" height="12" rx="6" fill="${c.accentSoft}" stroke="${INK}" stroke-width="${S}"/><path d="M-50 -10v12M-25 -10v12M0 -10v12M25 -10v12M50 -10v12" stroke="${c.accent}" stroke-width="4"/>`);
sym('harness', `${duo('M-24 -6C-10 14 10 14 24 -6', c.brand, 6)}${duo('M-24 -6L24 -6', c.brand, 6)}<circle cx="0" cy="-10" r="6" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>`);
// a door in its frame, 90 wide and 180 tall, standing on y = 0
sym('door', `<rect x="-52" y="-188" width="104" height="188" fill="${c.edge}" stroke="${INK}" stroke-width="${S}"/><rect x="-42" y="-178" width="84" height="178" rx="4" fill="${tokens.world.w1.deep}" stroke="${INK}" stroke-width="${S}"/><rect x="-30" y="-162" width="60" height="60" rx="4" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="28" cy="-86" r="6" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>`);
sym('doorbell', `<rect x="-9" y="-12" width="18" height="24" rx="5" fill="${c.surface}" stroke="${INK}" stroke-width="${S}"/><circle cx="0" cy="0" r="4.5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>`);
// a building's wall seen from the side, 200 wide and 220 tall, standing on y = 0
sym('wall', `<rect x="-100" y="-220" width="200" height="220" fill="${c.edge}" stroke="${INK}" stroke-width="${S}"/><path d="M-100 -180H100M-100 -140H100M-100 -100H100M-100 -60H100M-100 -20H100M-50 -220v40M50 -220v40M0 -180v40M-50 -140v40M50 -140v40M0 -100v40M-50 -60v40M50 -60v40M0 -20v20" stroke="${c.surfaceSunken}" stroke-width="3"/>`);
sym('car', `
  <ellipse cx="0" cy="1" rx="118" ry="6" fill="${INK}" opacity="0.14"/>
  <path d="M-112 -22C-112 -46 -96 -50 -70 -52L-46 -84C-40 -92 -30 -94 -18 -94H40C54 -94 62 -90 70 -80L90 -54C108 -52 116 -44 116 -24V-14H-112z" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  <path d="M-36 -54L-20 -80H8V-54zM18 -54V-80H44C52 -80 56 -76 60 -70L72 -54z" fill="${c.sky}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>
  <circle cx="-70" cy="-12" r="18" fill="${INK}"/><circle cx="-70" cy="-12" r="7" fill="${c.edge}"/>
  <circle cx="74" cy="-12" r="18" fill="${INK}"/><circle cx="74" cy="-12" r="7" fill="${c.edge}"/>`);
sym('scooter', `
  <circle cx="-34" cy="-10" r="10" fill="${INK}"/><circle cx="34" cy="-10" r="10" fill="${INK}"/>
  <rect x="-38" y="-24" width="62" height="9" rx="4.5" fill="${c.info}" stroke="${INK}" stroke-width="${S}"/>
  <path d="M30 -16L22 -96M12 -96H34" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`);
sym('bike', `
  <circle cx="-44" cy="-28" r="28" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="44" cy="-28" r="28" fill="none" stroke="${INK}" stroke-width="6"/>
  <path d="M-44 -28L-12 -72H32L44 -28M-12 -72L4 -28L32 -72M-18 -82H-4M26 -84L32 -72" fill="none" stroke="${c.coral}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
sym('tree', `<rect x="-10" y="-90" width="20" height="90" rx="6" fill="${m.coatDark}" stroke="${INK}" stroke-width="${S}"/><circle cx="0" cy="-120" r="50" fill="${c.brand}" stroke="${INK}" stroke-width="${S}"/><circle cx="-26" cy="-102" r="26" fill="${c.brandDeep}" stroke="${INK}" stroke-width="${S}"/>`);
sym('bush', `<path d="M-50 0C-60 -30 -30 -46 -10 -36C0 -56 36 -50 40 -30C60 -30 64 -6 50 0z" fill="${c.brandDeep}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`);

// -- signs: right / wrong, attention, motion, sniffing, sound, arrows ---------------------------------------------------

sym('badge-check', `<circle cx="0" cy="0" r="22" fill="${c.brand}" stroke="${INK}" stroke-width="3.5"/><path d="M-10 1l7 7l13 -15" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`);
sym('badge-cross', `<circle cx="0" cy="0" r="22" fill="${c.danger}" stroke="${INK}" stroke-width="3.5"/><path d="M-8 -8l16 16M8 -8l-16 16" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`);
// three short strokes fanning out to the right: "notices", "is fixed on"
sym('attention', `<path d="M0 -14l14 -10M4 0h18M0 14l14 10" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`);
// speed lines trailing to the left
sym('motion', `<path d="M0 -14h-30M-6 0h-40M0 14h-30" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`);
sym('sniff-lines', `<path d="M0 0q4 -10 0 -20M12 2q4 -10 0 -20M24 0q4 -10 0 -20" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);
sym('sound', `<path d="M0 -14q10 14 0 28M12 -24q18 24 0 48" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`);
sym('heart', `<path d="M0 10C-18 -2 -16 -16 -7 -16C-3 -16 0 -12 0 -10C0 -12 3 -16 7 -16C16 -16 18 -2 0 10z" fill="${c.coral}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
sym('star', `<circle cx="0" cy="0" r="18" fill="${c.accent}" stroke="${INK}" stroke-width="3"/><path d="M0 -10l3 7 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1z" fill="${c.surface}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`);
sym('arrow', `${duo('M0 0H52', c.surface, 6)}<path d="M50 -14L72 0L50 14z" fill="${c.surface}" stroke="${INK}" stroke-width="${S}" stroke-linejoin="round"/>`);
sym('arrow-ink', `<path d="M0 0H54" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M50 -13L72 0L50 13z" fill="${INK}"/>`);
sym('pause', `<circle cx="0" cy="0" r="22" fill="${c.surface}" stroke="${INK}" stroke-width="3.5"/><rect x="-9" y="-10" width="6" height="20" rx="2" fill="${INK}"/><rect x="3" y="-10" width="6" height="20" rx="2" fill="${INK}"/>`);
// a clock face: "time passes", "wait"
sym('clock', `<circle cx="0" cy="0" r="22" fill="${c.surface}" stroke="${INK}" stroke-width="3.5"/><path d="M0 -12V0L9 6" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`);
// numbered pips 1-4 for sequences, without digits
for (let n = 1; n <= 4; n++) {
  const dots = Array.from({ length: n }, (_, i) => `<circle cx="${(i - (n - 1) / 2) * 9}" cy="0" r="3.2" fill="${INK}"/>`).join('');
  sym(`step-${n}`, `<circle cx="0" cy="0" r="20" fill="${c.accent}" stroke="${INK}" stroke-width="3"/>${dots}`);
}

// -- ground and sky -----------------------------------------------------------------------------------------------------

sym('backdrop', `<rect x="0" y="0" width="640" height="360" fill="${c.sky}"/><circle cx="560" cy="64" r="26" fill="${c.accent}" stroke="${INK}" stroke-width="3.5"/>`);
// the sky alone, for diagrams whose corners carry badges or arrows
sym('sky', `<rect x="0" y="0" width="640" height="360" fill="${c.sky}"/>`);
sym('backdrop-indoor', `<rect x="0" y="0" width="640" height="360" fill="${c.accentSoft}"/><rect x="0" y="292" width="640" height="68" fill="${c.edge}" stroke="${INK}" stroke-width="3"/>`);
sym('ground-grass', `<path d="M0 286C120 272 220 292 340 282S540 274 640 284V360H0z" fill="${c.brand}" stroke="${INK}" stroke-width="3.5"/><path d="M0 322C140 312 260 330 400 318S580 314 640 320V360H0z" fill="${c.brandDeep}" stroke="${INK}" stroke-width="3.5"/>`);
sym('ground-street', `<rect x="-4" y="288" width="648" height="40" fill="${c.surfaceSunken}" stroke="${INK}" stroke-width="3.5"/><path d="M80 288v40M200 288v40M320 288v40M440 288v40M560 288v40" stroke="${c.edge}" stroke-width="3"/><rect x="-4" y="328" width="648" height="36" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="3.5"/>`);

// -- top-down pieces, for diagrams of positions ---------------------------------------------------------------------------

sym('top-ground', `<rect x="0" y="0" width="640" height="360" fill="${c.surfaceSunken}"/>`);
sym('top-dog', `<ellipse cx="-4" cy="0" rx="24" ry="13" fill="${m.coat}" stroke="${INK}" stroke-width="${S}"/><circle cx="24" cy="0" r="11" fill="${m.coat}" stroke="${INK}" stroke-width="${S}"/><ellipse cx="35" cy="0" rx="7" ry="5.5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2"/><path d="M-26 0h-12" stroke="${m.coatDark}" stroke-width="5" stroke-linecap="round"/><circle cx="4" cy="-1" r="3.5" fill="${c.accent}" stroke="${INK}" stroke-width="1.5"/>`);
sym('top-dog2', `<ellipse cx="-4" cy="0" rx="24" ry="13" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="${S}"/><circle cx="24" cy="0" r="11" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="${S}"/><ellipse cx="35" cy="0" rx="7" ry="5.5" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2"/><path d="M-26 0h-12" stroke="${tokens.coat.negro}" stroke-width="5" stroke-linecap="round"/>`);
sym('top-person', `<ellipse cx="0" cy="0" rx="13" ry="22" fill="${jacket}" stroke="${INK}" stroke-width="${S}"/><circle cx="2" cy="0" r="11" fill="${hair}" stroke="${INK}" stroke-width="${S}"/>`);
sym('top-runner', `<ellipse cx="0" cy="0" rx="13" ry="22" fill="${c.info}" stroke="${INK}" stroke-width="${S}"/><circle cx="2" cy="0" r="11" fill="${hair}" stroke="${INK}" stroke-width="${S}"/>`);
sym('top-car', `<rect x="-60" y="-28" width="120" height="56" rx="16" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="${S}"/><rect x="-26" y="-22" width="52" height="44" rx="8" fill="${c.sky}" stroke="${INK}" stroke-width="${S}"/>`);
sym('top-scooter', `<rect x="-26" y="-6" width="52" height="12" rx="6" fill="${c.info}" stroke="${INK}" stroke-width="${S}"/><path d="M22 -16v32" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="-2" cy="0" r="10" fill="${hair}" stroke="${INK}" stroke-width="${S}"/>`);
sym('top-bike', `<path d="M-34 0H34" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M22 -16v32" stroke="${c.coral}" stroke-width="5" stroke-linecap="round"/><circle cx="-2" cy="0" r="10" fill="${hair}" stroke="${INK}" stroke-width="${S}"/>`);
sym('top-tree', `<circle cx="0" cy="0" r="30" fill="${c.brand}" stroke="${INK}" stroke-width="${S}"/><circle cx="-8" cy="-6" r="14" fill="${c.brandDeep}"/>`);
// a line of sight: dashed ink with an eye-end dot
sym('sight', `<path d="M0 0H120" fill="none" stroke="${INK}" stroke-width="3.5" stroke-dasharray="10 8" stroke-linecap="round"/>`);
// the 3 m reach of the long leash around a Person: a 120-radius ring
sym('reach', `<circle cx="0" cy="0" r="120" fill="${c.surface}" fill-opacity="0.7" stroke="${INK}" stroke-width="3" stroke-dasharray="12 9"/>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">\n<!-- generated by kit.mjs; do not edit -->\n<defs>\n${symbols.join('\n')}\n</defs>\n</svg>\n`;
writeFileSync(join(here, 'kit.svg'), svg);
console.log(`wrote kit.svg: ${symbols.length} symbols`);
