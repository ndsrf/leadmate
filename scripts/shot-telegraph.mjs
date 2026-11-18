// Screenshots the Approach ring, snap, landed and Good looks, the Check-in arc and the Marker highlight in the standalone bundle.
// Usage: node scripts/shot-telegraph.mjs <outDir> [level=full|ring|late|off] [reduced]   (needs `npm run sim:build` first)
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [outDir = '/tmp', level = 'full', motion = 'normal'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const tag = `${level}-${motion}`;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 900, height: 500 }, reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('file://' + resolve('bundle/dist/index.html'));
await page.waitForFunction(() => window.__leadmate?.scene()?.sim);
await page.evaluate((l) => window.postMessage({ type: 'start', seed: 7, markerAssist: { level: l, successRun: 0, failRun: 0 }, reducedMotion: undefined }, '*'), level);
await page.waitForTimeout(500);
const wait = (cond, timeout = 120000) => page.waitForFunction(`(${cond})(window.__leadmate.scene().sim)`, null, { timeout, polling: 20 });
const shot = async (name) => { await page.screenshot({ path: `${outDir}/telegraph-${tag}-${name}.png` }); console.log('saved', name); };
const info = (f) => page.evaluate(`(${f})(window.__leadmate.scene().sim)`);

await page.keyboard.down('w');
await wait((s) => s.dogMode === 'fixated');
await page.keyboard.up('w');
await wait((s) => s.calmElapsed > 0.05);
await shot('open-closing-early');
await wait((s) => s.calmElapsed > 1.6);
await shot('closing-mid');
// snap: move the Handler for a moment, which restarts the calm period
await page.keyboard.down('w');
await wait((s) => s.calmElapsed === 0 || s.calmElapsed < 0.5);
await page.waitForTimeout(40);
await shot('snap');
await page.keyboard.up('w');
await wait((s) => s.calmElapsed > 2.6 || s.rewardWindow !== null);
await shot('closing-late');
await wait((s) => s.rewardWindow !== null && s.time - s.rewardWindow.openedAt > 0.04);
await shot('landed');
await wait((s) => s.rewardWindow !== null && s.time - s.rewardWindow.openedAt > 0.5);
await shot('good');
console.log(await info((s) => ({ t: +s.time.toFixed(2), mode: s.dogMode, window: s.rewardWindow })));
await browser.close();
