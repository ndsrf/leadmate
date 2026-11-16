// Authoring helper for World 6 content release 1: writes the scenario part of park-nose-on, park-unpredictable and
// park-keep-fresh (node.yaml) from the park-unpredictable base, with Scent Spots on scenery and Stage Meters.
// The tuning values (meter targets, scentWalk overrides) live in TUNING below; scripts/tune-scent-nodes.mjs checks them.
// Run: node scripts/gen-scent-nodes.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const dir = join(import.meta.dirname, '../content/beta/nodes');
const base = YAML.parse(readFileSync(join(dir, 'park-unpredictable/node.yaml'), 'utf8'));
const spot = (type, x, y, strength) => ({ type, pos: { x, y }, scent: { strength } });
const FAR = base.simulation.scenario.scenery.filter((i) => !i.scent); // park dressing, far from the route

export const TUNING = {
  'park-nose-on': { nose: 110 },
  'park-unpredictable': { nose: 60, connection: 45 },
  'park-keep-fresh': { nose: 60, connection: 120 },
};

const route = {
  // gentle S-curve, 70 m
  'park-nose-on': [[14, 2], [28, -2], [42, 2], [56, -2], [70, 0]],
  'park-unpredictable': [[14, 0], [24, 14], [34, -2], [46, 14], [56, -2], [66, 12]],
  'park-keep-fresh': [[12, 6], [24, -4], [36, 8], [48, -4], [60, 8], [72, 0]],
};
/** A Scent Spot on a scenery item `at` metres along the route, `side` (+1 left, -1 right) of it by `OFFSET` metres. */
const OFFSET = 2.7;
function along(id, at, side, type, strength) {
  const pts = [[0, 0], ...route[id]];
  let left = at;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    if (left <= len || i === pts.length - 1) {
      const t = left / len;
      const [dx, dy] = [(bx - ax) / len, (by - ay) / len];
      const x = ax + (bx - ax) * t - dy * OFFSET * side;
      const y = ay + (by - ay) * t + dx * OFFSET * side;
      return spot(type, Math.round(x * 10) / 10, Math.round(y * 10) / 10, strength);
    }
    left -= len;
  }
}
const layout = {
  'park-nose-on': [[9, 1, 'lamp_post', 'weak'], [21, -1, 'bush', 'normal'], [33, 1, 'bin', 'weak'], [45, -1, 'lamp_post', 'normal'], [57, 1, 'bush', 'weak'], [68, -1, 'bin', 'normal']],
  'park-unpredictable': [[10, -1, 'lamp_post', 'normal'], [28, 1, 'bush', 'normal'], [46, -1, 'bin', 'normal'], [64, 1, 'lamp_post', 'normal'], [82, -1, 'bush', 'normal'], [100, 1, 'bin', 'normal']],
  'park-keep-fresh': [[10, 1, 'lamp_post', 'normal'], [26, -1, 'bush', 'normal'], [42, 1, 'bin', 'normal'], [58, -1, 'lamp_post', 'normal'], [74, 1, 'bush', 'normal'], [90, -1, 'bin', 'normal']],
};
const spots = Object.fromEntries(Object.entries(layout).map(([id, l]) => [id, l.map(([at, side, type, strength]) => along(id, at, side, type, strength))]));
const meters = {
  'park-nose-on': (t) => [{ id: 'nose', labelKey: 'meter.nose', icon: 'nose', target: t.nose, meterPoints: { 'granted-sniff': 20 } }],
  'park-unpredictable': (t) => [
    { id: 'nose', labelKey: 'meter.nose', icon: 'nose', target: t.nose, meterPoints: { 'granted-sniff': 10 } },
    { id: 'connection', labelKey: 'meter.connection', icon: 'eye', target: t.connection, meterPoints: { 'check-in-after-change': 15 } },
  ],
  'park-keep-fresh': (t) => [
    { id: 'nose', labelKey: 'meter.nose', icon: 'nose', target: t.nose, meterPoints: { 'granted-sniff': 10 } },
    { id: 'connection', labelKey: 'meter.connection', icon: 'eye', target: t.connection, meterPoints: { 'fresh-move': 15, chain: 30 } },
  ],
};
const prerequisites = { 'park-nose-on': ['park-mix'], 'park-unpredictable': ['park-nose-on'], 'park-keep-fresh': ['park-unpredictable'] };

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
  sc.scenery = [...structuredClone(FAR), ...spots[id]];
  sc.meters = meters[id](TUNING[id]);
  sc.scentWalk = existing?.simulation.scenario.scentWalk ?? {};
  sc.cues = ['lets-go'];
  writeFileSync(file, YAML.stringify(node, { lineWidth: 0 }));
}
