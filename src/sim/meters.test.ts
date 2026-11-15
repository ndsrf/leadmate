import { defaultScenario, type ScenarioConfig, type StageMeterConfig } from './config';
import { feedbackKindOf, FEEDBACK_ACTION_KINDS } from './feedbackKinds';
import { runScripted } from './harness';
import { validateScenario } from './scenery';
import { createState, isDogLooking, noInput, tick, type SimEvent, type SimInput, type SimState } from './sim';

const STEP = defaultScenario.fixedStep;
const fastCheckIns = { ...defaultScenario.ranges, checkInMeanInterval: { worst: 5, best: 5 } };
const noDistractor = { ...defaultScenario.distractor, activateAfterMeters: 1e9 };
const connection: StageMeterConfig = { id: 'connection', labelKey: 'meter.connection', icon: 'eye', target: 15, meterPoints: { 'check-in-hit': 10 } };
const nose: StageMeterConfig = { id: 'nose', labelKey: 'meter.nose', icon: 'nose', target: 30, meterPoints: { 'go-sniff': 10 } };
const scenario = (o: Partial<ScenarioConfig> = {}): ScenarioConfig => ({ ...defaultScenario, distractor: noDistractor, ranges: fastCheckIns, ...o });
const press: SimInput = { ...noInput, marker: true };

function runUntil(state: SimState, type: SimEvent['type'], maxSeconds = 60): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < maxSeconds / STEP; i++) {
    const evs = tick(state, noInput);
    events.push(...evs);
    if (evs.some((e) => e.type === type)) break;
  }
  return events;
}

/** Waits for a glance and marks it 0.2 s in; returns that tick's events. */
function markNextCheckIn(s: SimState): SimEvent[] {
  runUntil(s, 'check-in-glance');
  for (let i = 0; i < Math.round(0.2 / STEP); i++) tick(s, noInput);
  expect(isDogLooking(s)).toBe(true);
  return tick(s, press);
}

describe('Feedback action kinds', () => {
  it('maps simulation events to right and wrong kinds', () => {
    expect(feedbackKindOf({ type: 'check-in-hit', time: 0, grade: 'good' })).toBe('check-in-hit');
    expect(feedbackKindOf({ type: 'marker-hit', time: 0, accuracyMs: 200, grade: 'perfect' })).toBe('marker-hit');
    expect(feedbackKindOf({ type: 'disengagement', time: 0, poste: true })).toBe('poste');
    expect(feedbackKindOf({ type: 'disengagement', time: 0, poste: false })).toBe('disengagement');
    expect(feedbackKindOf({ type: 'poste-stop', time: 0, abrupt: true, outwardSpeed: 1, arousalBump: 1 })).toBe('harsh-stop');
    expect(feedbackKindOf({ type: 'poste-stop', time: 0, abrupt: false, outwardSpeed: 1, arousalBump: 1 })).toBeNull();
    expect(feedbackKindOf({ type: 'tension-change', time: 0, tension: 'rigid' })).toBe('rigid-pull');
    expect(feedbackKindOf({ type: 'tension-change', time: 0, tension: 'taut' })).toBeNull();
    expect(feedbackKindOf({ type: 'go-sniff-end', time: 0, reason: 'tension' })).toBe('go-sniff-cut-short');
    expect(feedbackKindOf({ type: 'go-sniff-end', time: 0, reason: 'time' })).toBeNull();
    expect(feedbackKindOf({ type: 'marker-late', time: 0 })).toBe('late-marker-press');
    expect(FEEDBACK_ACTION_KINDS['check-in-hit']).toBe('right');
    expect(FEEDBACK_ACTION_KINDS['late-marker-press']).toBe('wrong');
  });
});

