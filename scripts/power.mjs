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

// ---- close view (the hand drill, HTML/SVG over the page): playing, how-to card, paused, ended ----
{
  const close = await (await browser.newContext({ viewport: { width: 400, height: 800 } })).newPage();
  close.on('pageerror', (e) => console.log('pageerror', e.message));
  await close.goto(url);
  await close.waitForFunction(() => window.__leadmate?.scene()?.sim);
  const cwait = (ms) => close.waitForTimeout(ms);
  const ccounts = () => close.evaluate(() => { const p = window.__leadmate.perf; return { wakes: p.wakes, frames: p.frames, steps: p.steps(), dom: p.domRenders, anims: p.animations() }; });
  const crate = async (ms = 2000) => {
    const a = await ccounts();
    await cwait(ms);
    const b = await ccounts();
    return { wakes: b.wakes - a.wakes, frames: b.frames - a.frames, steps: b.steps - a.steps, dom: b.dom - a.dom, anims: b.anims, sps: ((b.steps - a.steps) * 1000) / ms, wps: ((b.wakes - a.wakes) * 1000) / ms, dps: ((b.dom - a.dom) * 1000) / ms };
  };
  await close.evaluate(() => window.__leadmate.startStage({ type: 'start', seed: 1, scenario: { mode: 'close_exercise', controls: 'hand_drill', reward: 'treat' } }));
  await close.waitForSelector('#hd .go');
  await cwait(500);

  const card = await crate();
  console.log(`close, how-to card open: ${card.wakes} wakes, ${card.frames} frames, ${card.dom} renders, ${card.anims} animations`);
  ok('close card open: loop asleep (no wakes)', card.wakes === 0);
  ok('close card open: no frames drawn', card.frames === 0);
  ok('close card open: no simulation steps', card.steps === 0);
  ok('close card open: no DOM renders', card.dom === 0);
  ok('close card open: no running animation', card.anims === 0);

  await close.click('#hd .go');
  await cwait(500);
  const playing = await crate();
  console.log(`close, playing: ${playing.wps.toFixed(1)} wakes/s, ${playing.frames} frames, ${playing.sps.toFixed(1)} steps/s, ${playing.dps.toFixed(1)} renders/s, ${playing.anims} animations`);
  ok('close playing: at most 33 wakes/s', playing.wps <= 33);
  ok('close playing: no empty canvas frame drawn', playing.frames === 0);
  ok('close playing: simulation still steps at ~60/s', playing.sps > 50 && playing.sps < 70);
  ok('close playing: DOM view renders at most ~30/s', playing.dps > 20 && playing.dps <= 33);

  // a worked-up Dog makes the Gather button pulse: the one endless CSS animation left, and the counter must see it
  await close.evaluate(() => { window.__leadmate.scene().sim.arousal = 1000; });
  await cwait(500);
  ok('close playing: the button pulse runs when the Dog is worked up', (await ccounts()).anims > 0);

  // 2.3: the nudge and bob are not display-rate SVG animations; they move through the 30 Hz render path
  const svgAnims = await close.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('svg.bg')).length);
  ok('close playing: no running CSS animation inside the SVG scene', svgAnims === 0);
  const nudgeA = await close.evaluate(() => document.getElementById('hd-tempt').getAttribute('transform'));
  await cwait(400);
  const nudgeB = await close.evaluate(() => document.getElementById('hd-tempt').getAttribute('transform'));
  ok('close playing: the tempting hand still moves', nudgeA !== nudgeB);

  // 2.4: a frame with unchanged state and clock performs no DOM writes and no queries
  const idleFrame = await close.evaluate(() => {
    const sc = window.__leadmate.scene();
    const view = sc.view;
    const root = document.getElementById('hd');
    const T = performance.now();
    view.render(sc.sim, T); // settle every cached value for this state and clock
    let queries = 0;
    const qs = Element.prototype.querySelector, qa = Element.prototype.querySelectorAll, gi = Document.prototype.getElementById;
    Element.prototype.querySelector = function (...a) { queries++; return qs.apply(this, a); };
    Element.prototype.querySelectorAll = function (...a) { queries++; return qa.apply(this, a); };
    Document.prototype.getElementById = function (...a) { queries++; return gi.apply(this, a); };
    const obs = new MutationObserver(() => {});
    obs.observe(root, { subtree: true, attributes: true, childList: true, characterData: true });
    view.render(sc.sim, T);
    const writes = obs.takeRecords().length;
    obs.disconnect();
    Element.prototype.querySelector = qs; Element.prototype.querySelectorAll = qa; Document.prototype.getElementById = gi;
    return { writes, queries };
  });
  ok('close playing: an unchanged frame writes nothing to the DOM', idleFrame.writes === 0);
  ok('close playing: an unchanged frame runs no querySelector', idleFrame.queries === 0);

  await close.evaluate(() => window.postMessage(JSON.stringify({ type: 'pause' }), '*'));
  await cwait(400);
  const cpaused = await crate();
  console.log(`close, paused: ${cpaused.wakes} wakes, ${cpaused.frames} frames, ${cpaused.dom} renders, ${cpaused.anims} animations`);
  ok('close paused: loop asleep', cpaused.wakes === 0);
  ok('close paused: no frames drawn', cpaused.frames === 0);
  ok('close paused: no DOM renders', cpaused.dom === 0);
  ok('close paused: no running animation', cpaused.anims === 0);

  await close.evaluate(() => window.postMessage(JSON.stringify({ type: 'resume' }), '*'));
  await cwait(500);
  const resumed = await crate(1000);
  ok('close resumed: renders and animations run again', resumed.dps > 20 && resumed.anims > 0);

  // ended: force the end of the exercise, then nothing repeats
  await close.evaluate(() => {
    const sc = window.__leadmate.scene();
    sc.sim.time = 1e6;
    sc.sim.config.maxSeconds = 1;
  });
  await close.waitForFunction(() => window.__leadmate.scene().isEnded, null, { timeout: 15000 }).catch(() => {});
  if (await close.evaluate(() => window.__leadmate.scene().isEnded)) {
    await cwait(2500); // the result hold, then the loop sleeps
    const cended = await crate();
    console.log(`close, ended: ${cended.wakes} wakes, ${cended.frames} frames, ${cended.dom} renders, ${cended.anims} animations`);
    ok('close ended: loop asleep', cended.wakes === 0);
    ok('close ended: no frames drawn', cended.frames === 0);
    ok('close ended: no DOM renders', cended.dom === 0);
    ok('close ended: no running animation', cended.anims === 0);
  } else console.log('SKIP close ended (could not end the exercise quickly)');
  await close.close();
}

await browser.close();
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
