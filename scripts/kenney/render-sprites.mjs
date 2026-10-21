// Renders Kenney CC0 GLB models (Mini Characters, Cube Pets, Car Kit) to isometric sprites with the
// game's projection: 2:1 diamonds, +x of the world toward the upper right, +y toward the lower right.
// usage: node scripts/kenney/render-sprites.mjs <kenney-downloads-dir> <out-dir>
// The raw frames are then trimmed, shrunk and palette-quantised by pack-sprites.py.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error('usage: render-sprites.mjs <downloads> <out>');
fs.mkdirSync(out, { recursive: true });

const PPU = 35.36 * 2; // pixels per meter along a ground axis, drawn at 2x and shrunk afterwards
const SIZE = 320;
const ORIGIN = { x: 160, y: 230 }; // where the model's feet land in the frame

/** id, model, clip, frames (animation times in s), facings (degrees, 0 = +x), fit (what to scale to, in meters) */
const DIRS8 = [0, 45, 90, 135, 180, 225, 270, 315];
const AXES = [0, 90, 180, 270];
const LONG = [0, 45, 90, 135];
const MC = 'minich/Models/GLB format/character-';
const JOBS = [
  { id: 'handler', model: `${MC}male-a.glb`, clips: { idle: [0], walk: [0, 0.15, 0.3, 0.45] }, facings: DIRS8, fit: { height: 1.3 } },
  { id: 'handlerf', model: `${MC}female-b.glb`, clips: { idle: [0], walk: [0, 0.15, 0.3, 0.45] }, facings: DIRS8, fit: { height: 1.3 } },
  { id: 'dog', model: 'pets/Models/GLB format/animal-dog.glb', clips: { idle: [0], walk: [0, 0.12, 0.24, 0.36], run: [0, 0.15], eat: [0, 0.3] }, facings: DIRS8, fit: { height: 0.6 } },
  { id: 'jogger', model: `${MC}male-e.glb`, clips: { sprint: [0, 0.1, 0.2, 0.3] }, facings: DIRS8, fit: { height: 1.3 } },
  { id: 'rider', model: `${MC}female-a.glb`, clips: { idle: [0] }, facings: DIRS8, fit: { height: 1.3 } },
  { id: 'child', model: `${MC}male-f.glb`, clips: { walk: [0, 0.2] }, facings: DIRS8, fit: { height: 0.9 } },
  ...['sedan', 'suv', 'van', 'taxi'].map((m) => ({ id: `car_${m}`, model: `car/Models/GLB format/${m}.glb`, clips: { still: [0] }, facings: [0, 90], fit: { length: 3.4 } })),
  { id: 'lamp_post', model: 'roads/Models/GLB format/light-curved.glb', clips: { still: [0] }, facings: [0, 90], fit: { height: 3.4 } },
  { id: 'planter', model: 'sub/Models/GLB format/planter.glb', clips: { still: [0] }, facings: [0, 90], fit: { length: 1.3 } },
  { id: 'fence', model: 'sub/Models/GLB format/fence-low.glb', clips: { still: [0] }, facings: LONG, fit: { length: 3 } },
];

const types = { '.glb': 'model/gltf-binary', '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const page = `<!doctype html><script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<canvas id=c width=${SIZE} height=${SIZE}></canvas><script type=module>
const SIZE = ${SIZE};
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setClearColor(0, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-3, 6, 4); scene.add(sun);
const e = Math.PI / 6, D = 20, c = Math.cos(e) * Math.SQRT1_2;
const cam = new THREE.OrthographicCamera(-SIZE / 2 / ${PPU}, SIZE / 2 / ${PPU}, SIZE / 2 / ${PPU}, -SIZE / 2 / ${PPU}, 0.1, 100);
cam.position.set(-c * D, Math.sin(e) * D, c * D); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
const m = cam.matrixWorld.elements;
const r = new THREE.Vector3(m[0], m[1], m[2]), u = new THREE.Vector3(m[4], m[5], m[6]);
const shift = r.clone().multiplyScalar(-(${ORIGIN.x} - SIZE / 2) / ${PPU}).add(u.clone().multiplyScalar((${ORIGIN.y} - SIZE / 2) / ${PPU}));
cam.position.add(shift);
const loader = new GLTFLoader();
window.renderJob = async (job) => {
  const gltf = await new Promise((ok, no) => loader.load('/' + job.model, ok, undefined, no));
  const root = gltf.scene; const holder = new THREE.Group(); holder.add(root); scene.add(holder);
  const box = new THREE.Box3().setFromObject(root); const size = box.getSize(new THREE.Vector3());
  const k = job.fit.height ? job.fit.height / size.y : job.fit.length / Math.max(size.x, size.z);
  root.scale.setScalar(k); root.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(root); root.position.y -= b2.min.y; // feet on the ground
  root.position.x -= (b2.min.x + b2.max.x) / 2; root.position.z -= (b2.min.z + b2.max.z) / 2;
  const mixer = new THREE.AnimationMixer(root);
  const frames = [];
  for (const [clipName, times] of Object.entries(job.clips)) {
    const clip = gltf.animations.find((a) => a.name === (clipName === 'still' ? 'static' : clipName));
    if (!clip && clipName !== 'still') throw new Error(job.id + ': no clip ' + clipName);
    const action = clip ? mixer.clipAction(clip) : null; action?.play();
    times.forEach((t, i) => {
      mixer.setTime(t);
      for (const f of job.facings) {
        holder.rotation.y = Math.PI / 2 - (f * Math.PI) / 180;
        renderer.render(scene, cam);
        frames.push({ name: job.id + '_' + clipName + i + '_' + f, data: renderer.domElement.toDataURL('image/png') });
      }
    });
    action?.stop(); mixer.stopAllAction();
  }
  scene.remove(holder);
  return frames;
};
window.ready = true;
</script>`;

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') return void res.writeHead(200, { 'content-type': 'text/html' }).end(page);
  const file = path.join(src, url);
  if (!file.startsWith(path.resolve(src)) || !fs.existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(fs.readFileSync(file));
});
await new Promise((ok) => server.listen(0, ok));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const tab = await browser.newPage();
tab.on('pageerror', (e) => console.error('page error', e.message));
await tab.goto(`http://localhost:${server.address().port}/`);
await tab.waitForFunction('window.ready', null, { timeout: 60000 });
for (const job of JOBS) {
  const frames = await tab.evaluate((j) => window.renderJob(j), job);
  for (const f of frames) fs.writeFileSync(path.join(out, `${f.name}.png`), Buffer.from(f.data.split(',')[1], 'base64'));
  console.log(job.id, frames.length);
}
await browser.close();
server.close();
