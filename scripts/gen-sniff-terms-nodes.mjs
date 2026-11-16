// Authoring helper for World 6 content release 2: writes the scenario part of park-plant-mark and park-not-that-one
// (node.yaml) from the park-unpredictable base, with hot Scent Spots, marking posts, food by a bin and the Jackpot.
// The tuning values (meter targets, scentWalk overrides) live in TUNING below; scripts/tune-scent-nodes.mjs checks them.
// Run: node scripts/gen-sniff-terms-nodes.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const dir = join(import.meta.dirname, '../content/beta/nodes');
const base = YAML.parse(readFileSync(join(dir, 'park-unpredictable/node.yaml'), 'utf8'));
const FAR = base.simulation.scenario.scenery.filter((i) => !i.scent); // park dressing, far from the route

export const TUNING = {
  'park-plant-mark': { nose: 100, connection: 65 },
  'park-not-that-one': { nose: 70, connection: 60 },
};

const route = {
  'park-plant-mark': [[14, 0], [24, 14], [34, -2], [46, 14], [56, -2], [66, 12]],
  'park-not-that-one': [[12, 6], [24, -4], [36, 8], [48, -4], [60, 8], [72, 0]],
};
const OFFSET = 2.7;
/** A point `at` metres along the route, `side` (+1 left, -1 right) of it by OFFSET metres. */
function along(id, at, side) {
  const pts = [[0, 0], ...route[id]];
  let left = at;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (left <= len || i === pts.length - 1) {
      const t = left / len;
      const [dx, dy] = [(bx - ax) / len, (by - ay) / len];
      return {
        x: Math.round((ax + (bx - ax) * t - dy * OFFSET * side) * 10) / 10,
        y: Math.round((ay + (by - ay) * t + dx * OFFSET * side) * 10) / 10,
      };
    }
    left -= len;
  }
}
const spot = (id, [at, side, type, scent]) => ({ type, pos: along(id, at, side), scent });
// [metres along, side, scenery type, scent]: hot spots make the Dog Plant, `marking` posts make it mark
const layout = {
  'park-plant-mark': [
    [10, -1, 'lamp_post', { strength: 'normal', marking: true }],
    [26, 1, 'bin', { strength: 'hot' }],
    [42, -1, 'lamp_post', { strength: 'normal', marking: true }],
    [58, 1, 'bin', { strength: 'hot' }],
    [74, -1, 'bush', { strength: 'normal' }],
    [92, 1, 'lamp_post', { strength: 'normal', marking: true }],
  ],
  'park-not-that-one': [
    [10, 1, 'lamp_post', { strength: 'normal' }],
    [34, -1, 'bin', { strength: 'hot' }],
    [48, 1, 'lamp_post', { strength: 'normal', marking: true }],
    [62, -1, 'bush', { strength: 'normal' }],
    [82, 1, 'bin', { strength: 'normal' }],
  ],
};
// food by a bin (a stationary `food` Distractor): [metres along, side]
const foods = { 'park-not-that-one': [[22, 1], [72, -1]] };

const meters = {
  'park-plant-mark': (t) => [
    { id: 'nose', labelKey: 'meter.nose', icon: 'nose', target: t.nose, meterPoints: { 'waited-plant': 25, 'waited-marking': 20, 'granted-sniff': 10 } },
    { id: 'connection', labelKey: 'meter.connection', icon: 'eye', target: t.connection, meterPoints: { 'check-in-hit': 10 } },
  ],
  'park-not-that-one': (t) => [
    { id: 'nose', labelKey: 'meter.nose', icon: 'nose', target: t.nose, meterPoints: { 'granted-sniff': 10, 'leave-it-food': 25 } },
    { id: 'connection', labelKey: 'meter.connection', icon: 'eye', target: t.connection, meterPoints: { 'check-in-hit': 10, 'smart-jackpot': 20 } },
  ],
};
const prerequisites = { 'park-plant-mark': ['park-keep-fresh'], 'park-not-that-one': ['park-plant-mark'] };

for (const id of Object.keys(route)) {
  const file = join(dir, id, 'node.yaml');
  let existing = null;
  try { existing = YAML.parse(readFileSync(file, 'utf8')); } catch {}
  const node = existing ?? structuredClone(base);
  node.id = id;
  if (!existing) {
    node.checkpoint = [{}, {}, {}];
    node.exercises = [{ metric: 'tension', key: `node.${id}.exercise1` }, { metric: 'attention', key: `node.${id}.exercise2` }];
    node.primerCards = [{ kind: 'real-world', media: { type: 'image', url: '', art: `${id}-1` } }];
  }
  node.prerequisites = prerequisites[id];
  const sc = node.simulation.scenario;
  const pts = route[id].map(([x, y]) => ({ x, y }));
  sc.waypoints = pts;
  sc.waypoint = { ...pts[pts.length - 1] };
  const food = (foods[id] ?? []).map(([at, side]) => along(id, at, side));
  sc.scenery = [
    ...structuredClone(FAR),
    ...layout[id].map((l) => spot(id, l)),
    ...food.map((pos) => ({ type: 'bin', pos: { ...pos } })),
  ];
  sc.meters = meters[id](TUNING[id]);
  sc.scentWalk = existing?.simulation.scenario.scentWalk ?? {};
  if (food.length > 0) {
    sc.cues = ['lets-go', 'leave-it'];
    sc.jackpotBudget = 3;
    const mk = (pos, activateAfterMeters) => ({
      kind: 'food', speed: 0, triggerRadius: 6, activateAfterMeters, startOffset: 28, salience: 6,
      path: { from: { ...pos }, to: { ...pos } },
    });
    sc.distractor = mk(food[0], 12);
    sc.moreDistractors = food.slice(1).map((p) => mk(p, 50));
  } else {
    sc.cues = ['lets-go'];
    sc.moreDistractors = [];
  }
  mkdirSync(join(dir, id), { recursive: true });
  writeFileSync(file, YAML.stringify(node, { lineWidth: 0 }));
}
