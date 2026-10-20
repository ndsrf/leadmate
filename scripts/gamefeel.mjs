// Plays the game-feel path on web (World Map, Node, result, Daily, Settings) with UI sounds and haptics
// off and reduced motion on, and checks on every screen that nothing is clipped and nothing needs
// horizontal scrolling. Needs `npm run sim:dev` and `npm run web`.
// Usage: node scripts/gamefeel.mjs [url] [outDir] [width] [height]
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:8099';
const out = process.argv[3] ?? '/tmp';
const [w, h] = [Number(process.argv[4] ?? 320), Number(process.argv[5] ?? 700)];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w < 600, isMobile: w < 600 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
let failed = 0;
const ok = (name, value) => {
  if (!value) failed++;
  console.log(value ? 'PASS' : 'FAIL', name);
};
const text = () => page.innerText('body');

/** No horizontal scroll, and no visible text box poking out of the viewport. */
const layout = async (name) => {
  const bad = await page.evaluate(() => {
    const vw = window.innerWidth;
    const out = [];
    if (document.documentElement.scrollWidth > vw) out.push(`page scrolls horizontally (${document.documentElement.scrollWidth} > ${vw})`);
    for (const el of document.querySelectorAll('div[dir=auto], span[dir=auto]')) {
      if (!el.childNodes.length || !el.textContent?.trim()) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.left < -1 || r.right > vw + 1) out.push(`"${el.textContent.trim().slice(0, 30)}" is outside (${Math.round(r.left)}..${Math.round(r.right)})`);
    }
    return out;
  });
  ok(`${name}: nothing clipped at ${w} wide`, bad.length === 0);
  for (const b of bad.slice(0, 5)) console.log('   ', b);
  await page.screenshot({ path: `${out}/gamefeel-${w}-${name.replace(/\W+/g, '-')}.png` });
};
const frame = async () => {
  await page.waitForFunction(() => window.frames.length > 0);
  const f = page.frames().find((x) => x !== page.mainFrame());
  await f.waitForFunction(() => window.__leadmate?.scene()?.sim?.time >= 0, null, { timeout: 60000 });
  return f;
};

await page.goto(url);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('leadmate.dog', '{}'); // an existing Dog skips the first-run funnel
  localStorage.setItem('leadmate.ui', JSON.stringify({ sounds: false, haptics: false }));
});
await page.reload();
await page.waitForSelector('text=El Paseo del Día', { timeout: 60000 });
await page.waitForTimeout(500);
await layout('World Map');

// a Node: Poste practice Minigame, result
await page.click('text=Práctica: el Poste');
for (let i = 0; i < 4; i++) await page.click('text=Siguiente');
await page.waitForSelector('text=Pregunta rápida');
await layout('Checkpoint');
await page.click('text=Me detengo y espero');
await page.click('text=Empezar');
await layout('Minigame');
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
// reduced motion: the reveal starts at its end, so the rows and the buttons are there at once
ok('reduced motion shows the whole result at once', (await text()).includes('Continuar') && (await text()).includes('Para practicar en la vida real'));
ok('the result shows its star', (await text()).includes('★'));
await layout('Node result');
await page.click('text=Continuar');
await page.waitForSelector('text=El Paseo del Día');
ok('the completed Node keeps its star on the map', (await text()).includes('★'));
await layout('World Map after a Node');

// Daily Stage and its result
await page.click('text=El Paseo del Día');
const f = await frame();
await f.evaluate(() => {
  const s = window.__leadmate.scene().sim;
  const e = s.config.waypoint;
  s.handler = { x: e.x, y: e.y };
  s.dog = { x: e.x + 0.5, y: e.y };
});
await page.waitForSelector('text=Resultado del Paseo del Día', { timeout: 15000 });
await layout('Daily result');
await page.click('text=Volver');
await page.waitForSelector('text=El Paseo del Día');
ok('the Daily chip shows the best score', (await text()).includes(' de 1000'));

// Settings: sound and haptics toggles persist
await page.click('text=Ajustes');
await page.waitForSelector('text=Sonido y vibración');
await layout('Settings');
ok('Settings shows the sounds and haptics toggles', (await text()).includes('Sonidos de la interfaz') && (await text()).includes('Vibración al tocar'));
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('leadmate.ui')));
ok('sounds and haptics are still off', stored.sounds === false && stored.haptics === false);
await browser.close();
console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
