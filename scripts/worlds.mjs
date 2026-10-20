// Plays the World scenarios in the standalone page (headless Chrome) and saves screenshots of the
// engagement features: scenery and walls, Reaction Tiers, Sintonía, Go Sniff and the Cue buttons.
// Needs `npm run sim:dev`. Usage: node scripts/worlds.mjs [url] [outDir]
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? '/tmp';
const SRC = '/@fs' + new URL('../src/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 520 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => m.type() === 'warning' && console.log('console.warn', m.text()));
const ok = (name, value) => console.log(value ? 'PASS' : 'FAIL', name);
await page.goto(url);
await page.waitForFunction(() => window.__leadmate?.scene()?.sim);

const start = async (scenario, seed = 3) => {
  await page.evaluate(([scenario, seed]) => window.__leadmate.startStage({ type: 'start', seed, scenario }), [scenario, seed]);
  await page.waitForTimeout(600);
};
const sim = (f, arg) => page.evaluate(`(${f})(window.__leadmate.scene().sim, ${JSON.stringify(arg ?? null)})`);
const scenarios = await page.evaluate(async (src) => ({
  ...(await import(src + 'shell/nodes/scenarios.ts')),
  daily: await import(src + 'shell/daily.ts'),
}), SRC);
void scenarios;
const load = (name) => page.evaluate(async ([src, name]) => (await import(src + 'shell/nodes/scenarios.ts'))[name], [SRC, name]);

// -- World 2: blind corner, walls and scenery
await start(await load('BLIND_CORNER'));
await page.screenshot({ path: `${out}/world2-corner.png` });
ok('World 2 scene has walls and scenery', await sim((s) => s.config.walls.length > 4 && s.config.scenery.length >= 8));

// -- Reaction Tiers: Alert then Reactive, with the Arousal set directly
await sim((s) => { s.arousal = 0.8 * s.dogTraits.reactivityThreshold; });
await page.waitForTimeout(400);
ok('Alert tier', (await sim((s) => s.tier)) === 'alert');
await page.screenshot({ path: `${out}/tier-alert.png` });
await sim((s) => { s.arousal = 90; s.dogMode = 'fixated'; });
await page.waitForTimeout(700);
ok('Reactive tier', (await sim((s) => s.tier)) === 'reactive');
await page.screenshot({ path: `${out}/tier-reactive.png` });

// -- Sintonía: walk a gentle circle with a stub input through the sim, then look
// the Dog stands at the center of the circle the Handler walks, so the leash stays Slack
await start({ ...(await load('SLACK_U')), dogGoalSpeed: 0, dogStart: { x: 0, y: 1.33 } });
await page.evaluate(() => {
  const s = window.__leadmate.scene();
  s.readInput = () => {
    const t = s.sim.time;
    return { direction: { x: Math.cos(0.9 * t), y: Math.sin(0.9 * t) }, strength: 0.6, marker: false };
  };
});
const flowing = await page.waitForFunction(() => window.__leadmate.scene().sim.sintonia.active, null, { timeout: 30000, polling: 50 }).then(() => true, () => false);
ok('Sintonía active after arcs', flowing);
await page.screenshot({ path: `${out}/sintonia.png` });
await page.evaluate(() => delete window.__leadmate.scene().readInput); // back to the real input

// -- Go Sniff button on offer
await start({ ...(await load('SLACK_U')), dogGoalSpeed: 0 });
await sim((s) => { s.sniffOfferUntil = s.time + 3; s.dog = { ...s.handler }; });
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/go-sniff.png` });
await page.keyboard.press('n');
await page.waitForTimeout(400);
ok('Go Sniff started with N', await sim((s) => s.telemetry.goSniffs > 0));
await page.screenshot({ path: `${out}/go-sniff-active.png` });

// -- World 3: both Cue buttons, and the "Leave It" intro alone
await start(await load('SCOOTER_CROSSING'));
await page.screenshot({ path: `${out}/world3-scooter.png` });
await start(await load('LEAVE_IT_INTRO'));
await page.screenshot({ path: `${out}/world3-leaveit.png` });

// -- World 4: open park, 3 m leash
await start(await load('PARK_MIX'));
ok('World 4 leash is 3 m', (await sim((s) => s.config.leashLength)) === 3);
await page.screenshot({ path: `${out}/world4-park.png` });

// -- Daily Stage
const daily = await page.evaluate(async ([src]) => (await import(src + 'shell/daily.ts')).generateDailyStage('2026-10-20'), [SRC]);
await start(daily, 20261020);
await page.screenshot({ path: `${out}/daily.png` });
ok('Daily Stage has a schedule', await sim((s) => s.config.moreDistractors.length >= 2));

// -- touch layout with both Cues on a phone
const phone = await browser.newContext({ viewport: { width: 740, height: 360 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const mobile = await phone.newPage();
await mobile.goto(url);
await mobile.waitForFunction(() => window.__leadmate?.scene()?.sim);
await mobile.evaluate(async ([src]) => {
  const scenario = (await import(src + 'shell/nodes/scenarios.ts')).SCOOTER_CROSSING;
  window.__leadmate.startStage({ type: 'start', seed: 3, scenario });
}, [SRC]);
await mobile.waitForTimeout(800);
await mobile.evaluate(() => { const s = window.__leadmate.scene(); s.sim.sniffOfferUntil = s.sim.time + 30; s.sim.dog = { ...s.sim.handler }; });
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: `${out}/phone-cues.png` });
const layout = await mobile.evaluate(() => { const s = window.__leadmate.scene(); return { cue: s.cueHome, leaveIt: s.leaveItHome, sniff: s.sniffHome, marker: s.markerHome }; });
console.log('phone layout', JSON.stringify(layout));
await browser.close();
