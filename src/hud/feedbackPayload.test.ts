import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { createState, tick, type SimEvent, type SimInput, type SimState } from '../sim/sim';
import { buildPayload } from '../sim/payload';
import { defaultScenario, type ScenarioConfig } from '../sim/config';
import { routeDirection } from '../sim/harness';
import { FeedbackDecider } from './feedback';

/** in-stage-feedback 5.1: deciding Feedback Messages every tick never changes the seeded payload. */
function run(seed: number, config: ScenarioConfig, withFeedback: boolean) {
  const state: SimState = createState(seed, config);
  const decider = withFeedback ? new FeedbackDecider({ seenKinds: [], isTasteStage: false }) : null;
  let shown = 0;
  const input = (s: SimState, i: number): SimInput => ({
    direction: i % 600 < 450 ? routeDirection(config, s.handler) : { x: -routeDirection(config, s.handler).y, y: routeDirection(config, s.handler).x },
    strength: i % 300 < 20 ? 0 : 0.6,
    marker: i % 97 === 0,
    sniff: i % 401 === 0,
  });
  for (let i = 0; i < 60 / config.fixedStep && !state.ended; i++) {
    const events: SimEvent[] = tick(state, input(state, i));
    if (decider && decider.step({ time: state.time, events, tension: state.tension })) shown++;
  }
  return { payload: buildPayload(state), shown };
}

const scenarioOf = (path: string): ScenarioConfig => ({ ...defaultScenario, ...parse(readFileSync(path, 'utf8')).simulation.scenario });

describe('Feedback Messages never change the simulation', () => {
  const cases: [string, ScenarioConfig][] = [
    ['the default Stage', defaultScenario],
    ['a World 6 scent Stage with Stage Meters', scenarioOf('content/beta/nodes/park-keep-fresh/node.yaml')],
    ['a World 6 Stage with the Jackpot', scenarioOf('content/beta/nodes/park-not-that-one/node.yaml')],
  ];
  it.each(cases)('gives an identical payload with and without deciding feedback in %s', (_name, config) => {
    for (const seed of [1, 7]) {
      const on = run(seed, config, true);
      const off = run(seed, config, false);
      expect(on.shown).toBeGreaterThan(0);
      expect(JSON.stringify(on.payload)).toBe(JSON.stringify(off.payload));
    }
  });
});
