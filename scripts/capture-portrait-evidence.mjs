import { chromium } from 'playwright-core';
import { resolve } from 'node:path';

const outDir = resolve('openspec/changes/readable-dog/art');
const bundlePath = 'file://' + resolve('bundle/dist/index.html');

const states = [
  {
    name: 'calm',
    coat: 'golden',
    setup: (s) => {
      s.sim.tier = 'calm';
      s.sim.dogMode = 'walking';
      s.sim.dogFacing = { x: 1, y: 0 };
      s.sim.dogDesired = { x: 1, y: 0 };
      s.sim.dogLookUntil = 0;
      s.sim.config.look = { ...s.sim.config.look, dogCoat: 'golden' };
    },
  },
  {
    name: 'check-in',
    coat: 'chocolate',
    setup: (s) => {
      s.sim.tier = 'calm';
      s.sim.dogMode = 'walking';
      s.sim.dogFacing = { x: 1, y: 0 };
      s.sim.dogDesired = { x: 1, y: 0 };
      s.sim.dogLookUntil = s.sim.time + 10;
      s.sim.config.look = { ...s.sim.config.look, dogCoat: 'chocolate' };
    },
  },
  {
    name: 'alert',
    coat: 'black',
    setup: (s) => {
      s.sim.tier = 'alert';
      s.sim.dogMode = 'walking';
      s.sim.dogFacing = { x: 1, y: 0 };
      s.sim.dogDesired = { x: 1, y: 0 };
      s.sim.dogLookUntil = 0;
      s.sim.config.look = { ...s.sim.config.look, dogCoat: 'black' };
    },
  },
  {
    name: 'sniffing',
    coat: 'cream',
    setup: (s) => {
      s.sim.tier = 'calm';
      s.sim.dogMode = 'sniffing';
      s.sim.dogFacing = { x: 1, y: 0 };
      s.sim.dogDesired = { x: 0, y: 0 };
      s.sim.dogLookUntil = 0;
      s.sim.config.look = { ...s.sim.config.look, dogCoat: 'cream' };
    },
  },
  {
    name: 'looking-away',
    coat: 'red',
    setup: (s) => {
      s.sim.tier = 'calm';
      s.sim.dogMode = 'walking';
      s.sim.dogFacing = { x: 1, y: 0 };
      s.sim.dogDesired = { x: 0, y: 1 };
      s.sim.dogLookUntil = 0;
      s.sim.config.look = { ...s.sim.config.look, dogCoat: 'red' };
    },
  },
];

const viewports = [
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
];

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

for (const vp of viewports) {
  console.log(`Capturing evidence for viewport ${vp.width}x${vp.height}...`);
  const page = await browser.newPage({ viewport: vp });
  await page.goto(bundlePath);
  await page.waitForTimeout(2000);

  for (const st of states) {
    const outPath = `${outDir}/portrait-${vp.width}-${st.name}.png`;
    await page.evaluate((fnSource) => {
      const s = window.__leadmate.scene();
      s.pauseStage();
      const fn = new Function('s', fnSource);
      fn(s);
      s.portraitDirty.reset();
      s.drawPortrait();
      s.drawHud();
    }, `(${st.setup.toString()})(s);`);

    await page.waitForTimeout(100);
    await page.screenshot({ path: outPath });
    console.log(`Saved ${outPath}`);
  }

  await page.close();
}

await browser.close();
console.log('Finished capturing portrait evidence screenshots.');
