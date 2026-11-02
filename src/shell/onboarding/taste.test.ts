import { runScripted } from '../../sim/harness';
import { validateScenario } from '../../sim/scenery';
import { noInput, type SimInput } from '../../sim/sim';
import { tasteScenario, tasteScenarioFor, TASTE_SECONDS } from './taste';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const walk: SimInput = { ...noInput, direction: { x: 1, y: 0 }, strength: 0.6 };

/** Seconds until the Dog first goes Reactive, or null when it never does within the limit. */
function reactiveAt(seed: number, input: SimInput, config = tasteScenario): number | null {
  const stage = runScripted(seed, () => input, config);
  const hit = stage.events.find((e) => e.type === 'reaction-tier-change' && e.tier === 'reactive');
  return hit ? hit.time : null;
}

describe('taste scenario', () => {
  it('passes the scenario validation', () => {
    expect(validateScenario(tasteScenario)).toEqual([]);
  });

  it('has a dog Distractor, no Cue skill and a time limit', () => {
    expect(tasteScenario.distractor.kind).toBe('dog');
    expect(tasteScenario.learning.attributes.followChance).toBe(0);
    expect(tasteScenario.endCondition).toEqual({ kind: 'time-limit', seconds: TASTE_SECONDS });
  });

  it.each(SEEDS)('makes a still Handler reach Reactive within the limit (seed %i)', (seed) => {
    const at = reactiveAt(seed, noInput);
    expect(at).not.toBeNull();
    expect(at!).toBeLessThanOrEqual(TASTE_SECONDS);
  });

  it.each(SEEDS)('makes a straight-walking Handler reach Reactive within the limit (seed %i)', (seed) => {
    const at = reactiveAt(seed, walk);
    expect(at).not.toBeNull();
    expect(at!).toBeLessThanOrEqual(TASTE_SECONDS);
  });

  it('would fail this test if the scenario were made easy', () => {
    const easy = { ...tasteScenario, distractor: { ...tasteScenario.distractor, activateAfterMeters: 1e9 } };
    expect(reactiveAt(1, noInput, easy)).toBeNull();
    const calmDog = { ...tasteScenario, learning: { ...tasteScenario.learning, triggerProfile: { ...tasteScenario.learning.triggerProfile, dog: 0 as const } } };
    expect(reactiveAt(1, noInput, calmDog)).toBeNull();
  });

  it('shows the reaction within the limit, not at its last moment', () => {
    for (const seed of SEEDS) expect(reactiveAt(seed, walk)!).toBeLessThan(TASTE_SECONDS - 4);
  });
});

describe('taste scenario by Main Concern', () => {
  const KINDS = [
    ['react-dog', 'dog'],
    ['react-child', 'child'],
    ['react-bicycle', 'bicycle'],
    ['react-skateboard', 'skateboard'],
    ['react-food', 'food'],
  ] as const;

  it.each(KINDS)('Main Concern %s uses a %s Distractor', (concern, kind) => {
    const scenario = tasteScenarioFor([concern]);
    expect(scenario.distractor.kind).toBe(kind);
    expect(scenario.learning.triggerProfile[kind]).toBe(3);
    expect(scenario.learning.attributes.followChance).toBe(0);
    expect(scenario.endCondition).toEqual({ kind: 'time-limit', seconds: TASTE_SECONDS });
    expect(validateScenario(scenario)).toEqual([]);
  });

  it('uses the first outdoor pick, whatever its place', () => {
    expect(tasteScenarioFor(['bite-owner', 'react-skateboard', 'react-dog']).distractor.kind).toBe('skateboard');
  });

  it.each([null, 'bite-owner', 'bite-others', 'bark-home', 'destroy', 'eat-objects'] as const)('Main Concern %s uses the approaching dog', (concern) => {
    const picks = concern === null ? [] : [concern];
    expect(tasteScenarioFor(picks).distractor.kind).toBe('dog');
    expect(tasteScenarioFor(picks)).toEqual(tasteScenario);
  });

  describe.each(KINDS)('%s', (concern) => {
    const scenario = tasteScenarioFor([concern]);
    it.each(SEEDS)('reaches Reactive within the limit for a still and a walking Handler (seed %i)', (seed) => {
      for (const input of [noInput, walk]) {
        const at = reactiveAt(seed, input, scenario);
        expect(at).not.toBeNull();
        expect(at!).toBeLessThanOrEqual(TASTE_SECONDS);
      }
    });

    it('is not Reactive without the Distractor being a trigger', () => {
      const calm = { ...scenario, learning: { ...scenario.learning, triggerProfile: { ...scenario.learning.triggerProfile, [scenario.distractor.kind]: 0 as const } } };
      expect(reactiveAt(1, noInput, calm)).toBeNull();
    });
  });
});
