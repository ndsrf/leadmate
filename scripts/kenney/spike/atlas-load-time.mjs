// readable-dog spike (task 1.3): time Phaser loading an atlas the way the Stage bundle does (a data URL inlined by
// vite-plugin-singlefile, then `this.load.atlas`), in headless Chromium, with and without CPU throttling.
// usage: node scripts/kenney/spike/atlas-load-time.mjs <label>=<dir with sprites.{png,json}> ... [--runs 15]
// It reports the median and worst time from `load.atlas` to the texture being ready (PNG decode + WebGL upload).
// Headless SwiftShader on a desktop CPU is only a stand-in for the phone; compare the two atlases, not the absolutes.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const runs = args.includes('--runs') ? Number(args[args.indexOf('--runs') + 1]) : 15;
const atlases = args.filter((a) => a.includes('=')).map((a) => {
  const [label, dir] = a.split('=');
  return { label, png: fs.readFileSync(path.join(dir, 'sprites.png')).toString('base64'), json: JSON.parse(fs.readFileSync(path.join(dir, 'sprites.json'), 'utf8')) };
});
if (!atlases.length) throw new Error('usage: atlas-load-time.mjs <label>=<dir> ... [--runs n]');
const phaser = createRequire(import.meta.url).resolve('phaser/dist/phaser.min.js');

const page = `<!doctype html><body style="margin:0"><script src="/phaser.js"></script><script>
window.timeLoad = (png, json) => new Promise((done) => {
  let t0 = 0;
  const game = new Phaser.Game({ type: Phaser.WEBGL, width: 360, height: 640, banner: false, audio: { noAudio: true },
    scene: { preload() { t0 = performance.now(); this.load.atlas('k', 'data:image/png;base64,' + png, json); },
             create() { const ms = performance.now() - t0; this.add.image(0, 0, 'k', Object.keys(json.frames)[0]); game.destroy(true); done(ms); } } });
});
window.ready = true;
</script>`;
const server = http.createServer((req, res) => {
  if (req.url === '/phaser.js') return void res.writeHead(200, { 'content-type': 'text/javascript' }).end(fs.readFileSync(phaser));
  res.writeHead(200, { 'content-type': 'text/html' }).end(page);
});
await new Promise((ok) => server.listen(0, ok));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const tab = await browser.newPage();
tab.on('pageerror', (e) => console.error('page error', e.message));
const cdp = await tab.context().newCDPSession(tab);
await tab.goto(`http://localhost:${server.address().port}/`);
await tab.waitForFunction('window.ready');
const stats = (xs) => { const s = [...xs].sort((a, b) => a - b); return `median ${s[s.length >> 1].toFixed(0)} ms, worst ${s[s.length - 1].toFixed(0)} ms`; };
for (const rate of [1, 4, 6]) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  for (const a of atlases) {
    await tab.evaluate(([p, j]) => window.timeLoad(p, j), [a.png, a.json]); // warm-up
    const ms = [];
    for (let i = 0; i < runs; i++) ms.push(await tab.evaluate(([p, j]) => window.timeLoad(p, j), [a.png, a.json]));
    console.log(`cpu x${rate} ${a.label}: ${stats(ms)} over ${runs} loads`);
  }
}
await browser.close();
server.close();
