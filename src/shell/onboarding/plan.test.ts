import { DEFAULT_TRIGGER_PROFILE } from '../../sim/learning';
import { findNode } from '../nodes/content';
import { buildWalkPlan, nextPlanned } from './plan';

describe('Walk Plan', () => {
  it('puts the Poste practice first for a slow latency', () => {
    const plan = buildWalkPlan(0.7, DEFAULT_TRIGGER_PROFILE);
    expect(plan[0]).toBe('poste-practice');
    expect(new Set(plan).size).toBe(plan.length);
  });

  it('keeps the default order for a quick latency', () => {
    expect(buildWalkPlan(0.3, DEFAULT_TRIGGER_PROFILE)).toEqual(['harness-ritual', 'doorbell-mat', 'poste-practice', 'walk-distraction']);
  });

  it('adds the Node for the strongest reaction', () => {
    expect(buildWalkPlan(0.3, { ...DEFAULT_TRIGGER_PROFILE, bicycle: 3 })).toContain('blind-corner');
    expect(buildWalkPlan(0.3, { ...DEFAULT_TRIGGER_PROFILE, food: 3 })).toContain('leave-it-intro');
  });

  it.each([0.1, 0.3, 0.45, 0.7, 1.5])('has 3 to 5 existing Node ids at latency %s', (latency) => {
    for (const bike of [2, 3] as const) {
      const plan = buildWalkPlan(latency, { ...DEFAULT_TRIGGER_PROFILE, bicycle: bike, food: 3 });
      expect(plan.length).toBeGreaterThanOrEqual(3);
      expect(plan.length).toBeLessThanOrEqual(5);
      for (const id of plan) expect(findNode(id)).toBeDefined();
    }
  });

  it('finds the next unfinished Node', () => {
    const plan = ['a', 'b', 'c'];
    expect(nextPlanned(plan, ['a'])).toBe('b');
    expect(nextPlanned(plan, plan)).toBeNull();
  });
});
