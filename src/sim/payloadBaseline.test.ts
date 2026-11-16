import * as fs from 'fs';
import * as path from 'path';
import { ALL_NODES } from '../shell/nodes/content';
import { loadPackFromDisk } from '../shell/content/loader';
import { resolvePack } from '../shell/content/resolver';
import { generateDailyStage } from '../shell/daily';
import { tasteScenario } from '../shell/onboarding/taste';
import { defaultScenario, requiredCue, type ScenarioConfig } from './config';
import { routeWalker, runScripted } from './harness';
import { activeDistractor, isDogLooking, type SimInput, type SimState } from './sim';

/**
 * Seeded payloads of every existing walking scenario, captured before in-stage-feedback, must not
 * change apart from additive fields. Regenerate only on purpose: `UPDATE_PAYLOAD_BASELINE=1 npx jest payloadBaseline`.
 */
const FIXTURE = path.join(__dirname, '__fixtures__', 'payloadBaseline.json');
/** Fields added after the baseline was captured; everything else must match byte for byte. */
const ADDITIVE_FIELDS = ['markGrades'];

/**
 * Walks the route, stands for a fixated Dog and Cues it, and presses the Marker around windows in
 * turn: early in a window, late in it, and just after it closed, so every Marker path is taken.
 */
function player(config: ScenarioConfig) {
  const walk = routeWalker(config);
  let lookStart: number | null = null;
  let lookEnd = -1;
  let rewardEnd = -1;
  let n = 0;
  let pressAt = -1;
  return (s: SimState): SimInput => {
    const { direction, strength } = walk(s);
    const stand = s.dogMode === 'fixated' || s.dogMode === 'holding';
    const wanted = requiredCue(activeDistractor(s));
    const looking = isDogLooking(s);
    if (looking && lookStart === null) {
      lookStart = s.time;
      n += 1;
      pressAt = [s.time + 0.2, s.time + 0.7, -1][n % 3];
    }
    if (!looking && lookStart !== null) {
      lookStart = null;
      lookEnd = s.time;
      if (n % 3 === 2) pressAt = lookEnd + 0.4;
    }
    if (s.rewardWindow && rewardEnd !== s.rewardWindow.closesAt) {
      rewardEnd = s.rewardWindow.closesAt;
      n += 1;
      pressAt = n % 2 === 0 ? s.rewardWindow.openedAt + 0.25 : rewardEnd + 0.3;
    }
    const marker = pressAt > 0 && s.time >= pressAt;
    if (marker) pressAt = -1;
    return {
      direction,
      strength: stand ? 0 : strength,
      marker,
      cue: s.dogMode === 'fixated' && config.cues.length > 0,
      cueType: config.cues.includes(wanted) ? wanted : config.cues[0],
      sniff: Math.round(s.time / config.fixedStep) % 120 === 0,
    };
  };
}

function scenarios(): [string, ScenarioConfig][] {
  const nodes = ALL_NODES.filter((n) => n.mode === 'stage').map((n): [string, ScenarioConfig] => [n.id, { ...defaultScenario, ...n.simulation.scenario }]);
  const daily = ['2026-01-01', '2026-05-17', '2026-12-31'].map((d): [string, ScenarioConfig] => [`daily-${d}`, generateDailyStage(d)]);
  return [['default', defaultScenario], ['taste', tasteScenario], ...nodes, ...daily];
}

/** Stage scenarios of each content channel on disk, so authored beta content is guarded too. */
function channelScenarios(): [string, ScenarioConfig][] {
  const out: [string, ScenarioConfig][] = [];
  for (const channel of ['stable', 'beta']) {
    const nodes = resolvePack(loadPackFromDisk(path.join(__dirname, '..', '..', 'content', channel)), 'es').nodes;
    for (const n of nodes) {
      if (n.mode !== 'stage') continue;
      out.push([`${channel}/${n.id}`, { ...defaultScenario, ...n.simulation.scenario }]);
    }
  }
  return out;
}

function payloads(list: [string, ScenarioConfig][] = scenarios()): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [id, config] of list) {
    for (const seed of [1, 7]) {
      const { payload } = runScripted(seed, player(config), config, 240);
      const rest: Record<string, unknown> = { ...payload };
      for (const f of ADDITIVE_FIELDS) delete rest[f];
      out[`${id}#${seed}`] = rest;
    }
  }
  return out;
}

describe('payload baseline of existing scenarios', () => {
  it('is unchanged apart from additive fields', () => {
    const now = payloads();
    if (process.env.UPDATE_PAYLOAD_BASELINE === '1') {
      fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
      fs.writeFileSync(FIXTURE, JSON.stringify(now, null, 1) + '\n');
    }
    const baseline = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    expect(Object.keys(now).length).toBeGreaterThan(20);
    expect(JSON.stringify(now)).toBe(JSON.stringify(baseline));
  });

  /** Captured on the integration branch before scent walks; every Stage of every channel without Scent Spots must match. */
  it('is byte-identical for every Stage of every content channel', () => {
    const file = path.join(__dirname, '__fixtures__', 'payloadBaselineChannels.json');
    const now = payloads(channelScenarios());
    if (process.env.UPDATE_PAYLOAD_BASELINE === '1') fs.writeFileSync(file, JSON.stringify(now, null, 1) + '\n');
    const baseline = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(Object.keys(now).length).toBeGreaterThan(20);
    expect(JSON.stringify(now)).toBe(JSON.stringify(baseline));
  });
});
