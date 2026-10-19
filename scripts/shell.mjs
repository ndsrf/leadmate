// Drives the web shell (Expo web + iframe bundle): pause/Resume overlay, results screen, Play again.
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:8099';
const out = process.argv[3] ?? '/tmp';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
const frame = async () => {
  await page.waitForSelector('iframe', { timeout: 60000 });
  for (let i = 0; i < 100 && page.frames().length < 2; i++) await page.waitForTimeout(100);
  const f = page.frames().find((x) => x !== page.mainFrame());
  await f.waitForFunction(() => window.__leadmate?.scene()?.sim, null, { timeout: 60000 });
  return f;
};
let f = await frame();
const sim = (fn) => f.evaluate(`(${fn})(window.__leadmate.scene().sim)`);
console.log('stage started by shell', await sim((s) => ({ time: s.time < 5, seed: s.seed > 0 })));

// pause: the window loses focus
await f.evaluate(() => window.dispatchEvent(new Event('blur'))); // what a tab switch does
await page.waitForSelector('text=Pausa', { timeout: 10000 });
const t1 = await sim((s) => s.time);
await page.waitForTimeout(500);
console.log('paused, time frozen', t1 === (await sim((s) => s.time)));
await page.screenshot({ path: `${out}/shell-pause.png` });
await page.click('text=Continuar');
await page.waitForFunction(() => !document.body.innerText.includes('Pausa'));
await page.waitForTimeout(500);
console.log('resumed, time runs', (await sim((s) => s.time)) > t1);

// finish the Stage: jump the Handler to the waypoint
await f.evaluate(() => { const s = window.__leadmate.scene().sim; s.handler = { x: 89, y: 0 }; s.dog = { x: 89.5, y: 0 }; });
await page.waitForSelector('text=Resultados del paseo', { timeout: 10000 });
console.log('results', (await page.innerText('body')).replace(/\n+/g, ' | '));
await page.screenshot({ path: `${out}/shell-results.png` });

const seed1 = await sim((s) => s.seed);
await page.click('text=Jugar de nuevo');
await page.waitForFunction(() => !document.body.innerText.includes('Resultados del paseo'));
await page.waitForTimeout(500);
console.log('play again: new seed', seed1 !== (await sim((s) => s.seed)), 'fresh', await sim((s) => s.time < 3));
await browser.close();
