// Seeded bot runs of the World 6 scent Nodes (rethink-unpredictable-walk-stage 6.4): plays each Node with a scripted
// "good" and a scripted "great" Handler over several seeds and reports the handling score and Stars, so Autopilot,
// Novelty and Stage Meter targets can be tuned without a phone. Good play must earn 2 Stars, great play 3, on at least 90% of seeds.
// Run: node scripts/tune-scent-nodes.mjs [--channel beta|stable] [--seeds 30] [node-id ...]
import { join } from 'node:path';
import createJITI from 'jiti';

const ROOT = join(import.meta.dirname, '..');
const jiti = createJITI(ROOT);
const { loadPackFromDisk } = jiti('./src/shell/content/loader.ts');
const { runScripted, routeDirection } = jiti('./src/sim/harness.ts');
const { isDogLooking, isGoSniffAvailable, noInput } = jiti('./src/sim/sim.ts');
const { starsFor } = jiti('./src/shell/stars.ts');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args.splice(i, 2)[1];
};
const channel = flag('--channel', 'beta');
const seeds = Number(flag('--seeds', 30));
const pack = loadPackFromDisk(join(ROOT, 'content', channel));
const ids = args.length > 0 ? args : ['park-nose-on', 'park-unpredictable', 'park-keep-fresh'];

/**
 * Handler skill. `reaction`: seconds between the Dog's look and the Marker press; `markChance`: share of looks marked;
 * `skip`: indices of the Scent Spots (in order met) that get no Go Sniff, `sniffDelay` s after the Dog comes within range; `changeEvery`: seconds of
 * steady walking before the next change (null: none); `varied`: cycles the six kinds instead of repeating one.
 */
export const HANDLERS = {
  good: { reaction: 0.7, markChance: 0.7, skip: [2, 5], sniffDelay: 1.5, changeEvery: 9, varied: false },
  great: { reaction: 0.2, markChance: 1, skip: [], sniffDelay: 0.3, changeEvery: 7, varied: true },
};
const CHANGES = ['left-turn', 'slow-down', 'right-turn', 'stop', 'speed-up', 'u-turn'];

/** A seeded-free (pure) scripted Handler for one run; the only randomness is a fixed hash of the look count. */
function handler(config, skill, changes) {
  const turnLeft = (d) => ({ x: -d.y, y: d.x });
  let look = { at: -1, decided: false, mark: false };
  let wasLooking = false;
  let looks = 0;
  let nextChange = skill.changeEvery ?? Infinity;
  let change = null;
  let changeCount = 0;
  let encounter = { spot: -1, since: 0, give: false };
  const share = (n, p) => ((n * 0.6180339887) % 1) < p; // deterministic spread of p over n
  return (s) => {
    const looking = isDogLooking(s);
    if (looking && !wasLooking) look = { at: s.time, decided: false, mark: false, n: ++looks };
    wasLooking = looking;
    let input = { ...noInput };
    // 1. a Go Sniff in progress: stand still
    if (s.sniff || s.dogMode === 'planted' || s.dogMode === 'marking') return input;
    // 2. the Marker on a look
    if (looking && !look.decided) {
      look.decided = true;
      look.mark = share(look.n, skill.markChance);
    }
    const sw = s.scentWalk;
        if (looking && look.mark && s.time - look.at >= skill.reaction) {
      look.mark = false;
      input.marker = true;
      return input;
    }
    // Go Sniff beside an unsniffed Scent Spot: decided once per spot, given after `sniffDelay` s in range
    const near = sw ? sw.spots.findIndex((p) => !p.sniffed && Math.hypot(p.pos.x - s.dog.x, p.pos.y - s.dog.y) <= p.radius) : -1;
    if (near !== encounter.spot) encounter = { spot: near, since: s.time, give: near >= 0 && !skill.skip.includes(near) };
    if (encounter.give && s.time - encounter.since >= skill.sniffDelay && isGoSniffAvailable(s)) {
      encounter.give = false;
      input.sniff = true;
      return input;
    }
    // 3. walking and changes
    const route = routeDirection(config, s.handler);
    let direction = route;
    let strength = 0.6;
    if (change && s.time >= change.until) change = null;
    if (!change && changes && s.time >= nextChange) {
      const kind = skill.varied ? CHANGES[changeCount % CHANGES.length] : 'right-turn';
      changeCount++;
      const seconds = kind === 'stop' ? 1.6 : kind === 'u-turn' ? 1.2 : 2;
      change = { kind, until: s.time + seconds };
      nextChange = s.time + seconds + skill.changeEvery;
    }
    if (change) {
      if (change.kind === 'left-turn') direction = turnLeft(route);
      else if (change.kind === 'right-turn') direction = { ...turnLeft(route), x: turnLeft(route).x * -1, y: turnLeft(route).y * -1 };
      else if (change.kind === 'u-turn') direction = { x: -route.x, y: -route.y };
      else if (change.kind === 'slow-down') strength = 0.25;
      else if (change.kind === 'speed-up') strength = 1;
      else if (change.kind === 'stop') strength = 0;
    }
    if (s.ratio >= 1) strength = Math.min(strength, 0.3);
    return strength === 0 ? input : { ...input, direction, strength };
  };
}

let failed = false;
for (const id of ids) {
  const scenario = pack.nodes[id].config.simulation.scenario;
  const changes = id !== 'park-nose-on';
  console.log(`\n${id}  meters: ${scenario.meters.map((m) => `${m.id} ${m.target}`).join(', ')}`);
  for (const [name, skill] of Object.entries(HANDLERS)) {
    const scores = [];
    const sniffs = [];
    for (let seed = 1; seed <= seeds; seed++) {
      const run = runScripted(seed, handler(scenario, skill, changes), scenario, 400);
      scores.push(run.payload.handlingScore);
      sniffs.push(run.payload.scentWalk?.sniffsGranted ?? 0);
    }
    const stars = scores.map(starsFor);
    const mean = scores.reduce((a, b) => a + b, 0) / seeds;
    const share = (n) => `${Math.round((100 * stars.filter((x) => x === n).length) / seeds)}%`;
    const want = name === 'good' ? 2 : 3;
    const ok = stars.filter((x) => x === want).length >= 0.9 * seeds;
    if (!ok) failed = true;
    console.log(`  ${name.padEnd(5)} score mean ${mean.toFixed(0)} (min ${Math.min(...scores)}, max ${Math.max(...scores)})  stars 1:${share(1)} 2:${share(2)} 3:${share(3)}  sniffs ${(sniffs.reduce((a, b) => a + b, 0) / seeds).toFixed(1)}  ${ok ? 'OK' : `want ${want} on 90% of seeds`}`);
  }
}
process.exit(failed ? 1 : 0);
