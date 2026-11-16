// Screenshots of the World 6 Stages with the whole in-Stage HUD (walking Dog, Dog portrait, Stage Meters, Jackpot
// button, Feedback Messages) after a few seconds of scripted walking, at a phone and a tablet size, plus the loop
// rate while playing a World 6 Stage. Needs `npm run sim:dev`.
// Usage: node scripts/world6-shots.mjs <outDir> [url]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const NODES = ['park-nose-on', 'park-unpredictable', 'park-keep-fresh', 'park-plant-mark', 'park-not-that-one'];
const SIZES = [
  { name: 'phone', width: 740, height: 360 },
  { name: 'tablet', width: 1024, height: 768 },
];
const [out, url = 'http://localhost:5173/?perf=1'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const SRC = '/@fs' + new URL('../src/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
  page.on('pageerror', (e) => {
    failed++;
    console.log('pageerror', e.message);
  });
  await page.goto(url);
  await page.waitForFunction(() => window.__leadmate?.scene()?.sim);
  for (const id of NODES) {
    await page.evaluate(
      async ([src, id]) => {
        const { BASELINE_PACK } = await import(src + 'shell/content/baseline.generated.ts');
        const { defaultScenario } = await import(src + 'sim/config.ts');
        const node = BASELINE_PACK.nodes[id];
        const scenario = { ...defaultScenario, ...node.config.simulation.scenario };
        window.__leadmate.startStage({ type: 'start', seed: 7, scenario, dogName: 'Luna' });
      },
      [SRC, id],
    );
    await page.waitForFunction(() => window.__leadmate.game.scene.isActive('stage') && window.__leadmate.scene().sim);
    // walk right for a while, turn, walk on: enough for Scent Spots, a look and a message or two
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2500);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(900);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.press('Space');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1500);
    await page.keyboard.up('ArrowRight');
    // Fill meters visibly with Meter Points (first meter partially filled, second meter full)
    await page.evaluate(() => {
      const scene = window.__leadmate.scene();
      if (!scene?.sim?.meters) return;
      scene.sim.meters.forEach((m, idx) => {
        m.value = idx === 1 ? m.target : Math.round(m.target * 0.65);
      });
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(out, `${id}-${size.name}.png`) });
    console.log('saved', id, size.name);
  }
  if (size.name === 'phone') {
    const counts = () => page.evaluate(() => ({ wakes: window.__leadmate.perf.wakes, frames: window.__leadmate.perf.frames }));
    await page.keyboard.down('ArrowRight');
    const a = await counts();
    await page.waitForTimeout(2000);
    const b = await counts();
    await page.keyboard.up('ArrowRight');
    const wps = (b.wakes - a.wakes) / 2;
    const fps = (b.frames - a.frames) / 2;
    const pass = wps <= 33 && fps <= 31 && fps >= 20;
    if (!pass) failed++;
    console.log(pass ? 'PASS' : 'FAIL', `World 6 Stage (${NODES.at(-1)}) playing: ${wps.toFixed(1)} wakes/s, ${fps.toFixed(1)} frames/s`);
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
