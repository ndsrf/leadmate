// Renders Kenney CC0 GLB models (Mini Characters, Cube Pets, Car Kit) to isometric sprites with the
// game's projection: 2:1 diamonds, +x of the world toward the upper right, +y toward the lower right.
// usage: node scripts/kenney/render-sprites.mjs <kenney-downloads-dir> <out-dir> [job-id ...]
// With no job ids it renders JOBS; with ids it renders only those, from JOBS and SPIKE_JOBS.
// The raw frames are then trimmed, shrunk and palette-quantised by pack-sprites.py.
// Models under `@models/` are read from scripts/kenney/models/ (committed with their LICENSE.txt), not the downloads.
// A clip can pose bones on top of the animation (`overrides`, see pose-overrides.mjs).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { clipPlan } from './pose-overrides.mjs';

const [src, out, ...only] = process.argv.slice(2);
if (!src || !out) throw new Error('usage: render-sprites.mjs <downloads> <out> [job-id ...]');
const MODELS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'models');
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

// readable-dog spike (openspec/changes/readable-dog, task 1.2): the Quaternius Husky, walking with the head turned
// back toward the Handler. Not in the shipped atlas; rendered only when asked for by id.
const RDOG_WALK = [0, 0.25, 0.5, 0.75];
// Head turned back over the Dog's left shoulder toward the Handler behind it (about 120 degrees), spread over the
// neck so it bends instead of snapping. On this rig a bone's local +z turns the head to the Dog's left.
const LOOK_BACK = [
  { bone: 'Neck1', rotate: [0, 0, 30] },
  { bone: 'Neck2', rotate: [0, 0, 30] },
  { bone: 'Neck3', rotate: [0, 0, 30] },
  { bone: 'Head', rotate: [0, 0, 30] },
];
// The Husky's coat materials (dark back, grey sides, light belly), lightened; its eyes and nose stay dark.
const RDOG_COAT = { Material: '#c9c4ba', 'Material.001': '#dedad2', 'Material.003': '#f6f4f0' };
const LOOK_BACK_R = LOOK_BACK.map((o) => ({ ...o, rotate: [0, 0, -o.rotate[2]] }));
const HEAD_DOWN = [{ bone: 'Neck1', rotate: [35, 0, 0] }, { bone: 'Neck2', rotate: [20, 0, 0] }, { bone: 'Head', rotate: [25, 0, 0] }];
const TAIL_HIGH = [{ bone: 'Tail1', rotate: [-35, 0, 0] }];
const TAIL_TUCKED = [{ bone: 'Tail1', rotate: [60, 0, 0] }, { bone: 'Tail2', rotate: [20, 0, 0] }];
const TROT = [0, 0.135, 0.27, 0.405];

