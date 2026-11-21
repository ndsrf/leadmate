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
  // walking, head raised and turned up at a Person ahead of it: the Check-in seen from the front
  sym(`${p}-glance`, `${shadow}${walkBody(`<use href="#${p}-head-calm" transform="translate(46 -74) rotate(-26)"/>`, 'tail-down')}`);
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

// walking on autopilot: the leash hand as in person-walk (18, -82), the other hand holding a phone up to the face
sym('person-phone', `
  <ellipse cx="0" cy="1" rx="34" ry="5" fill="${INK}" opacity="0.14"/>
  <use href="#person-leg" transform="translate(-2 -80) rotate(16)"/><use href="#person-leg" transform="translate(2 -80) rotate(-16)"/>
  <use href="#person-top" transform="translate(0 -76)"/>
  <use href="#person-arm" transform="translate(4 -130) rotate(-14)"/>
  <use href="#person-forearm" transform="translate(-2 -126) rotate(-137)"/>
  <rect x="18" y="-166" width="11" height="19" rx="3" fill="${INK}"/><rect x="20.5" y="-163" width="6" height="12" rx="1.5" fill="${c.sky}"/>`);
// stepping into a turn: the leash hand trails behind at (-22, -84); mirror it to walk back the way it came
sym('person-turn', `
  <ellipse cx="0" cy="1" rx="34" ry="5" fill="${INK}" opacity="0.14"/>
  <use href="#person-leg" transform="translate(-2 -80) rotate(10)"/><use href="#person-leg" transform="translate(2 -80) rotate(-20)"/>
  <use href="#person-top" transform="translate(0 -76)"/>
  <use href="#person-arm" transform="translate(-2 -130) rotate(24)"/>`);

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
sym('door', `<rect x="-52" y="-188" width="104" height="188" fill="${c.edge}" stroke="${INK}" stroke-width="${S}"/><rect x="-42" y="-178" width="84" height="178" rx="4" fill="${tokens.world.home.deep}" stroke="${INK}" stroke-width="${S}"/><rect x="-30" y="-162" width="60" height="60" rx="4" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="28" cy="-86" r="6" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>`);
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

// park props (World 6): a bench 150 wide, a pigeon facing right, a grass tuft, a lamp post; all stand on y = 0
sym('bench', `
  <ellipse cx="0" cy="1" rx="80" ry="5" fill="${INK}" opacity="0.14"/>
  <rect x="-62" y="-40" width="9" height="40" rx="3" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2"/><rect x="53" y="-40" width="9" height="40" rx="3" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2"/>
  <rect x="-75" y="-90" width="150" height="16" rx="6" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="${S}"/>
  <rect x="-75" y="-68" width="150" height="16" rx="6" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="${S}"/>
  <rect x="-80" y="-48" width="160" height="14" rx="6" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="${S}"/>
  <rect x="-62" y="-90" width="9" height="44" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2"/><rect x="53" y="-90" width="9" height="44" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2"/>`);
sym('pigeon', `
  <ellipse cx="0" cy="1" rx="16" ry="2.5" fill="${INK}" opacity="0.14"/>
  <path d="M-4 -6v6M4 -6v6" stroke="${c.coral}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M-22 -18L-12 -14L-12 -8z" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-13" rx="14" ry="9" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="2"/>
  <path d="M-8 -16C-2 -20 6 -18 8 -12C2 -10 -4 -11 -8 -16z" fill="${tokens.coat.negro}"/>
  <circle cx="12" cy="-24" r="6.5" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="2"/>
  <path d="M18 -25l5 2l-5 1.5z" fill="${c.accent}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
  <circle cx="13.5" cy="-25.5" r="1.4" fill="${INK}"/>`);
// the same pigeon pecking at the ground
sym('pigeon-peck', `
  <ellipse cx="0" cy="1" rx="16" ry="2.5" fill="${INK}" opacity="0.14"/>
  <path d="M-4 -6v6M4 -6v6" stroke="${c.coral}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M-20 -24L-10 -16L-12 -12z" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-12" rx="14" ry="8.5" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="2" transform="rotate(16 0 -12)"/>
  <circle cx="15" cy="-6" r="6.5" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="2"/>
  <path d="M19 -2l3 5l-5 -1z" fill="${c.accent}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
  <circle cx="17" cy="-8" r="1.4" fill="${INK}"/>`);
