// Captures the real controls for the How-to-play Lessons: each entry below stages the game in a fixed state (fixed
// seed, scripted input, fixed date), screenshots it, crops it to 16:9, draws a highlight ring and an arrow on the
// control, and writes assets/lessons/<name>.png at 1280 by 720, then regenerates lessonArtRegistry.ts like
// render-lesson-art.mjs. Stage controls come from the simulation bundle, minigame controls from the web app.
// Needs both dev servers: `npm run sim:dev` (http://localhost:5173) and `npx expo start --web` (default port 8081).
// Run: node scripts/capture-controls.mjs [name ...] [--sim url] [--app url] [--out dir] [--registry file]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium } from 'playwright-core';
import { BUDGET, ROOT, writeRegistry } from './art/lessons/_kit/svg.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};
const simUrl = flag('--sim', 'http://localhost:5173/');
const appUrl = flag('--app', 'http://localhost:8081/');
const out = flag('--out', join(ROOT, 'assets/lessons'));
const registry = flag('--registry', join(ROOT, 'src/shell/lessons/lessonArtRegistry.ts'));
const only = new Set(args);

const SRC = `/@fs${join(ROOT, 'src')}/`;
const tokens = JSON.parse(readFileSync(join(ROOT, 'src/shell/ui/tokens.json'), 'utf8')).color;
/** The day every capture happens on, so the minigames' date-based seeds repeat. */
const DAY = new Date('2026-10-01T10:00:00');
const WIDTH = 1280;
/** How far the minigame scene reaches above the Dog's state caption, in points on a 360-point-wide phone. */
const SCENE_HEIGHT = 205;
const HEIGHT = 720;

/**
 * A Stage capture: `scenario` (an export of scenarios.ts, or null for the default walk) run for the `input` phases
 * (`route` follows the route, `back` turns round, `none` stands still; `s` seconds each), then `ring` names what to
 * highlight: a HUD control, `leash`, `anchor` (the Poste ring at the Handler's feet) or `hint`. `arrow` is the side
 * the arrow comes from. `walking` draws the frame as if the joystick were still pushed; `joy` pushes the knob by
 * that many points; `sniff` opens the Go Sniff offer.
 */
const STAGES = [
  { name: 'howto-walking-1', scenario: null, input: [{ d: 'route', s: 2 }], joy: { x: 44, y: -30 }, walking: true, ring: 'joy', arrow: 'up' },
  { name: 'howto-walking-2', scenario: null, input: [{ d: 'route', s: 3 }, { d: 'none', s: 1.6 }], walking: true, ring: 'leash', arrow: 'up' },
  { name: 'howto-walking-3', scenario: null, input: [{ d: 'route', s: 3 }, { d: 'none', s: 1.6 }], ring: 'anchor', arrow: 'left' },
  { name: 'howto-walking-4', scenario: 'SLACK_U', input: [{ d: 'route', s: 3 }], walking: true, sniff: true, ring: 'sniff', arrow: 'left' },
  { name: 'howto-cues-1', scenario: 'LEAVE_IT_INTRO', input: [{ d: 'route', s: 9 }], walking: true, ring: 'leaveIt', arrow: 'left' },
  { name: 'howto-cues-2', scenario: 'SCOOTER_CROSSING', input: [{ d: 'route', s: 11 }], walking: true, ring: 'cue', arrow: 'left' },
  { name: 'howto-long-leash-1', scenario: 'PARK_JOGGER', input: [{ d: 'route', s: 3 }, { d: 'back', s: 2 }, { d: 'none', s: 0.4 }], walking: true, ring: 'leash', arrow: 'up' },
  { name: 'howto-long-leash-2', scenario: 'PARK_JOGGER', input: [{ d: 'route', s: 3 }, { d: 'back', s: 2 }, { d: 'none', s: 1.6 }], ring: 'hint', arrow: 'down' },
];

/**
 * A minigame capture in the web app: open the Node `node` (its map label) on a Dog that has finished every Stop,
 * pass the Primer and Checkpoint, start the minigame, then `act` and highlight the control `ring` returns; the crop
 * runs from the scene above the Dog's state caption `from` (or `above` points over the control) down to that control.
 */
const APPS = [
  {
    name: 'howto-tap-hold-1',
    node: 'Lección. Mundo 1 · El ritual del arnés',
    // the action that fits the beat on show, as the minigame's own hints say
    act: async (page) => {
      const state = await page.locator('text=/Olfatea|Salta|Sentado|Tumbado|ladra|puerta|inquieto/i').first().textContent();
      const action = /olfatea/i.test(state) ? 'Llamar' : /salta/i.test(state) ? 'Esperar' : /sentado/i.test(state) ? 'Poner arnés' : 'Marcar';
      return { ring: `[role=button][aria-label^="${action}."]`, from: 'text=/Olfatea|Salta|Sentado|Tumbado|ladra|puerta|inquieto/i' };
    },
    arrow: 'up',
  },
  {
    name: 'howto-tap-hold-2',
    node: 'Lección. Práctica: el Poste',
    act: async (page) => {
      const hold = page.locator('[role=button]:has-text("Mantén pulsado")');
      const box = await hold.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1500);
      return { ring: '[role=button]:has-text("Mantén pulsado")', above: 300, release: true };
    },
    arrow: 'up',
  },
];

