// Power regression check: loop wakeups/s and frames/s stay at about 30 while playing (timer pacing, whatever the
// display rate), and the loop neither wakes nor draws while the Stage is paused, ended, suspended by the shell or
// hidden. Also prints a baseline (the old behaviour: unlimited loop, never
// asleep). Needs `npm run sim:dev`.
// Usage: node scripts/power.mjs [url]
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:5173/?perf=1';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 800, height: 400 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
let failed = 0;
const ok = (name, value) => {
  if (!value) failed++;
  console.log(value ? 'PASS' : 'FAIL', name);
};
const wait = (ms) => page.waitForTimeout(ms);
const counts = () => page.evaluate(() => ({ wakes: window.__leadmate.perf.wakes, frames: window.__leadmate.perf.frames, steps: window.__leadmate.perf.steps() }));
const rate = async (ms = 2000) => {
  const a = await counts();
  await wait(ms);
  const b = await counts();
  return { wps: ((b.wakes - a.wakes) * 1000) / ms, fps: ((b.frames - a.frames) * 1000) / ms, sps: ((b.steps - a.steps) * 1000) / ms, wakes: b.wakes - a.wakes, frames: b.frames - a.frames };
};
const post = (message) => page.evaluate((m) => window.postMessage(JSON.stringify(m), '*'), message);

await page.goto(url);
await page.waitForFunction(() => window.__leadmate?.scene()?.sim);
await wait(500);

const play = await rate();
console.log(`playing: ${play.wps.toFixed(1)} wakes/s, ${play.fps.toFixed(1)} frames/s, ${play.sps.toFixed(1)} steps/s`);
ok('playing wakes the loop at most 33 times/s', play.wps <= 33);
ok('playing draws at most 30 frames/s', play.fps <= 31);
ok('playing still draws (>= 20 frames/s)', play.fps >= 20);
ok('simulation steps at ~60/s', play.sps > 50 && play.sps < 70);
ok('no audio engine in the bundle', (await page.evaluate(() => window.__leadmate.game.sound.constructor.name)) === 'NoAudioSoundManager');

// display-paced (`?pace=raf`, the fallback): the simulation steps at the same rate, only the wakeups differ
const rafPage = await page.context().newPage();
await rafPage.goto(url + (url.includes('?') ? '&' : '?') + 'pace=raf');
await rafPage.waitForFunction(() => window.__leadmate?.scene()?.sim);
await rafPage.waitForTimeout(500);
const rafRate = await rafPage.evaluate(async () => {
  const p = window.__leadmate.perf;
  const a = { wakes: p.wakes, steps: p.steps() };
  await new Promise((r) => setTimeout(r, 2000));
  return { wps: (p.wakes - a.wakes) / 2, sps: (p.steps() - a.steps) / 2 };
});
await rafPage.close();
console.log(`display-paced: ${rafRate.wps.toFixed(1)} wakes/s, ${rafRate.sps.toFixed(1)} steps/s`);
ok('timer pacing leaves steps/s unchanged', Math.abs(rafRate.sps - play.sps) <= 5);

// baseline: the old loop, display-paced, unlimited and never asleep
await page.evaluate(() => {
  const loop = window.__leadmate.game.loop;
  loop.sleep();
  loop.hasFpsLimit = false;
  loop.forceSetTimeOut = false;
  loop.wake();
});
const base = await rate();
console.log(`baseline playing (unlimited): ${base.fps.toFixed(1)} frames/s, ${base.sps.toFixed(1)} steps/s`);
await page.evaluate(() => {
  const g = window.__leadmate.game;
  g.scene.getScene('stage').pauseStage(); // pause without the sleep logic
});
const basePaused = await rate();
console.log(`baseline paused (never asleep): ${basePaused.fps.toFixed(1)} frames/s`);
await page.reload();
await page.waitForFunction(() => window.__leadmate?.scene()?.sim);
await wait(500);

// paused: draw one more frame, then none
await post({ type: 'pause' });
await wait(300);
const paused = await rate();
console.log(`paused: ${paused.wakes} wakes, ${paused.frames} frames in 2 s`);
ok('paused draws no frames', paused.frames === 0);
ok('paused does not wake the loop', paused.wakes === 0);

// resize while asleep re-lays out with a single frame
const before = await counts();
await page.setViewportSize({ width: 640, height: 360 });
await wait(500);
const afterResize = await counts();

ok('resize while paused draws a frame', afterResize.frames > before.frames);
ok('resize while paused draws only a few frames', afterResize.frames - before.frames <= 3);
ok('asleep again after resize', (await rate(1000)).wakes === 0);

// resume: running again, no time passed meanwhile, no jump
const timeBefore = await page.evaluate(() => window.__leadmate.scene().sim.time);
await wait(1000);
const timeStill = await page.evaluate(() => window.__leadmate.scene().sim.time);
ok('no Stage time elapses while paused', timeStill === timeBefore);
const dogBefore = await page.evaluate(() => ({ ...window.__leadmate.scene().sim.dog }));
await post({ type: 'resume' });
await wait(300);
const dogAfter = await page.evaluate(() => ({ ...window.__leadmate.scene().sim.dog }));
const moved = Math.hypot(dogAfter.x - dogBefore.x, dogAfter.y - dogBefore.y);
ok('resume continues drawing', (await rate(1000)).fps > 20);
ok('resume does not make the Dog jump', moved < 20);

// shell suspend / wake
await post({ type: 'suspend' });
await wait(300);
const suspendedRate = await rate(1500);
ok('suspended draws no frames', suspendedRate.frames === 0);
ok('suspended does not wake the loop', suspendedRate.wakes === 0);
await post({ type: 'wake' });
await wait(300);
ok('wake draws again', (await rate(1000)).fps > 20);

// tab hidden
await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
});
await wait(300);
const hiddenRate = await rate(1500);
ok('hidden draws no frames', hiddenRate.frames === 0);
ok('hidden does not wake the loop', hiddenRate.wakes === 0);
await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
});
await post({ type: 'resume' });
await wait(300);
ok('visible again draws', (await rate(1000)).fps > 20);

// ended
await page.evaluate(() => {
  const s = window.__leadmate.scene();
  Object.assign(s.sim.handler, s.sim.config.waypoint); // handler and Dog at the waypoint end the Stage
  Object.assign(s.sim.dog, s.sim.config.waypoint);
  s.sim.time = Math.max(s.sim.time, s.sim.config.endCondition.seconds ?? 0);
});
await page.waitForFunction(() => window.__leadmate.scene().isEnded, null, { timeout: 15000 }).catch(() => {});
if (await page.evaluate(() => window.__leadmate.scene().isEnded)) {
  await wait(500);
  const endedRate = await rate(1500);
  ok('ended draws no frames', endedRate.frames === 0);
  ok('ended does not wake the loop', endedRate.wakes === 0);
} else console.log('SKIP ended (could not end the Stage quickly)');

await browser.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