// The shipped walking Dog (readable-dog, tasks 3.1): the Quaternius Husky, light-coated so the game's coat tint works.
// 30 frames per facing. Each clip bakes its own tail (Decision 4). Frame names are husky_<clip><n>_<facing>; the game
// maps the Canine Posture clip names (look_l, walk_wag, ...) by dropping the underscore (sprites.ts `huskyFrame`).
const WAG = (a) => [{ bone: 'Tail2', rotate: [0, 0, a] }, { bone: 'Tail3', rotate: [0, 0, a] }, { bone: 'Tail4', rotate: [0, 0, a] }];
// Side-on to the camera (45, 225) the head turn is weak: on the near side turn it further; on the far side the head
// hides behind the body, so lift the neck to bring it over the back.
const LIFT = [{ bone: 'Neck1', rotate: [-25, 0, 0] }, { bone: 'Neck2', rotate: [-20, 0, 0] }, { bone: 'Head', rotate: [-10, 0, 0] }];
const HUSKY = {
  id: 'husky', model: '@models/quaternius-husky/husky.glb', facings: DIRS8, fit: { height: 0.6 }, skinned: true, materials: RDOG_COAT,
  clips: {
    idle: { clip: 'Idle', times: [0, 1.6] },
    walk: { clip: 'Walk', times: RDOG_WALK },
    walkwag: { clip: 'Walk', times: RDOG_WALK, overrides: TAIL_HIGH, perFrame: [WAG(25), WAG(0), WAG(-25), WAG(0)] },
    trot: { clip: 'Gallop', times: TROT },
    sniffwalk: { clip: 'Walk', times: RDOG_WALK, overrides: HEAD_DOWN },
    sniff: { clip: 'Idle_2_HeadLow', times: [1, 2] },
    planted: { clip: 'Idle', times: [0, 1.6], overrides: TAIL_HIGH },
    mark: { clip: 'Idle', times: [0, 1.6], overrides: [{ bone: 'BackUpperLeg.L', rotate: [0, 0, 60] }] },
    lunge: { clip: 'Gallop', times: [0.1, 0.3], overrides: TAIL_TUCKED },
    lookl: { clip: 'Walk', times: [0, 0.5], overrides: LOOK_BACK, facingScale: { 225: 1.6 }, facingExtra: { 45: LIFT } },
    lookr: { clip: 'Walk', times: [0, 0.5], overrides: LOOK_BACK_R, facingScale: { 45: 1.6 }, facingExtra: { 225: LIFT } },
  },
};
JOBS.push(HUSKY);
// The head-turn clips without the side-on exaggeration, for the before/after in the contact sheet only.
const SPIKE_JOBS = [
  { ...HUSKY, id: 'huskyflat', clips: { lookl: { ...HUSKY.clips.lookl, facingScale: undefined, facingExtra: undefined }, lookr: { ...HUSKY.clips.lookr, facingScale: undefined, facingExtra: undefined } } },
  // task 1.3: a stand-in for the full clip set (Decision 4), 30 frames per direction, 240 in all, to measure the
  // atlas. The poses are rough; only their size and silhouette count here.
  { id: 'rdogest', model: '@models/quaternius-husky/husky.glb', facings: DIRS8, fit: { height: 0.6 }, skinned: true, materials: RDOG_COAT, clips: {
    idle: { clip: 'Idle', times: [0, 1.6] },
    walk: { clip: 'Walk', times: RDOG_WALK },
    walkwag: { clip: 'Walk', times: RDOG_WALK, overrides: TAIL_HIGH },
    trot: { clip: 'Gallop', times: TROT },
    sniffwalk: { clip: 'Walk', times: RDOG_WALK, overrides: HEAD_DOWN },
    sniff: { clip: 'Idle_2_HeadLow', times: [1, 2] },
    planted: { clip: 'Idle', times: [0, 1.6], overrides: TAIL_HIGH },
    mark: { clip: 'Idle', times: [0, 1.6], overrides: [{ bone: 'BackUpperLeg.L', rotate: [0, 0, 60] }] },
    lunge: { clip: 'Gallop', times: [0.1, 0.3], overrides: TAIL_TUCKED },
    lookl: { clip: 'Walk', times: [0, 0.5], overrides: LOOK_BACK },
    lookr: { clip: 'Walk', times: [0, 0.5], overrides: LOOK_BACK_R },
  } },
  { id: 'rdog', model: '@models/quaternius-husky/husky.glb', clips: { walk: { clip: 'Walk', times: RDOG_WALK }, walklook: { clip: 'Walk', times: RDOG_WALK, overrides: LOOK_BACK } }, facings: DIRS8, fit: { height: 0.6 }, skinned: true, materials: RDOG_COAT },
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
  // a skinned mesh's bounds come from its bone matrices, which are empty until the skeleton is updated
  const refresh = () => job.skinned && (root.updateMatrixWorld(true), root.traverse((o) => { if (o.isSkinnedMesh) { o.skeleton.update(); o.computeBoundingBox(); } }));
  refresh();
  // recolour named materials (a light coat, so the game's coat tint, which can only darken, works)
  if (job.materials) root.traverse((o) => {
    for (const mat of [o.material].flat()) {
      const want = mat && job.materials[mat.name];
      if (want) { mat.color.set(want); mat.metalness = 0; }
    }
  });
  const box = new THREE.Box3().setFromObject(root); const size = box.getSize(new THREE.Vector3());
  const k = job.fit.height ? job.fit.height / size.y : job.fit.length / Math.max(size.x, size.z);
  root.scale.setScalar(k); root.updateMatrixWorld(true); refresh();
  const b2 = new THREE.Box3().setFromObject(root); root.position.y -= b2.min.y; // feet on the ground
  root.position.x -= (b2.min.x + b2.max.x) / 2; root.position.z -= (b2.min.z + b2.max.z) / 2;
  const mixer = new THREE.AnimationMixer(root);
  const frames = [];
  for (const { name: clipName, source, times, overrides, byFacing, index = 0 } of job.plan) {
    const clip = gltf.animations.find((a) => a.name === source);
    if (!clip && source !== 'static') throw new Error(job.id + ': no clip ' + source);
    // a bone the clip does not animate keeps the last clip's pose; start every clip from the bind pose, as if rendered alone
    root.traverse((o) => { if (o.isSkinnedMesh) o.skeleton.pose(); });
    const action = clip ? mixer.clipAction(clip) : null; action?.play();
    const bind = (list) => list.map((o) => {
      const bone = root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(o.bone));
      if (!bone) throw new Error(job.id + ': no bone ' + o.bone);
      return [bone, new THREE.Quaternion(...o.quaternion)];
    });
    const base = bind(overrides);
    const own = Object.fromEntries(Object.entries(byFacing ?? {}).map(([f, list]) => [f, bind(list)])); // exaggerated for some facings
    times.forEach((t, i) => {
      mixer.setTime(t);
      for (const f of job.facings) {
        const bones = own[f] ?? base;
        const posed = bones.map(([bone, q]) => { const was = bone.quaternion.clone(); bone.quaternion.multiply(q); return was; });
        holder.rotation.y = Math.PI / 2 - (f * Math.PI) / 180;
        renderer.render(scene, cam);
        frames.push({ name: job.id + '_' + clipName + (index + i) + '_' + f, data: renderer.domElement.toDataURL('image/png') });
        for (let k = bones.length - 1; k >= 0; k--) bones[k][0].quaternion.copy(posed[k]); // undo last to first: a bone named twice must come back to the clip's pose, and must not add up
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
  const [base, rel] = url.startsWith('/@models/') ? [MODELS, url.slice('/@models'.length)] : [src, url];
  const file = path.join(base, rel);
  if (!file.startsWith(path.resolve(base)) || !fs.existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(fs.readFileSync(file));
});
await new Promise((ok) => server.listen(0, ok));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const tab = await browser.newPage();
tab.on('pageerror', (e) => console.error('page error', e.message));
await tab.goto(`http://localhost:${server.address().port}/`);
await tab.waitForFunction('window.ready', null, { timeout: 60000 });
const jobs = only.length ? [...JOBS, ...SPIKE_JOBS].filter((j) => only.includes(j.id)) : JOBS;
const missing = only.filter((id) => !jobs.some((j) => j.id === id));
if (missing.length) throw new Error('unknown job ' + missing.join(', '));
for (const job of jobs) {
  const frames = await tab.evaluate((j) => window.renderJob(j), { ...job, plan: clipPlan(job) });
  for (const f of frames) fs.writeFileSync(path.join(out, `${f.name}.png`), Buffer.from(f.data.split(',')[1], 'base64'));
  console.log(job.id, frames.length);
}
await browser.close();
server.close();
