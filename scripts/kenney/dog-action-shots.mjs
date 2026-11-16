// readable-dog (task 3.2): web-build screenshots of each walking-Dog action in every coat, from the real Stage.
// usage: node scripts/kenney/dog-action-shots.mjs <url> <out-dir> [reduced]
// Serve the build first (npm run sim:build; npx vite preview --config bundle/vite.config.mts, or any static server of bundle/dist).
// The simulation runs as usual; just before each draw this script forces the situation that action needs (a debug
// handle, nothing the player can do), then crops the screenshot around the Dog. With `reduced` the page asks for
// reduced motion. Output: <out-dir>/<action>-<coat>.png and a JSON of what the Stage chose.
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const [url, out, mode] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const COATS = ['golden', 'black', 'chocolate', 'cream', 'white', 'grey', 'red'];
// what each action needs: [dogMode, moving, extra]
const ACTIONS = {
  idle: { mode: 'goal', moving: false },
  walk: { mode: 'goal', moving: true },
  walk_wag: { mode: 'goal', moving: true, looking: true },
  trot: { mode: 'goal', moving: true, sintonia: true },
  sniffwalk: { mode: 'sniffing', moving: true },
  sniff: { mode: 'sniffing', moving: false },
  planted: { mode: 'planted', moving: false },
  mark: { mode: 'marking', moving: false },
  lunge: { mode: 'fixated', moving: true, tier: 'reactive' },
  look_l: { mode: 'goal', moving: true, away: 1 },
  look_r: { mode: 'goal', moving: true, away: -1 },
  alert: { mode: 'goal', moving: true, tier: 'alert' },
};
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 900, height: 500 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
await page.waitForFunction(() => window.__leadmate?.scene()?.sim, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const scene = window.__leadmate.scene();
  const draw = scene.draw.bind(scene);
  window.__force = null;
  window.__chosen = null;
  scene.draw = (input) => {
    const f = window.__force, s = scene.sim;
    if (f) {
      s.dogMode = f.mode; s.tier = f.tier ?? 'calm'; s.sintonia.active = !!f.sintonia;
      s.dogLookUntil = f.looking ? s.time + 5 : 0;
      s.config.look = { ...(s.config.look ?? {}), dogCoat: f.coat };
      const face = s.dogFacing; const a = (f.away ?? 0) * 1.0;
      const want = f.moving ? 1 : 0;
      s.dogDesired = { x: want * (face.x * Math.cos(a) - face.y * Math.sin(a)), y: want * (face.x * Math.sin(a) + face.y * Math.cos(a)) };
    }
    draw(input);
    const img = scene.actors.dog; window.__chosen = { frame: img.frame.name, texture: img.texture.key, x: img.x, y: img.y };
  };
});
await page.keyboard.down('w'); // the Handler walks, so the Dog moves
const chosen = {};
for (const [action, spec] of Object.entries(ACTIONS)) {
  for (const coat of COATS) {
    await page.evaluate((f) => { window.__force = f; }, { ...spec, coat });
    await page.waitForTimeout(260);
    const at = await page.evaluate(() => {
      const scene = window.__leadmate.scene(); const cam = scene.cameras.main; const c = window.__chosen;
      const r = document.querySelector('canvas').getBoundingClientRect();
      return { frame: c.frame, x: r.left + (c.x - cam.worldView.x) * cam.zoom * (r.width / cam.width), y: r.top + (c.y - cam.worldView.y) * cam.zoom * (r.height / cam.height) };
    });
    chosen[`${action}-${coat}`] = at.frame;
    await page.screenshot({ path: `${out}/${action}-${coat}.png`, clip: { x: Math.max(0, at.x - 90), y: Math.max(0, at.y - 130), width: 180, height: 170 } });
  }
}
fs.writeFileSync(`${out}/chosen.json`, JSON.stringify(chosen, null, 1));
await browser.close();
