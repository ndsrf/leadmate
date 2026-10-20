// End-to-end walk through the engagement features in the web shell (headless Chrome): World
// progression, the Harness Ritual and Doorbell Mat minigames, Walk Diary and the Streak flame,
// and the Daily Stage with its replay. Needs `npm run sim:dev` and `npm run web`.
// Usage: node scripts/playtest.mjs [url] [outDir] [width] [height]
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:8099';
const out = process.argv[3] ?? '/tmp';
const [w, h] = [Number(process.argv[4] ?? 900), Number(process.argv[5] ?? 700)];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600, isMobile: w < 600 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
let failed = 0;
const ok = (name, value) => {
  if (!value) failed++;
  console.log(value ? 'PASS' : 'FAIL', name);
};
const text = () => page.innerText('body');
const record = () => page.evaluate(() => JSON.parse(localStorage.getItem('leadmate.dog')));
const home = async () => {
  await page.waitForSelector('text=Lecciones', { timeout: 60000 });
};
const frame = async () => {
  await page.waitForFunction(() => window.frames.length > 0);
  const f = page.frames().find((x) => x !== page.mainFrame());
  await f.waitForFunction(() => window.__leadmate?.scene()?.sim?.time >= 0, null, { timeout: 60000 });
  return f;
};
const today = await page.evaluate(() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
});

await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await home();

// -- World progression: a new Dog sees World 1 open and the rest locked
let body = await text();
ok('World 1 is open with its three Nodes', body.includes('Mundo 1 · Casa y umbrales') && body.includes('El ritual del arnés') && body.includes('La alfombra del timbre') && body.includes('Práctica: el Poste'));
ok('World 2 shows as locked, its Nodes hidden', body.includes('Completa el mundo anterior para abrir este.') && !body.includes('La esquina ciega'));
ok('streak banner invites to start', body.includes('Haz una lección hoy para empezar tu racha.'));
await page.screenshot({ path: `${out}/home-new.png`, fullPage: false });

// -- Harness Ritual: hold while the Dog settles, three rounds
await page.click('text=Mundo 1 · El ritual del arnés');
for (let i = 0; i < 4; i++) await page.click('text=Siguiente');
await page.waitForSelector('text=Pregunta rápida');
await page.click('text=Cuando se queda quieto');
await page.click('text=Empezar');
for (let round = 0; round < 6 && !(await text()).includes('Resultados del paseo'); round++) {
  const hold = await page.getByRole('button', { name: 'Mantén pulsado para esperar' }).boundingBox({ timeout: 2000 }).catch(() => null);
  if (!hold) break;
  await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2800);
  await page.mouse.up();
  await page.waitForTimeout(500);
}
await page.waitForSelector('text=Resultados del paseo', { timeout: 10000 });
ok('Harness Ritual Debrief shows a minigame result', (await text()).includes('Postes que calmaron al perro'));

// -- Walk Diary on the Debrief: one tap, logged with date and Node
const debriefText = await text();
ok('Debrief offers the three diary answers', ['¡Conseguido!', 'Costó un poco', 'Hoy no pudimos'].every((t) => debriefText.includes(t)));
await page.screenshot({ path: `${out}/debrief-diary.png` });
await page.click('text=Costó un poco');
await page.waitForSelector('text=Anotado en tu diario.');
let r = await record();
ok('diary entry stored with date and Node', r.walkDiary.length === 1 && r.walkDiary[0].date === today && r.walkDiary[0].nodeId === 'harness-ritual' && r.walkDiary[0].outcome === 'struggled');
ok('Streak is 1 after the first activity', r.streak.current === 1 && r.streak.lastActiveDate === today);
await page.click('text=Continuar');
await home();
body = await text();
ok('Streak flame and counter on the home banner', body.includes('1 día seguido'));
await page.screenshot({ path: `${out}/home-streak.png` });

// -- Doorbell Mat: mark when the Dog calms
await page.click('text=Mundo 1 · La alfombra del timbre');
for (let i = 0; i < 4; i++) await page.click('text=Siguiente');
await page.waitForSelector('text=Pregunta rápida');
await page.click('text=Cuando se calma sobre la alfombra');
await page.click('text=Empezar');
for (let round = 0; round < 3; round++) {
  await page.waitForFunction(() => document.body.innerText.includes('Se está calmando'), null, { timeout: 15000, polling: 30 });
  await page.getByRole('button', { name: 'Marcar' }).click();
  await page.waitForTimeout(300);
}
await page.waitForSelector('text=Resultados del paseo', { timeout: 10000 });
ok('Doorbell Mat Debrief shows the timing result', (await text()).includes('Marcas a tiempo'));
await page.screenshot({ path: `${out}/debrief-doorbell.png` });
await page.click('text=Continuar');
await home();

