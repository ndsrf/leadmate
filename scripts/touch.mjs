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
await page.screenshot({ path: '/tmp/claude-1000/-home-jgm-dev-projects-web-projects-leadmate/5321a4a9-8cb3-4e17-9aee-a0e4cbe21ee2/scratchpad/shots/touch-landscape.png' });
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

// Cue button under the right thumb: a tap plays a Cue and spends no Mark
const cue = await page.evaluate(() => window.__leadmate.scene().cueHome);
const marksBefore = await sim((s) => s.telemetry.marksUsed);
await page.waitForTimeout(100);
await touch('touchStart', [[cue.x, cue.y]]);
await touch('touchEnd', []);
await page.waitForTimeout(200);
console.log('Cue tap took effect, no Mark spent', await sim((s) => s.lastCueAt >= 0));
console.log('Cue tap spent no Mark', marksBefore === (await sim((s) => s.telemetry.marksUsed)));
await page.screenshot({ path: '/tmp/claude-1000/-home-jgm-dev-projects-web-projects-leadmate/5321a4a9-8cb3-4e17-9aee-a0e4cbe21ee2/scratchpad/shots/touch-cue.png' });
const tall = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const portraitPage = await tall.newPage();
await portraitPage.goto(url);
await portraitPage.waitForFunction(() => window.__leadmate?.scene()?.sim);
await portraitPage.waitForTimeout(500);
const portrait = await portraitPage.evaluate(() => {
  const s = window.__leadmate.scene();
  return { cue: s.cueHome, marker: s.markerHome, joy: s.joyHome };
});
console.log('portrait layout: joystick left, Marker and Cue right', portrait.joy.x < 195 && portrait.marker.x > 195 && portrait.cue.x > 195, portrait);
await portraitPage.screenshot({ path: '/tmp/claude-1000/-home-jgm-dev-projects-web-projects-leadmate/5321a4a9-8cb3-4e17-9aee-a0e4cbe21ee2/scratchpad/shots/touch-portrait.png' });

// -- engagement features by touch: both Cue buttons and Go Sniff in a World 3 Stage
const SRC = '/@fs' + new URL('../src/', import.meta.url).pathname;
await page.evaluate(async (src) => {
  const scenario = (await import(src + 'shell/nodes/scenarios.ts')).SCOOTER_CROSSING;
  window.__leadmate.startStage({ type: 'start', seed: 3, scenario: { ...scenario, dogGoalSpeed: 0 } });
}, SRC);
await page.waitForTimeout(800);
const hud = await page.evaluate(() => { const s = window.__leadmate.scene(); return { lets: s.cueHome, leave: s.leaveItHome, sniff: s.sniffHome }; });
await page.evaluate(() => { const s = window.__leadmate.scene().sim; s.sniffOfferUntil = s.time + 30; s.dog = { ...s.handler }; });
await page.waitForTimeout(200);
await touch('touchStart', [[hud.leave.x, hud.leave.y]]);
await touch('touchEnd', []);
await page.waitForTimeout(150);
console.log('Leave It tap on a Dog that is not on food had no effect', await sim((s) => s.lastCueAt < 0));
await touch('touchStart', [[hud.lets.x, hud.lets.y]]);
await touch('touchEnd', []);
await page.waitForTimeout(150);
console.log("Let's Go tap took effect", await sim((s) => s.lastCueAt >= 0));
await touch('touchStart', [[hud.sniff.x, hud.sniff.y]]);
await touch('touchEnd', []);
await page.waitForTimeout(300);
console.log('Go Sniff tap started a Go Sniff', await sim((s) => s.telemetry.goSniffs === 1));
await page.screenshot({ path: '/tmp/claude-1000/-home-jgm-dev-projects-web-projects-leadmate/5321a4a9-8cb3-4e17-9aee-a0e4cbe21ee2/scratchpad/shots/touch-world3.png' });
await browser.close();