describe('Stage Meters', () => {
  it('starts every declared meter empty, and has none without meters', () => {
    expect(createState(3, scenario({ meters: [connection, nose] })).meters).toEqual([
      { id: 'connection', value: 0, target: 15 },
      { id: 'nose', value: 0, target: 30 },
    ]);
    expect(createState(3, scenario()).meters).toEqual([]);
  });

  it('adds Meter Points on the tick the action is reported', () => {
    const s = createState(3, scenario({ meters: [connection, nose] }));
    const events = markNextCheckIn(s);
    const hit = events.findIndex((e) => e.type === 'check-in-hit');
    const points = events.findIndex((e) => e.type === 'meter-points');
    expect(hit).toBeGreaterThanOrEqual(0);
    expect(points).toBeGreaterThan(hit);
    expect(events[points]).toMatchObject({ type: 'meter-points', meterId: 'connection', kind: 'check-in-hit', points: 10, value: 10, full: false });
    expect(s.meters).toEqual([
      { id: 'connection', value: 10, target: 15 },
      { id: 'nose', value: 0, target: 30 },
    ]);
  });

  it('caps a meter at its target and reports it full once', () => {
    const s = createState(3, scenario({ meters: [connection] }));
    markNextCheckIn(s);
    const second = markNextCheckIn(s);
    expect(second.find((e) => e.type === 'meter-points')).toMatchObject({ points: 5, value: 15, full: true });
    const third = markNextCheckIn(s);
    expect(third.some((e) => e.type === 'check-in-hit')).toBe(true);
    expect(third.some((e) => e.type === 'meter-points')).toBe(false);
    expect(s.meters[0].value).toBe(15);
  });

  it('adds nothing for wrong actions and emits no meter event without meters', () => {
    const s = createState(3, scenario({ meters: [connection] }));
    const events = tick(s, press); // nothing to mark
    expect(events.map((e) => e.type)).toEqual(['marker-wasted']);
    const plain = createState(3, scenario());
    expect(markNextCheckIn(plain).some((e) => e.type === 'meter-points')).toBe(false);
  });

  it('gives identical meter values for the same seed and inputs, at every tick', () => {
    const config = scenario({ meters: [connection, { ...nose, meterPoints: { 'followed-turn': 3 } }] });
    const inputs = (s: SimState): SimInput => ({
      direction: { x: Math.cos(s.time), y: Math.sin(s.time) },
      strength: 0.6,
      marker: Math.round(s.time / STEP) % 37 === 0,
    });
    const trace = (seed: number) => {
      const s = createState(seed, config);
      const values: string[] = [];
      for (let i = 0; i < 40 / STEP; i++) {
        tick(s, inputs(s));
        values.push(s.meters.map((m) => m.value).join(','));
      }
      return values;
    };
    const a = trace(9);
    expect(a[a.length - 1]).not.toBe('0,0');
    expect(trace(9)).toEqual(a);
    expect(runScripted(9, inputs, config, 40).payload).toEqual(runScripted(9, inputs, config, 40).payload);
  });
});

describe('Stage Meter validation', () => {
  const valid = (meters: unknown) => validateScenario(scenario({ meters: meters as StageMeterConfig[] }));

  it('accepts up to two good meters', () => {
    expect(valid([connection, nose])).toEqual([]);
  });

  it('rejects more than two meters', () => {
    expect(valid([connection, nose, { ...nose, id: 'third' }])).toContain('meters: at most 2 Stage Meters, found 3');
  });

  it('rejects a missing, zero or negative target, naming the meter and field', () => {
    expect(valid([{ ...connection, target: undefined }])).toContain('meter "connection": target must be a number above 0');
    expect(valid([{ ...connection, target: 0 }])).toContain('meter "connection": target must be a number above 0');
    expect(valid([{ ...connection, target: -5 }])).toContain('meter "connection": target must be a number above 0');
  });

  it('rejects an action kind the simulation does not report, and a wrong action', () => {
    expect(valid([{ ...connection, meterPoints: { 'tail-wag': 5 } }])).toContain('meter "connection": meterPoints has an unknown action kind "tail-wag"');
    expect(valid([{ ...connection, meterPoints: { 'late-marker-press': 5 } }])).toContain('meter "connection": meterPoints "late-marker-press" is a wrong action and cannot add Meter Points');
  });

  it('rejects points that are not above 0, and a meter that nothing fills', () => {
    expect(valid([{ ...connection, meterPoints: { 'check-in-hit': 0 } }])).toContain('meter "connection": meterPoints "check-in-hit" must be a number above 0');
    expect(valid([{ ...connection, meterPoints: {} }])).toContain('meter "connection": meterPoints adds no Meter Points');
  });

  it('rejects a missing or repeated id, label or icon', () => {
    expect(valid([{ ...connection, id: '' }])).toContain('meter 1: id is missing');
    expect(valid([connection, { ...nose, id: 'connection' }])).toContain('meter "connection": id is used twice');
    expect(valid([{ ...connection, labelKey: '' }])).toContain('meter "connection": labelKey is missing');
    expect(valid([{ ...connection, icon: undefined }])).toContain('meter "connection": icon is missing');
  });
});
