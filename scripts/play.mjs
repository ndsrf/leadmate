// Plays the standalone page with the keyboard in headless Chrome and checks the Stage behaves as specced.
// Usage: node scripts/play.mjs [url] [outDir]
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? '/tmp';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(url);
await page.waitForFunction(() => window.__leadmate?.scene()?.sim);

const sim = (f) => page.evaluate(`(${f})(window.__leadmate.scene().sim)`);
const waitFor = (cond, timeout = 240000) => page.waitForFunction(`(${cond})(window.__leadmate.scene().sim)`, null, { timeout, polling: 50 });
const log = (label, v) => console.log(label.padEnd(28), JSON.stringify(v));

// walk forward: the Dog outpaces a walk, so the leash goes Taut
await page.keyboard.down('w');
await waitFor((s) => s.time > 6);
log('walking', await sim((s) => ({ t: +s.time.toFixed(1), ratio: +s.ratio.toFixed(2), tension: s.tension, hx: +s.handler.x.toFixed(1) })));
await page.screenshot({ path: `${out}/play-taut.png` });

// Poste: release and the Handler locks
await page.keyboard.up('w');
const before = await sim((s) => s.handler.x);
await page.waitForTimeout(600);
log('poste', await sim((s) => ({ ratio: +s.ratio.toFixed(3), tension: s.tension, moved: false })));
const after = await sim((s) => s.handler.x);
log('handler locked', before === after);
await page.screenshot({ path: `${out}/play-poste.png` });

// quick key (2) moves faster than walk: Slack at the start of a catch-up
await page.keyboard.down('2');
await page.waitForTimeout(1500);
log('quick', await sim((s) => ({ tension: s.tension, ratio: +s.ratio.toFixed(2) })));
await page.keyboard.up('2');

// walk on until the skateboarder triggers the Fixation, then stand still and mark at Disengagement
await page.keyboard.down('w');
await waitFor((s) => s.dogMode === 'fixated');
await page.keyboard.up('w');
log('fixation', await sim((s) => ({ t: +s.time.toFixed(1), mode: s.dogMode })));
await page.screenshot({ path: `${out}/play-fixation.png` });
await waitFor((s) => s.rewardWindow !== null);
await page.waitForTimeout(150);
await page.keyboard.press('Space');
await waitFor((s) => s.telemetry.hitAccuraciesMs.length + s.telemetry.markerMisses > 0, 10000);
log('marker', await sim((s) => ({ hits: s.telemetry.hitAccuraciesMs, misses: s.telemetry.markerMisses, mode: s.dogMode })));
await page.screenshot({ path: `${out}/play-hit.png` });

// finish: quick all the way to the waypoint
await page.keyboard.down('2');
await page.waitForSelector('.lm-overlay', { timeout: 240000 });
await page.keyboard.up('2');
log('results', await page.evaluate(() => document.querySelector('.lm-card').innerText.replace(/\n/g, ' | ')));
await page.screenshot({ path: `${out}/play-results.png` });
await browser.close();
