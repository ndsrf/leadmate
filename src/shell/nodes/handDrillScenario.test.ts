import { handDrillScenario } from './scenarios';

describe('handDrillScenario (task 1.5)', () => {
  it('returns the neutral preset for no age band', () => {
    expect(handDrillScenario(null)).toEqual(handDrillScenario(null, false));
    expect(handDrillScenario(null).distractor?.salience).toBe(0.35);
    expect(handDrillScenario(null).calmSeconds).toBe(2.5);
  });

  it('tunes each age band by numbers only, never the control set', () => {
    const bands = ['puppy', 'adolescent', 'adult', 'senior', null] as const;
    const presets = bands.map((b) => handDrillScenario(b));
    for (const preset of presets) {
      expect(preset.controls).toBe('hand_drill');
      expect(preset.cues).toEqual([]);
      expect(preset.distractor?.kind).toBe('hand');
    }
    expect(new Set(presets.map((p) => p.distractor?.salience)).size).toBeGreaterThan(1);
  });

  it('rewards a puppy with a toy and everyone else with a treat', () => {
    expect(handDrillScenario('puppy').reward).toBe('toy');
    for (const band of ['adolescent', 'adult', 'senior', null] as const) expect(handDrillScenario(band).reward).toBe('treat');
  });

  it('the first-run preset is gentler: softer hand, longer calm window, bigger mark budget', () => {
    for (const band of ['puppy', 'adult', null] as const) {
      const normal = handDrillScenario(band);
      const first = handDrillScenario(band, true);
      expect(first.distractor!.salience!).toBeLessThan(normal.distractor!.salience!);
      expect(first.calmSeconds!).toBeGreaterThan(normal.calmSeconds!);
      expect(first.markBudget!).toBeGreaterThan(normal.markBudget!);
      expect(first.controls).toBe(normal.controls);
    }
  });
});