// -- finishing World 1 opens World 2 (the Poste practice is the third Node)
r = await record();
await page.evaluate((rec) => localStorage.setItem('leadmate.dog', JSON.stringify({ ...rec, completedNodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'] })), r);
await page.reload();
await home();
body = await text();
ok('World 2 opens once World 1 is complete', body.includes('La esquina ciega') && body.includes('Paseo con distracción'));
ok('only Worlds 3 and 4 are still locked', (body.match(/Completa el mundo anterior para abrir este\./g) ?? []).length === 2);
ok('World 3 is still locked, its Nodes hidden', body.includes('Mundo 3 · Rutas urbanas') && !body.includes('Mundo 3 · Déjalo'));
await page.screenshot({ path: `${out}/home-world2.png` });

// -- a walking Node: Debrief with the diary and the new score rows
await page.click('text=Paseo con distracción');
for (let i = 0; i < 4; i++) await page.click('text=Siguiente');
await page.waitForSelector('text=Pregunta rápida');
await page.click('text=En el instante en que deja de fijarse');
let f = await frame();
const sim = (fn) => f.evaluate(`(${fn})(window.__leadmate.scene().sim)`);
ok('World 2 Stage has scenery and the Go Sniff world', await sim((s) => s.config.scenery.length >= 8 && s.config.world >= 2));
await f.evaluate(() => { const s = window.__leadmate.scene().sim; s.handler = { x: 89, y: 0 }; s.dog = { x: 89.5, y: 0 }; });
await page.waitForSelector('text=Resultados del paseo', { timeout: 15000 });
ok('Stage Debrief shows the handling score', (await text()).includes('Puntuación del paseo') && (await text()).includes('de 1000'));
await page.click('text=¡Conseguido!');
await page.click('text=Continuar');
await home();

// -- Daily Stage: straight to the walk, scored, replayable, streak credited once
await page.click('text=Jugar');
f = await frame();
ok('Daily Stage skips Primer and Checkpoint and has a Distractor schedule', await sim((s) => s.config.moreDistractors.length >= 2));
const first = await sim((s) => JSON.stringify([s.config.waypoints, s.config.walls, s.config.moreDistractors.map((d) => d.path)]));
await page.screenshot({ path: `${out}/daily-stage.png` });
await f.evaluate(() => { const s = window.__leadmate.scene().sim; const e = s.config.waypoint; s.handler = { x: e.x, y: e.y }; s.dog = { x: e.x + 0.5, y: e.y }; });
await page.waitForSelector('text=Resultado del Paseo del Día', { timeout: 15000 });
body = await text();
ok('Daily result shows the 0-1000 score and no campaign progress', body.includes('de 1000') && body.includes('no cambia lo aprendido'));
await page.screenshot({ path: `${out}/daily-result.png` });
r = await record();
const best1 = r.dailyBest[today];
ok('Daily best stored for today', Number.isInteger(best1) && best1 >= 0 && best1 <= 1000);
const nodesBefore = JSON.stringify(r.completedNodes);
const streak1 = r.streak.current;
await page.click('text=Repetir');
f = await frame();
const second = await sim((s) => JSON.stringify([s.config.waypoints, s.config.walls, s.config.moreDistractors.map((d) => d.path)]));
ok('Replay gets the identical Stage', first === second);
await f.evaluate(() => { const s = window.__leadmate.scene().sim; const e = s.config.waypoint; s.handler = { x: e.x, y: e.y }; s.dog = { x: e.x + 0.5, y: e.y }; });
await page.waitForSelector('text=Resultado del Paseo del Día', { timeout: 15000 });
r = await record();
ok('Replay keeps the best score and does not add to the Streak', r.dailyBest[today] >= best1 && r.streak.current === streak1);
ok('Daily leaves the campaign Nodes alone', JSON.stringify(r.completedNodes) === nodesBefore);
await page.click('text=Volver');
await home();
ok('Home shows the best Daily score of today', (await text()).includes('Mejor de hoy'));

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
