// Screenshots the Read the Dog screen (the Diagnostic step) at 320 by 640 points on the web shell, at normal size and with a
// stressed large-text run (page zoom 1.3 on the same 320 point screen), and prints the box of each control.
// Needs `npx expo start --web --port 8099`. Run: node scripts/shot-rtd-layout.mjs [url] [outDir] [breed]
import { chromium } from 'playwright-core';

const [url = 'http://localhost:8099', out = '/tmp', breed = 'chihuahua'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [name, zoom] of [['normal', 1], ['large-text', 1.3]]) {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  const rec = JSON.stringify({ version: 11, name: 'Rex', breed, coat: 'golden', language: 'es', onboarding: { step: 'diagnostic', plan: [] } });
  // seeded before the app's own first save, once
  await page.addInitScript((r) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('leadmate.dog', r); sessionStorage.setItem('seeded', '1'); } }, rec);
  await page.goto(url);
  await page.waitForTimeout(8000);
  await page.evaluate((z) => { document.body.style.zoom = String(z); }, zoom);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-start.png` });
  const start = page.getByRole('button').first();
  console.log(name, 'buttons before start', await page.getByRole('button').count());
  await start.click().catch((e) => console.log('no start button', e.message));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${name}-round.png` });
  const boxes = await page.evaluate(() => [...document.querySelectorAll('[role=button],[role=progressbar]')].map((e) => { const r = e.getBoundingClientRect(); return { role: e.getAttribute('role'), label: e.getAttribute('aria-label'), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
  console.log(name, JSON.stringify(boxes));
  console.log(name, 'scrollHeight', await page.evaluate(() => [document.documentElement.scrollHeight, document.documentElement.scrollWidth]));
  await ctx.close();
}
await browser.close();
