// Shell power check on the web build: on resting screens (World Map, a Lesson or Settings over the map, a Barkdoku
// puzzle before the first move, a started puzzle in the background) no endless animation and no repeating timer may
// be live. Reads the development-only counters the shell exposes as window.__leadmateDevPerf.
// Needs `npm run web` (port 8099). Usage: node scripts/shell-power.mjs [url]
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:8099';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 420, height: 860 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
let failed = 0;
const ok = (name, value) => {
  if (!value) failed++;
  console.log(value ? 'PASS' : 'FAIL', name);
};
const wait = (ms) => page.waitForTimeout(ms);
const snap = () => page.evaluate(() => window.__leadmateDevPerf?.snapshot());
const setVisible = (visible) =>
  page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event(v ? 'focus' : 'blur'));
  }, visible);

/** Asserts nothing endless is live; `allowTimers` names timers that are allowed (a visible, running clock). */
const resting = async (name, allowTimers = []) => {
  await wait(1500);
  const s = await snap();
  console.log(`${name}: screen=${s?.screen} app=${s?.appState} loops=[${s?.loops}] timers=[${s?.timers}]`);
  ok(`${name}: counters are available`, Boolean(s));
  ok(`${name}: no endless animation`, s?.loops.length === 0);
  ok(`${name}: no repeating timer${allowTimers.length ? ` besides ${allowTimers.join(', ')}` : ''}`, s?.timers.every((t) => allowTimers.includes(t)));
};

/** A fresh load of the map with an existing Dog (skips the first-run funnel). */
const toMap = async () => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => localStorage.setItem('leadmate.dog', '{}'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('text=Guaudoku', { timeout: 120000 });
  await wait(500);
};

await toMap();
await resting('World Map');

// a Lesson over the map: the map stays mounted underneath and must not animate
await page.getByRole('button', { name: /^Cómo se juega/ }).first().click();
await wait(500);
await resting('Lesson over the map');

// Settings over the map
await toMap();
await page.getByRole('button', { name: 'Ajustes' }).first().click();
await page.waitForSelector('text=Ajustes');
await resting('Settings over the map');

// Barkdoku puzzle (a minigame): idle before the first move, then started, then in the background
await toMap();
await page.getByRole('button', { name: /^Guaudoku/ }).first().click();
await page.waitForSelector('text=Reiniciar');
await resting('Minigame idle (Barkdoku before the first move)');
await page.mouse.click(210, 400); // a cell press starts the clock
await wait(500);
const started = await snap();
console.log(`Minigame started: loops=[${started?.loops}] timers=[${started?.timers}]`);
ok('Minigame started: only the visible puzzle clock may tick', started.loops.length === 0 && started.timers.every((t) => t === 'barkdoku-clock'));
await setVisible(false);
await resting('Minigame backgrounded');
await setVisible(true);
await resting('Minigame back in front', ['barkdoku-clock']);

await browser.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
