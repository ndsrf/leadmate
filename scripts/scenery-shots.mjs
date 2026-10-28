// Screenshots of each scenery theme with the simulation frozen (same seed, no steps), so a change to how the
// scenery is drawn can be compared pixel by pixel. Also checks that the scenery textures a Stage generates are
// freed when it ends and do not pile up across restarts. Needs `npm run sim:dev`.
// Usage: node scripts/scenery-shots.mjs <outDir> [url]
//        node scripts/scenery-shots.mjs --diff <dirA> <dirB>   (fails when more than 0.5% of pixels differ by > 24 per channel)
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const STAGES = ['HALLWAY', 'BLIND_CORNER', 'URBAN_MIX', 'PARK_MIX'];
const DELTA = 24;
const LIMIT = 0.005;

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 520 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));

if (process.argv[2] === '--diff') {
  const [a, b] = process.argv.slice(3);
  let failed = 0;
  for (const file of readdirSync(a).filter((f) => f.endsWith('.png'))) {
    if (!existsSync(join(b, file))) {
      failed++;
      console.log('FAIL', file, `missing from ${b}`);
      continue;
    }
    const [pa, pb] = [join(a, file), join(b, file)].map((p) => 'data:image/png;base64,' + readFileSync(p).toString('base64'));
    const share = await page.evaluate(
      async ([pa, pb, delta]) => {
        const pixels = async (src) => {
          const img = new Image();
          img.src = src;
          await img.decode();
          const c = document.createElement('canvas');
          [c.width, c.height] = [img.width, img.height];
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return ctx.getImageData(0, 0, c.width, c.height).data;
        };
        const [x, y] = await Promise.all([pixels(pa), pixels(pb)]);
        let off = 0;
        for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) > delta || Math.abs(x[i + 1] - y[i + 1]) > delta || Math.abs(x[i + 2] - y[i + 2]) > delta) off++;
        return off / (x.length / 4);
      },
      [pa, pb, DELTA],
    );
    const pass = share <= LIMIT;
    if (!pass) failed++;
    console.log(pass ? 'PASS' : 'FAIL', file, `${(share * 100).toFixed(3)}% of pixels differ`);
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
}

const [out, url = 'http://localhost:5173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const SRC = '/@fs' + new URL('../src/', import.meta.url).pathname;
await page.goto(url);
await page.waitForFunction(() => window.__leadmate?.scene()?.sim);
const textureCount = () => page.evaluate(() => window.__leadmate.game.textures.getTextureKeys().length);

for (const name of STAGES) {
  await page.evaluate(
    async ([src, name]) => {
      const scenario = (await import(src + 'shell/nodes/scenarios.ts'))[name];
      const s = window.__leadmate.scene();
      s.update = () => {}; // freeze: no steps, no camera motion; drawn once below
      window.__leadmate.startStage({ type: 'start', seed: 3, scenario });
    },
    [SRC, name],
  );
  await page.waitForFunction((n) => window.__leadmate.scene().sim?.config.theme && window.__leadmate.game.scene.isActive('stage'), name);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const s = window.__leadmate.scene();
    s.followCamera(0);
    s.draw({ direction: { x: 0, y: 0 }, strength: 0 });
    s.drawHud();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, `${name}.png`) });
  // and wide, to take in more of the scenery
  await page.evaluate(() => window.__leadmate.scene().cameras.main.setZoom(0.5));
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, `${name}-wide.png`) });
  console.log('saved', name);
}

// restarting the same Stage must not grow the texture list
const counts = [];
for (let k = 0; k < 3; k++) {
  await page.evaluate(() => window.__leadmate.startStage({ type: 'start', seed: 3, scenario: window.__leadmate.scene().sim.config }));
  await page.waitForTimeout(500);
  counts.push(await textureCount());
}
const steady = counts.every((c) => c === counts[0]);
console.log(steady ? 'PASS' : 'FAIL', `texture count across restarts: ${counts.join(', ')}`);
// a stopped Stage leaves none of its generated textures behind (the keys repeat across restarts, so the count alone
// would not show a leak)
const left = await page.evaluate(() => {
  const g = window.__leadmate.game;
  const baked = () => g.textures.getTextureKeys().filter((k) => k.startsWith('prop:') || k.startsWith('wall:'));
  const before = baked().length;
  g.scene.stop('stage');
  return { before, after: baked() };
});
const freed = left.before > 0 && left.after.length === 0;
console.log(freed ? 'PASS' : 'FAIL', `generated textures freed on stop (${left.before} before, ${left.after.length} after)`);
await browser.close();
process.exit(steady && freed ? 0 : 1);