sym('tuft', `<path d="M-14 0Q-12 -12 -8 -16Q-6 -8 -4 0Q-2 -14 2 -20Q4 -8 4 0Q8 -10 14 -14Q10 -6 12 0z" fill="${c.brandDeep}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`);
sym('lamp', `<rect x="-5" y="-200" width="10" height="200" rx="4" fill="${c.inkMuted}" stroke="${INK}" stroke-width="${S}"/><rect x="-16" y="-226" width="32" height="30" rx="8" fill="${c.accentSoft}" stroke="${INK}" stroke-width="${S}"/><rect x="-12" y="-4" width="24" height="6" rx="3" fill="${INK}"/>`);
// a U-turn: an ink route that goes right and comes back left, arrowhead at the end (-6, -48)
sym('arrow-turn', `<path d="M0 0H34A24 24 0 0 0 34 -48H10" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M12 -61L-10 -48L12 -35z" fill="${INK}"/>`);

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

// a park: grass behind, a gravel path the cast walks on (stand them at y = 322), grass in front
sym('ground-park', `<path d="M0 270C120 258 240 276 360 266S560 258 640 268V360H0z" fill="${c.brand}" stroke="${INK}" stroke-width="3.5"/><path d="M-4 298C160 292 480 292 644 298V344C480 338 160 338 -4 344z" fill="${c.surfaceSunken}" stroke="${INK}" stroke-width="3.5"/><path d="M60 312h10M190 328h8M300 310h12M420 330h9M540 314h10M600 330h7" stroke="${c.edge}" stroke-width="4" stroke-linecap="round"/><path d="M0 344C160 338 480 338 640 344V360H0z" fill="${c.brandDeep}" stroke="${INK}" stroke-width="3.5"/>`);

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
// park grass seen from above, and the Dog seen from above with its head turned back over its left shoulder (100 degrees)
sym('top-grass', `<rect x="0" y="0" width="640" height="360" fill="${tokens.world.park.ground}"/>`);
sym('top-dog-look', `<ellipse cx="-4" cy="0" rx="24" ry="13" fill="${m.coat}" stroke="${INK}" stroke-width="${S}"/><path d="M-26 0h-12" stroke="${m.coatDark}" stroke-width="5" stroke-linecap="round"/><circle cx="4" cy="-1" r="3.5" fill="${c.accent}" stroke="${INK}" stroke-width="1.5"/><g transform="rotate(-100 14 0)"><circle cx="24" cy="0" r="11" fill="${m.coat}" stroke="${INK}" stroke-width="${S}"/><ellipse cx="35" cy="0" rx="7" ry="5.5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2"/></g>`);
// a line of sight: dashed ink with an eye-end dot
sym('sight', `<path d="M0 0H120" fill="none" stroke="${INK}" stroke-width="3.5" stroke-dasharray="10 8" stroke-linecap="round"/>`);
// the 3 m reach of the long leash around a Person: a 120-radius ring
sym('reach', `<circle cx="0" cy="0" r="120" fill="${c.surface}" fill-opacity="0.7" stroke="${INK}" stroke-width="3" stroke-dasharray="12 9"/>`);

// -- World 7 terrace kit (canvas board "Mundo 7 — Kit de terraza"): furniture, the seated Person, the waiter, Dog poses and top-down pieces --
// side-view pieces stand on y = 0 facing +x; top-* pieces are seen from above, centred on their origin

// Mesa de bistró
sym('cafe-table', `
  <ellipse cx="0" cy="1" rx="40" ry="5" fill="${INK}" opacity="0.14"/>
  <path d="M-28 0Q0 -16 28 0z" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <rect x="-5" y="-98" width="10" height="94" rx="3" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="-58" y="-108" width="116" height="12" rx="6" fill="${c.surface}" stroke="${INK}" stroke-width="2.5"/>`);
// Silla de terraza
sym('cafe-chair', `
  <ellipse cx="0" cy="1" rx="30" ry="4" fill="${INK}" opacity="0.14"/>
  <path d="M-20 0L-16 -60M20 0L16 -60M-28 -60L-30 -124" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
  <path d="M-20 0L-16 -60M20 0L16 -60M-28 -60L-30 -124" fill="none" stroke="${c.inkMuted}" stroke-width="4" stroke-linecap="round"/>
  <rect x="-38" y="-126" width="14" height="44" rx="6" fill="${c.brand}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="-30" y="-66" width="56" height="10" rx="5" fill="${c.brand}" stroke="${INK}" stroke-width="2.5"/>`);
