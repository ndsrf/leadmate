// Emulates a phone in landscape (touch events) against the standalone page: joystick drag + Marker tap.
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
await page.waitForFunction(() => window.__leadmate?.scene()?.sim);
const cdp = await ctx.newCDPSession(page);
const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
const sim = (f) => page.evaluate(`(${f})(window.__leadmate.scene().sim)`);

const x0 = await sim((s) => s.handler.x);
await touch('touchStart', [[120, 290]]);
for (let i = 1; i <= 5; i++) await touch('touchMove', [[120 + 12 * i, 290 - 6 * i]]); // up-right, 0.99 of the rim
await page.waitForTimeout(1500);
const moving = await sim((s) => ({ dx: s.handler.x, ratio: s.ratio }));
console.log('joystick up-right moved handler', moving.dx > x0 + 1, moving);
await page.screenshot({ path: '/tmp/claude-1000/touch-landscape.png' });
await touch('touchEnd', []);
const a = await sim((s) => s.handler.x);
await page.waitForTimeout(500);
console.log('release stops the handler (Poste)', a === (await sim((s) => s.handler.x)));

// Marker tap with the right thumb while the left thumb holds the joystick
await touch('touchStart', [[120, 290]]);
await touch('touchStart', [[120, 290], [720, 300]]);
await touch('touchEnd', [[120, 290]]);
await touch('touchEnd', []);
console.log('layout', await page.evaluate(() => ({ w: innerWidth, h: innerHeight })));
await browser.close();