const wanted = (c) => only.size === 0 || only.has(c.name);
if (only.size > 0) for (const n of only) if (![...STAGES, ...APPS].some((c) => c.name === n)) console.error(`no such capture: ${n}`);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = false;

/** Crops `shot` (a PNG at 2x of the page) to `crop` (page points, any aspect, padded to 16:9) and draws the ring. */
async function compose(shot, crop, ring, arrow, file, pad = 16) {
  let { x, y, w, h } = { x: crop.x - pad, y: crop.y - pad, w: crop.width + 2 * pad, h: crop.height + 2 * pad };
  if (w / h < 16 / 9) {
    const nw = (h * 16) / 9;
    x -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = (w * 9) / 16;
    y -= (nh - h) / 2;
    h = nh;
  }
  const k = WIDTH / w;
  const r = { x: (ring.x - x) * k, y: (ring.y - y) * k, w: ring.width * k, h: ring.height * k };
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const rx = r.w / 2 + 14;
  const ry = r.h / 2 + 14;
  const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[arrow];
  // the arrow points at the ring from outside it, along `dir` from the ring's edge
  const tip = [cx + dir[0] * (rx + 10), cy + dir[1] * (ry + 10)];
  const tail = [tip[0] + dir[0] * 90, tip[1] + dir[1] * 90];
  const head = (a) => [tip[0] + dir[0] * 26 + -dir[1] * a, tip[1] + dir[1] * 26 + dir[0] * a];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" style="position:absolute;left:0;top:0">
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${tokens.ink}" stroke-width="14"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${tokens.coral}" stroke-width="8"/>
<line x1="${tail[0]}" y1="${tail[1]}" x2="${tip[0] + dir[0] * 20}" y2="${tip[1] + dir[1] * 20}" stroke="${tokens.ink}" stroke-width="12" stroke-linecap="round"/>
<polygon points="${tip.join(',')} ${head(18).join(',')} ${head(-18).join(',')}" fill="${tokens.ink}" stroke="${tokens.ink}" stroke-width="4" stroke-linejoin="round"/>
</svg>`;
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  const img = `data:image/png;base64,${shot.toString('base64')}`;
  // the shot is at 2x: one page point is 2 image pixels
  await page.setContent(`<html><body style="margin:0;background:${tokens.bg}"><div style="position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden">
<img src="${img}" style="position:absolute;left:${-x * k}px;top:${-y * k}px;transform-origin:0 0;transform:scale(${k / 2})">${svg}</div></body></html>`);
  await page.waitForLoadState('load');
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  await page.close();
  writeFileSync(file, png);
  console.log(`✓ ${relative(ROOT, file)} (${(png.length / 1024).toFixed(0)} kB)`);
}

for (const c of STAGES.filter(wanted)) {
  try {
    const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 2 });
    await page.goto(simUrl);
    await page.waitForFunction(() => window.__leadmate?.scene()?.sim);
    const ring = await page.evaluate(
      async ([src, c]) => {
        const scenarios = await import(src + 'shell/nodes/scenarios.ts');
        const { defaultScenario } = await import(src + 'sim/config.ts');
        window.__leadmate.startStage({ type: 'start', seed: 3, scenario: c.scenario ? scenarios[c.scenario] : defaultScenario });
        await new Promise((r) => setTimeout(r, 1500));
        const s = window.__leadmate.scene();
        s.sys.sceneUpdate = () => {}; // frozen (Phaser keeps its own reference to update): only the ticks below move it
        const { tick } = await import(src + 'sim/sim.ts');
        const { routeDirection } = await import(src + 'sim/harness.ts');
        const { project } = await import(src + 'hud/iso.ts');
        const { JOY_RADIUS, CUE_RADIUS, SNIFF_RADIUS, MARKER_RADIUS } = await import(src + 'hud/layout.ts');
        const step = s.sim.config.fixedStep;
        let input = { direction: { x: 0, y: 0 }, strength: 0, marker: false };
        for (const ph of c.input)
          for (let i = 0; i < ph.s / step; i++) {
            const r = routeDirection(s.sim.config, s.sim.handler);
            const dir = ph.d === 'route' ? r : ph.d === 'back' ? { x: -r.x, y: -r.y } : { x: 0, y: 0 };
            input = { direction: dir, strength: ph.d === 'none' ? 0 : 1, marker: false };
            s.handleEvents(tick(s.sim, input, step));
            s.showHints();
          }
        // the warning shows only where it is the subject
        if (c.ring !== 'hint') s.hintText.setVisible(false);
        if (c.sniff) s.sim.sniffOfferUntil = s.sim.time + s.sim.config.goSniff.offerSeconds * 0.7;
        if (c.joy) s.joy = { base: { ...s.joyHome }, knob: { x: s.joyHome.x + c.joy.x, y: s.joyHome.y + c.joy.y } };
        for (let i = 0; i < 30; i++) s.followCamera(100);
        s.draw(c.walking ? { ...input, strength: 1 } : input);
        s.drawHud();
        // the camera's view of the world updates on the next rendered frame
        await new Promise((r) => setTimeout(r, 300));
        const cam = s.cameras.main;
        const screen = (p, z = 0) => {
          const q = project(p, z);
          return { x: (q.x - cam.worldView.x) * cam.zoom, y: (q.y - cam.worldView.y) * cam.zoom };
        };
        const disc = (p, r) => ({ x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r });
        if (c.ring === 'joy') return disc(s.joyHome, JOY_RADIUS);
        if (c.ring === 'marker') return disc(s.markerHome, MARKER_RADIUS);
        if (c.ring === 'cue') return disc(s.cueHome, CUE_RADIUS);
        if (c.ring === 'leaveIt') return disc(s.leaveItHome, CUE_RADIUS);
        if (c.ring === 'sniff') return disc(s.sniffHome, SNIFF_RADIUS);
        if (c.ring === 'hint') {
          const b = s.hintText.getBounds();
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        }
        const h = screen(s.sim.handler);
        if (c.ring === 'anchor') return { x: h.x - 28, y: h.y - 16, width: 56, height: 32 };
        // the leash: from the Handler's hand to the Dog
        const d = screen(s.sim.dog);
        const top = Math.min(h.y - 40, d.y - 25);
        return { x: Math.min(h.x, d.x) - 10, y: top, width: Math.abs(h.x - d.x) + 20, height: Math.max(h.y, d.y) - top };
      },
      [SRC, c],
    );
    await page.waitForTimeout(400);
    const shot = await page.screenshot();
    await page.close();
    await compose(shot, { x: 0, y: 0, width: 640, height: 360 }, ring, c.arrow, join(out, `${c.name}.png`), 0);
  } catch (e) {
    console.error(`✗ ${c.name}: ${e.message}`);
    failed = true;
  }
}

const apps = APPS.filter(wanted);
if (apps.length > 0) {
  // a Dog that has read, completed and passed every Stop, so any Node opens from the map
  const ids = (file, fn) => [...new Set([...readFileSync(join(ROOT, file), 'utf8').matchAll(new RegExp(`${fn}\\('([^']+)'`, 'g'))].map((m) => m[1]))];
  const sim = await browser.newPage();
  await sim.goto(simUrl);
  const record = JSON.parse(await sim.evaluate(async (src) => JSON.stringify((await import(src)).newDogRecord()), `${SRC}shell/dogRecord.ts`));
  await sim.close();
  Object.assign(record, {
    name: 'Migas',
    onboarding: { ...record.onboarding, step: 'done', firstStageCompletedAt: '2026-09-28T12:00:00.000Z' },
    readLessons: ids('src/shell/world.ts', 'lesson'),
    completedNodes: ids('src/shell/world.ts', 'node'),
    missions: Object.fromEntries(ids('src/shell/missions/content.ts', 'mission').map((m) => [m, { passedOn: '2026-09-30' }])),
  });
  for (const c of apps) {
    try {
      const page = await browser.newPage({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2 });
      await page.clock.setSystemTime(DAY);
      await page.addInitScript((r) => localStorage.setItem('leadmate.dog', r), JSON.stringify(record));
      await page.goto(appUrl);
      await page.click(`[aria-label^="${c.node}"]`, { timeout: 60000 });
      // Primer, Checkpoint (any answer will do) and the minigame's start button
      for (let k = 0; k < 12 && !(await page.$('[role=button][aria-label^="Esperar."], [role=button]:has-text("Mantén pulsado")')); k++) {
        await page.waitForTimeout(800);
        const next = await page.$('[role=button]:has-text("Siguiente"), [role=button]:has-text("Empezar")');
        if (next) await next.click();
        else {
          const options = await page.$$('[role=button]');
          if (options.length > 0) await options[0].click();
        }
      }
      await page.waitForTimeout(800);
      const { ring, from, above, release } = await c.act(page);
      const box = async (sel) => (await page.locator(sel).first().boundingBox());
      // from the scene (above the Dog's state caption `from`, or `above` points over the control) down to the control
      const ringBox = await box(ring);
      const top = from ? (await box(from)).y - SCENE_HEIGHT : ringBox.y - above;
      const crop = { x: 0, y: top, width: 360, height: ringBox.y + ringBox.height - top };
      const shot = await page.screenshot();
      if (release) await page.mouse.up();
      await page.close();
      await compose(shot, crop, ringBox, c.arrow, join(out, `${c.name}.png`));
    } catch (e) {
      console.error(`✗ ${c.name}: ${e.message}`);
      failed = true;
    }
  }
}
await browser.close();

const { count, total } = writeRegistry(out, registry);
console.log(`${count} pictures, ${(total / 1024 / 1024).toFixed(2)} MB of ${(BUDGET / 1024 / 1024).toFixed(0)} MB; wrote ${relative(ROOT, registry)}`);
if (total > BUDGET) {
  console.error('over the 6 MB budget');
  failed = true;
}
process.exit(failed ? 1 : 0);
