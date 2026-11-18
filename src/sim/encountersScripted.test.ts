import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultScenario, type ScenarioConfig } from './config';
import { routePoints } from './scenery';
import { routeLength } from './geometry';
import { routeWalker, runScripted } from './harness';
import { isDogLooking, type SimInput, type SimState } from './sim';
import { parseYaml, type NodeYaml } from '../shell/content/schema';
import { pawsFor } from '../shell/nodes/encounters';

describe('Prototype Encounters on walk-distraction', () => {
  const nodePath = join(__dirname, '../../content/beta/nodes/walk-distraction/node.yaml');
  const nodeYaml = parseYaml<NodeYaml>(readFileSync(nodePath, 'utf8'));
  const encounters = nodeYaml.simulation?.encounters ?? [];

  it('has four authored encounters in order', () => {
    expect(encounters.map((e) => e.id)).toEqual([
      'loose-start',
      'skate-far',
      'skate-poste',
      'turn-look',
    ]);
  });

  describe('Route and timing constraints', () => {
    it('each waypoint Encounter route is 20-28 m', () => {
      for (const enc of encounters) {
        const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
        if (config.endCondition.kind === 'reach-waypoint') {
          const len = routeLength(routePoints(config));
          expect(len).toBeGreaterThanOrEqual(20);
          expect(len).toBeLessThanOrEqual(28);
        }
      }
    });

    it('loose-start distractor never activates', () => {
      const enc = encounters.find((e) => e.id === 'loose-start')!;
      const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
      const walk = routeWalker(config);
      const { state } = runScripted(1, (s) => ({ ...walk(s), marker: false }), config);
      expect(state.distractor.active).toBe(false);
    });

    it('each time-limited Encounter ends at its limit', () => {
      const timeLimited = encounters.filter((e) => e.scenario?.endCondition?.kind === 'time-limit');
      expect(timeLimited).toHaveLength(2);

      for (const enc of timeLimited) {
        const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
        const limitSeconds = (config.endCondition as { kind: 'time-limit'; seconds: number }).seconds;
        const walk = routeWalker(config);
        const { state, payload } = runScripted(1, (s) => ({ ...walk(s), marker: false }), config);
        expect(state.ended).toBe(true);
        expect(payload.durationSeconds).toBeCloseTo(limitSeconds, 0);
      }
    });
  });

  describe('Passive runs (1 Paw where Aim needs an action)', () => {
    it('passive run on skate-poste (mark-disengagement) yields 1 Paw', () => {
      const enc = encounters.find((e) => e.id === 'skate-poste')!;
      const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
      const walk = routeWalker(config);
      // Handler walks but never presses marker
      const { payload } = runScripted(1, (s) => ({ ...walk(s), marker: false }), config);
      const res = pawsFor(enc.aim, payload);
      expect(res.paws).toBe(1);
      expect(res.next).toBe('aim');
    });

    it('passive run on turn-look (check-in) yields 1 Paw', () => {
      const enc = encounters.find((e) => e.id === 'turn-look')!;
      const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
      const walk = routeWalker(config);
      // Handler walks but never presses marker
      const { payload } = runScripted(1, (s) => ({ ...walk(s), marker: false }), config);
      const res = pawsFor(enc.aim, payload);
      expect(res.paws).toBe(1);
      expect(res.next).toBe('aim');
    });
  });

  describe('Good scripted runs (3 Paws for each Encounter)', () => {
    it('loose-start: 3 Paws on calm walking with loose leash', () => {
      const enc = encounters.find((e) => e.id === 'loose-start')!;
      const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
      const walk = routeWalker(config);
      const { payload } = runScripted(1, (s) => ({ ...walk(s), strength: 0.6, marker: false }), config);
      const res = pawsFor(enc.aim, payload);
      expect(res.paws).toBe(3);
    });

    it('skate-far: 3 Paws on seeing skateboarder far ahead and staying calm', () => {
      const enc = encounters.find((e) => e.id === 'skate-far')!;
      const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
      const walk = routeWalker(config);
      const { payload } = runScripted(
        1,
        (s) => {
          const w = walk(s);
          const slow = s.distractor.active && !s.distractor.finished;
          return { direction: w.direction, strength: slow ? 0 : 0.6, marker: false };
        },
        config,
      );
      const res = pawsFor(enc.aim, payload);
      expect(res.paws).toBe(3);
    });

    it('skate-poste: 3 Paws on stopping for skateboarder and marking disengagement', () => {
      const enc = encounters.find((e) => e.id === 'skate-poste')!;
      const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
      const walk = routeWalker(config);
      let marked = false;
      let maxArousal = 0;
      let threshold = 0;
      const inputs = (s: SimState): SimInput => {
        threshold = s.dogTraits.reactivityThreshold;
        if (s.arousal > maxArousal) maxArousal = s.arousal;
        // Stop when the distractor approaches or dog fixates
        const distractorNear = s.distractor.active && !s.distractor.finished;
        const stop = s.dogMode === 'fixated' || distractorNear || s.rewardWindow !== null;
        let marker = false;
        if (s.rewardWindow && !marked) {
          marker = true;
          marked = true;
        }
        const w = walk(s);
        return {
          direction: w.direction,
          strength: stop ? 0 : 0.6,
          marker,
        };
      };
      const { payload } = runScripted(1, inputs, config);
      const res = pawsFor(enc.aim, payload);
      expect(res.paws).toBe(3);
    });

    it('turn-look: 3 Paws on turning and marking the check-in glance', () => {
      const enc = encounters.find((e) => e.id === 'turn-look')!;
      const config: ScenarioConfig = { ...defaultScenario, ...enc.scenario };
      const walk = routeWalker(config);
      let marked = false;
      const inputs = (s: SimState): SimInput => {
        let marker = false;
        if (isDogLooking(s) && !marked) {
          marker = true;
          marked = true;
        }
        const w = walk(s);
        return {
          direction: w.direction,
          strength: 0.6,
          marker,
        };
      };
      const { payload } = runScripted(1, inputs, config);
      const res = pawsFor(enc.aim, payload);
      expect(res.paws).toBe(3);
    });
  });
});
