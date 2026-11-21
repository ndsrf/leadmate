import * as path from 'path';
import { defaultScenario, type ScenarioConfig } from './config';
import { buildPayload, handlingScore } from './payload';
import { FEEDBACK_ACTION_KINDS, STARTING_KINDS } from './feedbackKinds';
import { FeedbackDecider } from '../hud/feedback';
import { starsFor } from '../shell/stars';
import { twoMetersScenario } from '../../test/twoMetersScenario';
import { createState, isDogLooking, tick, type SimInput, type SimState } from './sim';
import { loadPackFromDisk } from '../shell/content/loader';
import { resolvePack } from '../shell/content/resolver';

const ALL_KINDS = Object.keys(FEEDBACK_ACTION_KINDS);

/**
 * Scripted player driving movement along waypoints, stopping when fixated,
 * marking check-ins within the reward window, and triggering turns and sniffs.
 */
function testPlayer(config: ScenarioConfig) {
  let lookStart: number | null = null;
  let rewardEnd = -1;
  let n = 0;
  let pressAt = -1;
  return (s: SimState): SimInput => {
    const looking = isDogLooking(s);
    if (looking && lookStart === null) {
      lookStart = s.time;
      n += 1;
      pressAt = s.time + 0.3;
    }
    if (!looking && lookStart !== null) {
      lookStart = null;
    }
    if (s.rewardWindow && rewardEnd !== s.rewardWindow.closesAt) {
      rewardEnd = s.rewardWindow.closesAt;
      pressAt = s.rewardWindow.openedAt + 0.2;
    }
    const marker = pressAt > 0 && s.time >= pressAt;
    if (marker) pressAt = -1;

    // Alternate directions to create followed turns and movement changes
    const stepIdx = Math.round(s.time / config.fixedStep);
    const angle = (Math.floor(stepIdx / 60) % 4) * (Math.PI / 2);
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };

    return {
      direction,
      strength: 0.6,
      marker,
      cue: s.dogMode === 'fixated' && (config.cues?.length ?? 0) > 0,
      cueType: config.cues?.[0],
      sniff: stepIdx % 90 === 0,
    };
  };
}

function runStageWithDecider(
  seed: number,
  config: ScenarioConfig,
  introducedKinds: readonly string[],
  steps: number = 300,
) {
  const sim = createState(seed, config);
  const decider = new FeedbackDecider({ introducedKinds });
  const player = testPlayer(config);
  const feedbackMessages = [];

  for (let i = 0; i < steps; i++) {
    const input = player(sim);
    const events = tick(sim, input, config.fixedStep);
    const msg = decider.step({ time: sim.time, events });
    if (msg) feedbackMessages.push(msg);
  }

  const payload = buildPayload(sim);
  const score = handlingScore(payload);
  return { sim, payload, score, feedbackMessages };
}

describe('Requirement: Introductions never change the Stage', () => {
  describe('Scenario: Same seed, different Introduced sets', () => {
    it('produces identical debrief payloads, meter values and handling score with only the starting set and with every kind Introduced in twoMetersScenario', () => {
      const seed = 42;
      const config = twoMetersScenario;

      const starting = runStageWithDecider(seed, config, STARTING_KINDS);
      const all = runStageWithDecider(seed, config, ALL_KINDS);

      // Decider with all kinds sees more feedback kinds than starting set
      expect(all.feedbackMessages.length).toBeGreaterThanOrEqual(starting.feedbackMessages.length);

      // Simulation meter values are identical
      expect(starting.sim.meters).toBeDefined();
      expect(starting.sim.meters).toEqual(all.sim.meters);

      // Debrief payloads are byte-for-byte identical
      expect(starting.payload).toEqual(all.payload);

      // Handling scores and earned stars are identical
      expect(starting.score).toBe(all.score);
      expect(starsFor(starting.score)).toBe(starsFor(all.score));
    });

    it('produces identical debrief payloads, meter values and handling score with only the starting set and with every kind Introduced in park-unpredictable', () => {
      const betaPack = loadPackFromDisk(path.join(__dirname, '..', '..', 'content', 'beta'));
      const resolved = resolvePack(betaPack, 'es');
      const parkNode = resolved.nodes.find((n) => n.id === 'park-unpredictable')!;
      expect(parkNode).toBeDefined();

      const seed = 123;
      const config: ScenarioConfig = {
        ...defaultScenario,
        ...parkNode.simulation.scenario,
      };

      const starting = runStageWithDecider(seed, config, STARTING_KINDS, 250);
      const all = runStageWithDecider(seed, config, ALL_KINDS, 250);

      // Debrief payloads (including scentWalk timeline, telemetry, meters, handling score) are identical
      expect(starting.payload).toEqual(all.payload);
      expect(starting.score).toBe(all.score);
      expect(starting.sim.meters).toEqual(all.sim.meters);
      expect(starsFor(starting.score)).toBe(starsFor(all.score));
    });
  });
});