// Sombrilla
sym('cafe-parasol', `
  <ellipse cx="0" cy="1" rx="26" ry="4" fill="${INK}" opacity="0.14"/>
  <rect x="-18" y="-8" width="36" height="9" rx="4" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="-3.5" y="-246" width="7" height="240" rx="3" fill="${c.surface}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-112 -214Q0 -296 112 -214z" fill="${c.coral}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M-56 -238L-34 -214H-78zM56 -238L78 -214H34zM0 -254L22 -214H-22z" fill="${c.surface}"/>
  <path d="M-112 -214Q-98 -200 -84 -214Q-70 -200 -56 -214Q-42 -200 -28 -214Q-14 -200 0 -214Q14 -200 28 -214Q42 -200 56 -214Q70 -200 84 -214Q98 -200 112 -214" fill="${c.coral}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
// Jardinera (barrera)
sym('cafe-planter', `
  <ellipse cx="0" cy="1" rx="46" ry="4" fill="${INK}" opacity="0.14"/>
  <path d="M-36 -30C-44 -64 -10 -70 0 -52C12 -74 46 -62 36 -30z" fill="${c.brand}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M-14 -40C-14 -54 6 -56 8 -44" fill="none" stroke="${c.brandDeep}" stroke-width="5" stroke-linecap="round"/>
  <rect x="-42" y="-34" width="84" height="34" rx="5" fill="${tokens.world.home.deep}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-42 -24H42" stroke="${tokens.coat.canela}" stroke-width="4"/>`);
// Taza con plato
sym('cafe-cup', `
  <ellipse cx="0" cy="-1" rx="13" ry="3.5" fill="${c.surface}" stroke="${INK}" stroke-width="2"/>
  <path d="M8 -12q8 0 7 5q-1 4 -8 3" fill="none" stroke="${INK}" stroke-width="2.2"/>
  <path d="M-8 -15H8V-9Q8 -3 0 -3Q-8 -3 -8 -9z" fill="${c.surface}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-15" rx="8" ry="2" fill="${tokens.coat.chocolate}" stroke="${INK}" stroke-width="1.5"/>`);
// Plato con comida
sym('cafe-plate', `
  <ellipse cx="0" cy="-2" rx="20" ry="4" fill="${c.surface}" stroke="${INK}" stroke-width="2"/>
  <path d="M-12 -4C-12 -14 12 -14 12 -4z" fill="${c.accent}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`);
// Guía sentada, mano en la mesa
sym('person-seated', `
  <rect x="30" y="-64" width="14" height="64" rx="7" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="42" cy="0" rx="11" ry="5" fill="${INK}"/>
  <rect x="-10" y="-76" width="56" height="16" rx="8" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(-4 -68) translate(0 0)"><rect x="-22" y="-66" width="44" height="70" rx="18" fill="${c.coral}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="2" cy="-84" r="17" fill="${tokens.coat.crema}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-15 -86C-16 -104 12 -108 18 -92C10 -96 -2 -94 -6 -86z" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="10" cy="-84" r="2.4" fill="${INK}"/></g>
  <g transform="translate(0 -124) rotate(-78) translate(0 0)"><rect x="-6.5" y="-4" width="13" height="52" rx="6.5" fill="${c.coral}" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="50" r="7" fill="${tokens.coat.crema}" stroke="${INK}" stroke-width="2.5"/></g>`);
// Deja caer un premio
sym('person-seated-drop', `
  <rect x="30" y="-64" width="14" height="64" rx="7" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="42" cy="0" rx="11" ry="5" fill="${INK}"/>
  <rect x="-10" y="-76" width="56" height="16" rx="8" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="rotate(14 0 -70)"><g transform="translate(-4 -68) translate(0 0)"><rect x="-22" y="-66" width="44" height="70" rx="18" fill="${c.coral}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="2" cy="-84" r="17" fill="${tokens.coat.crema}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-15 -86C-16 -104 12 -108 18 -92C10 -96 -2 -94 -6 -86z" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="10" cy="-84" r="2.4" fill="${INK}"/></g></g>
  <g transform="translate(18 -118) rotate(-40) translate(0 0)"><rect x="-6.5" y="-4" width="13" height="52" rx="6.5" fill="${c.coral}" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="50" r="7" fill="${tokens.coat.crema}" stroke="${INK}" stroke-width="2.5"/></g>`);
// Da comida desde la mesa (error)
sym('person-seated-feed', `
  <rect x="30" y="-64" width="14" height="64" rx="7" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="42" cy="0" rx="11" ry="5" fill="${INK}"/>
  <rect x="-10" y="-76" width="56" height="16" rx="8" fill="${c.inkMuted}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(-4 -68) translate(0 0)"><rect x="-22" y="-66" width="44" height="70" rx="18" fill="${c.coral}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="2" cy="-84" r="17" fill="${tokens.coat.crema}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-15 -86C-16 -104 12 -108 18 -92C10 -96 -2 -94 -6 -86z" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="10" cy="-84" r="2.4" fill="${INK}"/></g>
  <g transform="translate(0 -124) rotate(-96) translate(0 0)"><rect x="-6.5" y="-4" width="13" height="52" rx="6.5" fill="${c.coral}" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="50" r="7" fill="${tokens.coat.crema}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(56 -126) scale(0.6) translate(0 0)"><path d="M-16 0C-16 -10 16 -12 18 -2C18 4 -16 6 -16 0z" fill="${c.coral}" stroke="${INK}" stroke-width="2.5"/><path d="M-6 -6l2 4M4 -7l1 4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`);
// Camarero con bandeja
sym('waiter', `
  <ellipse cx="0" cy="1" rx="34" ry="5" fill="${INK}" opacity="0.14"/>
  <g transform="translate(-2 -80) rotate(16)"><rect x="-7" y="0" width="14" height="80" rx="7" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5"/><ellipse cx="4" cy="80" rx="11" ry="5" fill="${INK}"/></g>
  <g transform="translate(2 -80) rotate(-16)"><rect x="-7" y="0" width="14" height="80" rx="7" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5"/><ellipse cx="4" cy="80" rx="11" ry="5" fill="${INK}"/></g>
  <g transform="translate(-4 -126) rotate(22)"><rect x="-6.5" y="-4" width="13" height="50" rx="6.5" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="48" r="7" fill="${tokens.coat.crema}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(0 -76)">
  <rect x="-22" y="-66" width="44" height="70" rx="18" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-20 -30H20V-8Q20 4 0 4Q-20 4 -20 -8z" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M-4 -64L2 -56L8 -64" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="2" cy="-84" r="17" fill="${tokens.coat.atigrado}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-15 -88C-14 -106 14 -108 18 -92C8 -98 -4 -96 -8 -86z" fill="${INK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="10" cy="-84" r="2.4" fill="${INK}"/>
  </g>
  <g transform="translate(6 -130) rotate(-160)"><rect x="-6.5" y="-4" width="13" height="50" rx="6.5" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="48" r="7" fill="${tokens.coat.atigrado}" stroke="${INK}" stroke-width="2.5"/></g>
  <ellipse cx="26" cy="-182" rx="32" ry="5" fill="${c.edge}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(12 -186) scale(0.9) translate(0 0)"><ellipse cx="0" cy="-1" rx="13" ry="3.5" fill="${c.surface}" stroke="${INK}" stroke-width="2"/>
  <path d="M8 -12q8 0 7 5q-1 4 -8 3" fill="none" stroke="${INK}" stroke-width="2.2"/>
  <path d="M-8 -15H8V-9Q8 -3 0 -3Q-8 -3 -8 -9z" fill="${c.surface}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-15" rx="8" ry="2" fill="${tokens.coat.chocolate}" stroke="${INK}" stroke-width="1.5"/></g>
  <g transform="translate(40 -186) scale(0.9) translate(0 0)"><ellipse cx="0" cy="-1" rx="13" ry="3.5" fill="${c.surface}" stroke="${INK}" stroke-width="2"/>
  <path d="M8 -12q8 0 7 5q-1 4 -8 3" fill="none" stroke="${INK}" stroke-width="2.2"/>
  <path d="M-8 -15H8V-9Q8 -3 0 -3Q-8 -3 -8 -9z" fill="${c.surface}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-15" rx="8" ry="2" fill="${tokens.coat.chocolate}" stroke="${INK}" stroke-width="1.5"/></g>`);
// Camarero tropieza (error)
sym('waiter-trip', `
  <ellipse cx="0" cy="1" rx="34" ry="5" fill="${INK}" opacity="0.14"/>
  <g transform="rotate(14 0 0)">
  <g transform="translate(-2 -80) rotate(30)"><rect x="-7" y="0" width="14" height="80" rx="7" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5"/><ellipse cx="4" cy="80" rx="11" ry="5" fill="${INK}"/></g>
  <g transform="translate(2 -80) rotate(-6)"><rect x="-7" y="0" width="14" height="80" rx="7" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5"/><ellipse cx="4" cy="80" rx="11" ry="5" fill="${INK}"/></g>
  <g transform="translate(0 -76)">
  <rect x="-22" y="-66" width="44" height="70" rx="18" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-20 -30H20V-8Q20 4 0 4Q-20 4 -20 -8z" fill="${tokens.coat.negro}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="2" cy="-84" r="17" fill="${tokens.coat.atigrado}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-15 -88C-14 -106 14 -108 18 -92C8 -98 -4 -96 -8 -86z" fill="${INK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="10" cy="-86" r="3.4" fill="${INK}"/>
  <ellipse cx="14" cy="-74" rx="3" ry="4" fill="${INK}"/>
  </g>
  <g transform="translate(6 -130) rotate(-120)"><rect x="-6.5" y="-4" width="13" height="50" rx="6.5" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="48" r="7" fill="${tokens.coat.atigrado}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(-4 -126) rotate(-150)"><rect x="-6.5" y="-4" width="13" height="50" rx="6.5" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="48" r="7" fill="${tokens.coat.atigrado}" stroke="${INK}" stroke-width="2.5"/></g>
  </g>
  <g transform="translate(70 -170) rotate(-24)"><ellipse cx="0" cy="0" rx="32" ry="5" fill="${c.edge}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(84 -214) rotate(40) scale(0.9) translate(0 0)"><ellipse cx="0" cy="-1" rx="13" ry="3.5" fill="${c.surface}" stroke="${INK}" stroke-width="2"/>
  <path d="M8 -12q8 0 7 5q-1 4 -8 3" fill="none" stroke="${INK}" stroke-width="2.2"/>
  <path d="M-8 -15H8V-9Q8 -3 0 -3Q-8 -3 -8 -9z" fill="${c.surface}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-15" rx="8" ry="2" fill="${tokens.coat.chocolate}" stroke="${INK}" stroke-width="1.5"/></g>
  <g transform="translate(112 -192) rotate(80) scale(0.9) translate(0 0)"><ellipse cx="0" cy="-1" rx="13" ry="3.5" fill="${c.surface}" stroke="${INK}" stroke-width="2"/>
  <path d="M8 -12q8 0 7 5q-1 4 -8 3" fill="none" stroke="${INK}" stroke-width="2.2"/>
  <path d="M-8 -15H8V-9Q8 -3 0 -3Q-8 -3 -8 -9z" fill="${c.surface}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <ellipse cx="0" cy="-15" rx="8" ry="2" fill="${tokens.coat.chocolate}" stroke="${INK}" stroke-width="1.5"/></g>`);
// Mordedor
sym('chew', `
  <rect x="-16" y="-6" width="32" height="10" rx="5" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="2"/>
  <circle cx="-16" cy="-6" r="5" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="2"/><circle cx="-16" cy="4" r="5" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="2"/>
  <circle cx="16" cy="-6" r="5" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="2"/><circle cx="16" cy="4" r="5" fill="${tokens.coat.canela}" stroke="${INK}" stroke-width="2"/>`);
// Sentado, en alerta
sym('dog-sit-alert', `
  <ellipse cx="2" cy="1" rx="50" ry="5" fill="${INK}" opacity="0.14"/>
  <g transform="translate(-30 -10) rotate(70) translate(0 0)"><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${m.coatDark}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <ellipse cx="-16" cy="-16" rx="22" ry="16" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(16 -46) scale(1 1.62) translate(0 0)"><rect x="-6" y="0" width="12" height="28" rx="6" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(-2 -46) rotate(-42) translate(0 0)"><rect x="-40" y="-20" width="80" height="40" rx="20" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="-4" cy="12" rx="24" ry="4.5" fill="${m.coatLight}"/>
  <path d="M14 -20V19" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 -20V19" fill="none" stroke="${c.brand}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="-22" r="5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/></g>
  <g transform="translate(28 -46) scale(1 1.62) translate(0 0)"><rect x="-6" y="0" width="12" height="28" rx="6" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(30 -92) translate(0 0)"><path d="M-8 -12L-2 -36L8 -13z" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="0" cy="0" r="17" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
  <circle cx="5" cy="-4" r="3.4" fill="${INK}"/>
  <path d="M16 13h9" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`);
// Tumbado, cabeza arriba
sym('dog-down-alert', `
  <ellipse cx="2" cy="1" rx="50" ry="5" fill="${INK}" opacity="0.14"/>
  <g transform="translate(-36 -14) rotate(60) translate(0 0)"><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${m.coatDark}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <rect x="20" y="-11" width="40" height="11" rx="5.5" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(0 -21) translate(0 0)"><rect x="-40" y="-20" width="80" height="40" rx="20" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="-4" cy="12" rx="24" ry="4.5" fill="${m.coatLight}"/>
  <path d="M14 -20V19" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 -20V19" fill="none" stroke="${c.brand}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="-22" r="5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/></g>
  <rect x="28" y="-11" width="40" height="11" rx="5.5" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(46 -48) translate(0 0)"><path d="M-8 -12L-2 -36L8 -13z" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="0" cy="0" r="17" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
  <circle cx="5" cy="-4" r="3.4" fill="${INK}"/>
  <path d="M16 13h9" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`);
// Tumbado, te mira (check-in)
sym('dog-down-back', `
  <ellipse cx="2" cy="1" rx="50" ry="5" fill="${INK}" opacity="0.14"/>
  <g transform="translate(-36 -14) rotate(60) translate(0 0)"><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${m.coatDark}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <rect x="20" y="-11" width="40" height="11" rx="5.5" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(0 -21) translate(0 0)"><rect x="-40" y="-20" width="80" height="40" rx="20" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="-4" cy="12" rx="24" ry="4.5" fill="${m.coatLight}"/>
  <path d="M14 -20V19" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 -20V19" fill="none" stroke="${c.brand}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="-22" r="5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/></g>
  <rect x="28" y="-11" width="40" height="11" rx="5.5" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(30 -48) scale(-1 1) translate(0 0)"><circle cx="0" cy="0" r="17" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
  <path d="M2 -4q3 -3 6 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M15 13q6 6 12 0" fill="${c.coral}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M-10 -12C-22 -12 -24 8 -16 14C-6 10 -4 -4 -6 -10z" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></g>`);
// Tumbado, cabeza apoyada
sym('dog-rest', `
  <ellipse cx="2" cy="1" rx="50" ry="5" fill="${INK}" opacity="0.14"/>
  <g transform="translate(-36 -10) rotate(80) translate(0 0)"><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0C-12 4 -18 14 -18 24" fill="none" stroke="${m.coatDark}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <rect x="20" y="-11" width="40" height="11" rx="5.5" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(0 -20) rotate(4) translate(0 0)"><rect x="-40" y="-20" width="80" height="40" rx="20" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="-4" cy="12" rx="24" ry="4.5" fill="${m.coatLight}"/>
  <path d="M14 -20V19" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 -20V19" fill="none" stroke="${c.brand}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="-22" r="5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/></g>
  <rect x="28" y="-11" width="44" height="11" rx="5.5" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <g transform="translate(56 -26) rotate(16) translate(0 0)"><circle cx="0" cy="0" r="17" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
  <path d="M2 -4q3 -3 6 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M15 13q6 6 12 0" fill="${c.coral}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M-10 -12C-22 -12 -24 8 -16 14C-6 10 -4 -4 -6 -10z" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></g>`);
// Pide con las patas (error)
sym('dog-beg', `
  <ellipse cx="2" cy="1" rx="50" ry="5" fill="${INK}" opacity="0.14"/>
  <g transform="rotate(-38 -26 0)">
  <g transform="translate(-26 -28) rotate(6) translate(0 0)"><rect x="-6" y="0" width="12" height="28" rx="6" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5"/></g><g transform="translate(22 -28) rotate(-60) translate(0 0)"><rect x="-6" y="0" width="12" height="28" rx="6" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(-18 -28) rotate(-6) translate(0 0)"><rect x="-6" y="0" width="12" height="28" rx="6" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/></g><g transform="translate(30 -28) rotate(-70) translate(0 0)"><rect x="-6" y="0" width="12" height="28" rx="6" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/></g>
  <g transform="translate(-36 -56) translate(0 0)"><path d="M0 0C-6 -10 -8 -22 -4 -32" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0C-6 -10 -8 -22 -4 -32" fill="none" stroke="${m.coatDark}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g transform="translate(0 -44) translate(0 0)"><rect x="-40" y="-20" width="80" height="40" rx="20" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="-4" cy="12" rx="24" ry="4.5" fill="${m.coatLight}"/>
  <path d="M14 -20V19" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 -20V19" fill="none" stroke="${c.brand}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="14" cy="-22" r="5" fill="${c.accent}" stroke="${INK}" stroke-width="2"/></g>
  <g transform="translate(46 -70) rotate(20) translate(0 0)"><path d="M-8 -12L-2 -36L8 -13z" fill="${m.coatDark}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="0" cy="0" r="17" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="8" y="-2" width="26" height="17" rx="8.5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="31" cy="3" rx="4" ry="3.5" fill="${INK}"/>
  <circle cx="5" cy="-4" r="3.4" fill="${INK}"/>
  <path d="M16 13h9" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>
  </g>`);
// Premio cayendo
sym('treat-drop', `
  <path d="M0 -34v8M0 -20v6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="0" cy="0" r="6" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/>`);
// Mesa
sym('top-cafe-table', `
  <circle cx="0" cy="0" r="30" fill="${c.surface}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="-8" cy="-6" r="7" fill="${c.surface}" stroke="${INK}" stroke-width="2"/><circle cx="-8" cy="-6" r="3.5" fill="${tokens.coat.chocolate}"/>
  <circle cx="10" cy="8" r="7" fill="${c.surface}" stroke="${INK}" stroke-width="2"/><circle cx="10" cy="8" r="3.5" fill="${tokens.coat.chocolate}"/>`);
// Silla
sym('top-cafe-chair', `
  <rect x="-15" y="-15" width="30" height="30" rx="6" fill="${c.brand}" stroke="${INK}" stroke-width="2.5"/>
  <rect x="-21" y="-15" width="8" height="30" rx="3" fill="${c.brandDeep}" stroke="${INK}" stroke-width="2"/>`);
// Camarero
sym('top-waiter', `
  <ellipse cx="0" cy="0" rx="13" ry="22" fill="${tokens.coat.blanco}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="2" cy="0" r="11" fill="${INK}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="12" cy="-24" r="14" fill="${c.edge}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="8" cy="-26" r="4" fill="${c.surface}" stroke="${INK}" stroke-width="1.5"/><circle cx="17" cy="-20" r="4" fill="${c.surface}" stroke="${INK}" stroke-width="1.5"/>`);
// Manta
sym('top-mat', `
  <rect x="-38" y="-22" width="76" height="44" rx="8" fill="${c.accentSoft}" stroke="${INK}" stroke-width="2.5"/>
  <path d="M-20 -22v44M0 -22v44M20 -22v44" stroke="${c.accent}" stroke-width="4"/>`);
// Perro tumbado
sym('top-dog-down', `
  <path d="M-20 -4C-30 10 -12 20 6 16" fill="none" stroke="${m.coatDark}" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="-2" cy="0" rx="22" ry="14" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="20" cy="-4" r="11" fill="${m.coat}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="30" cy="-4" rx="6" ry="5" fill="${m.coatLight}" stroke="${INK}" stroke-width="2"/>
  <circle cx="6" cy="-2" r="3.5" fill="${c.accent}" stroke="${INK}" stroke-width="1.5"/>`);
// Jardinera
sym('top-planter', `
  <rect x="-40" y="-14" width="80" height="28" rx="5" fill="${tokens.world.home.deep}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="-22" cy="0" r="11" fill="${c.brand}" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="-1" r="12" fill="${c.brandDeep}" stroke="${INK}" stroke-width="2"/><circle cx="22" cy="0" r="11" fill="${c.brand}" stroke="${INK}" stroke-width="2"/>`);
// Fachada con toldo
sym('cafe-front', `
  <rect x="0" y="0" width="640" height="288" fill="${tokens.world.home.sky}"/>
  <rect x="-4" y="22" width="648" height="20" fill="${tokens.world.home.deep}" stroke="${INK}" stroke-width="3"/>
  <rect x="40" y="92" width="220" height="150" rx="6" fill="${c.sky}" stroke="${INK}" stroke-width="3.5"/>
  <path d="M150 92V242M40 150H260" stroke="${INK}" stroke-width="3"/>
  <path d="M60 110l30 26M180 110l30 26" stroke="${c.surface}" stroke-width="5" stroke-linecap="round"/>
  <rect x="300" y="100" width="90" height="188" rx="6" fill="${tokens.coat.chocolate}" stroke="${INK}" stroke-width="3.5"/>
  <rect x="314" y="116" width="62" height="70" rx="4" fill="${c.sky}" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="376" cy="210" r="4" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>
  <rect x="440" y="92" width="200" height="150" rx="6" fill="${c.sky}" stroke="${INK}" stroke-width="3.5"/>
  <path d="M540 92V242M440 150H640" stroke="${INK}" stroke-width="3"/>
  <path d="M462 110l30 26M570 110l30 26" stroke="${c.surface}" stroke-width="5" stroke-linecap="round"/>
  <path d="M-4 42H644V70H-4z" fill="${c.surface}" stroke="${INK}" stroke-width="3"/>
  <path d="M0 42h40v28h-40zM80 42h40v28h-40zM160 42h40v28h-40zM240 42h40v28h-40zM320 42h40v28h-40zM400 42h40v28h-40zM480 42h40v28h-40zM560 42h40v28h-40z" fill="${c.coral}"/>
  <path d="M-4 70Q16 86 36 70Q56 86 76 70Q96 86 116 70Q136 86 156 70Q176 86 196 70Q216 86 236 70Q256 86 276 70Q296 86 316 70Q336 86 356 70Q376 86 396 70Q416 86 436 70Q456 86 476 70Q496 86 516 70Q536 86 556 70Q576 86 596 70Q616 86 636 70Q646 78 644 70" fill="${c.coral}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
// Suelo de terraza
sym('ground-terrace', `
  <rect x="-4" y="288" width="648" height="52" fill="${c.surfaceSunken}" stroke="${INK}" stroke-width="3.5"/>
  <path d="M64 288v52M160 288v52M256 288v52M352 288v52M448 288v52M544 288v52M-4 314H644" stroke="${c.edge}" stroke-width="3"/>
  <rect x="-4" y="340" width="648" height="24" fill="${tokens.coat.grisAzulado}" stroke="${INK}" stroke-width="3.5"/>`);
// Pared cenital
sym('top-wall', `
  <rect x="-4" y="-4" width="648" height="62" fill="${c.edge}" stroke="${INK}" stroke-width="3"/>
  <path d="M-4 40H644" stroke="${tokens.world.home.deep}" stroke-width="8"/>
  <rect x="300" y="40" width="80" height="22" fill="${tokens.coat.chocolate}" stroke="${INK}" stroke-width="2.5"/>`);
// Carril de camareros
sym('top-lane', `
  <rect x="-4" y="-36" width="648" height="72" fill="${c.surface}" fill-opacity="0.55"/>
  <path d="M0 0H640" fill="none" stroke="${INK}" stroke-width="3.5" stroke-dasharray="14 10" stroke-linecap="round"/>`);
// short breaths from an open mouth, fanning to the right: "panting", a Dog that is too warm or too wound up (not on the canvas board)
sym('pant', `<path d="M0 -10q8 2 14 -4M2 2q10 2 18 0M0 14q8 -2 14 4" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">\n<!-- generated by kit.mjs; do not edit -->\n<defs>\n${symbols.join('\n')}\n</defs>\n</svg>\n`;
writeFileSync(join(here, 'kit.svg'), svg);
console.log(`wrote kit.svg: ${symbols.length} symbols`);
