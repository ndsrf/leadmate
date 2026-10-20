// Drives the web shell through the Node loop: Poste practice Minigame, a walking Node with a Cue,
// pause/Resume, the Debrief, the settings screen and a Rusty Dog return. Needs `npm run sim:dev` and `npm run web`.
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:8099';
const out = process.argv[3] ?? '/tmp';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 900, height: 560 } });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
const ok = (name, value) => console.log(value ? 'PASS' : 'FAIL', name);
const text = () => page.innerText('body');

await page.goto(url);
await page.evaluate(() => localStorage.setItem('leadmate.dog', '{}')); // an existing Dog skips the first-run funnel
await page.reload();
await page.waitForSelector('text=El Paseo del Día', { timeout: 60000 });
ok('home lists the World 1 Nodes', (await text()).includes('Práctica: el Poste'));
ok('walking Node is behind World 1', (await text()).includes('Completa el mundo anterior para abrir este.'));
await page.click('text=Paseo con distracción');
ok('pressing it does not start it', !(await text()).includes('Pregunta rápida'));
await page.screenshot({ path: `${out}/home.png` });

// -- Poste practice: Primer, Checkpoint, Minigame, Debrief
await page.click('text=Práctica: el Poste');
for (let i = 0; i < 4; i++) await page.click('text=Siguiente');
await page.waitForSelector('text=Pregunta rápida');
ok('checkpoint shows a timer', (await text()).includes(' s'));
await page.screenshot({ path: `${out}/checkpoint.png` });
await page.click('text=Me detengo y espero');
await page.waitForSelector('text=Empezar');
await page.click('text=Empezar');
for (let round = 0; round < 6 && !(await text()).includes('Resultados del paseo'); round++) {
  const hold = await page.getByRole('button', { name: 'Mantén pulsado para parar' }).boundingBox({ timeout: 2000 }).catch(() => null);
  if (!hold) break;
  await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await page.waitForTimeout(600);
}
await page.waitForSelector('text=Resultados del paseo', { timeout: 10000 });
await page.waitForSelector('text=Continuar', { timeout: 10000 }); // the result is revealed step by step
ok('minigame Debrief has one exercise', (await text()).includes('Para practicar en la vida real'));
await page.screenshot({ path: `${out}/debrief-minigame.png` });
await page.click('text=Continuar');
await page.waitForSelector('text=El Paseo del Día');
ok('Poste practice completed, with its star', (await text()).includes('★'));
ok('walking Node still locked: World 2 opens only once World 1 is complete', (await text()).includes('Completa el mundo anterior para abrir este.'));
// finish World 1 (see playtest.mjs for the two other World 1 Minigames played for real)
const seeded = await page.evaluate(() => JSON.parse(localStorage.getItem('leadmate.dog')));
await page.evaluate((r) => localStorage.setItem('leadmate.dog', JSON.stringify({ ...r, completedNodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'] })), seeded);
await page.reload();
await page.waitForSelector('text=El Paseo del Día', { timeout: 60000 });
ok('walking Node unlocked', (await text()).includes('Paseo con distracción'));

// -- walking Node with a Cue
await page.click('text=Paseo con distracción');
for (let i = 0; i < 4; i++) await page.click('text=Siguiente');
await page.waitForSelector('text=Pregunta rápida');
await page.waitForTimeout(5600); // let the 5 s Checkpoint time out: feedback only
await page.waitForFunction(() => window.frames.length > 0);
let f = page.frames().find((x) => x !== page.mainFrame());
await f.waitForFunction(() => window.__leadmate?.scene()?.sim?.time >= 0, null, { timeout: 60000 });
const sim = (fn) => f.evaluate(`(${fn})(window.__leadmate.scene().sim)`);
ok('Stage started with the Dog snapshot', await sim((s) => s.config.learning.equipment === 'collar' && s.dogTraits.reactivityThreshold > 0));
await page.screenshot({ path: `${out}/stage.png` });
await page.waitForTimeout(500);
await f.evaluate(() => window.focus());
await page.keyboard.press('c');
await page.waitForTimeout(200);
ok('Cue key took effect', await sim((s) => s.lastCueAt >= 0));
await page.screenshot({ path: `${out}/stage-cue.png` });

// pause: the window loses focus, the Resume overlay appears and Stage time freezes
await f.evaluate(() => window.dispatchEvent(new Event('blur')));
await page.waitForSelector('text=Pausa', { timeout: 10000 });
const t1 = await sim((s) => s.time);
await page.waitForTimeout(400);
ok('paused, time frozen', t1 === (await sim((s) => s.time)));
await page.click('text=Continuar');
await page.waitForFunction(() => !document.body.innerText.includes('Pausa'));
await page.waitForTimeout(300);
ok('resumed, time runs', (await sim((s) => s.time)) > t1);
await f.evaluate(() => { const s = window.__leadmate.scene().sim; s.handler = { x: 89, y: 0 }; s.dog = { x: 89.5, y: 0 }; });
await page.waitForSelector('text=Resultados del paseo', { timeout: 10000 });
await page.waitForSelector('text=Continuar', { timeout: 10000 }); // the result is revealed step by step
const debrief = await text();
ok('Debrief shows peak Arousal text', debrief.includes('Cuánto se alteró tu perro'));
ok('Debrief says the Checkpoint was missed', debrief.includes('se acabó el tiempo'));
ok('Debrief explains Equipment as a trade-off', debrief.includes('compromiso'));
await page.screenshot({ path: `${out}/debrief-stage.png` });
await page.click('text=Continuar');

// -- settings
await page.click('text=Ajustes');
await page.waitForSelector('text=Equipo');
await page.click('text=Arnés en Y');
await page.screenshot({ path: `${out}/settings.png` });
await page.click('text=Cerrar');
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('leadmate.dog')));
ok('equipment stored', stored.equipment === 'harness');
ok('attributes stored after a Stage', stored.attributes.followChance !== undefined && stored.lastStageDate !== null);

// -- restart keeps the Dog; a Rusty Dog is offered a warm-up after 3 days away
stored.lastStageDate = new Date(Date.now() - 5 * 86400000).toISOString();
await page.evaluate((r) => localStorage.setItem('leadmate.dog', JSON.stringify(r)), stored);
await page.reload();
await page.waitForSelector('text=El Paseo del Día', { timeout: 60000 });
ok('Rusty Dog banner', (await text()).includes('Tu perro está oxidado'));
const before = await page.evaluate(() => localStorage.getItem('leadmate.dog'));
await page.screenshot({ path: `${out}/rusty.png` });
await page.click('text=Saltar');
ok('skipping says the Dog performs lower today', (await text()).includes('rinde algo menos'));
ok('absence changed nothing stored', before === (await page.evaluate(() => localStorage.getItem('leadmate.dog'))));

// the warm-up: a 40 s ungraded walk that restores full capacity and never changes the Dog
await page.reload();
await page.waitForSelector('text=Tu perro está oxidado', { timeout: 60000 });
const stored2 = await page.evaluate(() => localStorage.getItem('leadmate.dog'));
await page.click('text=Calentar (40 s)');
await page.waitForFunction(() => window.frames.length > 0);
f = page.frames().find((x) => x !== page.mainFrame());
await f.waitForFunction(() => window.__leadmate?.scene()?.sim?.time >= 0, null, { timeout: 60000 });
ok('warm-up has no Distractor and no Marks', await sim((s) => s.config.markBudget === 0 && s.config.endCondition.seconds >= 30 && s.config.endCondition.seconds <= 45));
await f.evaluate(() => { window.__leadmate.scene().sim.time = 41; });
await page.waitForSelector('text=El Paseo del Día', { timeout: 10000 });
ok('warm-up done: banner gone, Dog record unchanged', !(await text()).includes('Tu perro está oxidado') && stored2 === (await page.evaluate(() => localStorage.getItem('leadmate.dog'))));
await browser.close();
