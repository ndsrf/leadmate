import { newDogRecord, setHomeConcern, setMainConcerns, setAgeBand, setSex, type DogRecord } from '../dogRecord';
import { DEFAULT_TRIGGER_PROFILE } from '../../sim/learning';
import { isHomeStretchId } from '../homeBehaviours';
import { findStretch, stopsOf, WORLDS } from '../world';
import { setTriggerLevel } from '../dogRecord';
import { buildPersonalPlan, CONCERN_STRETCHES, planNotes, rebuildPlan } from './plan';
import { chooseMainConcerns, toggleMainConcern } from './questionnaire';

/** A record with the Trigger Profile at 0 everywhere (nothing answered), at the given diagnostic latency. */
function blank(latency: number | null = 0.3): DogRecord {
  const r = newDogRecord();
  return { ...r, triggerProfile: { child: 0, bicycle: 0, dog: 0, skateboard: 0, food: 0, other: 0, hand: 0 }, onboarding: { ...r.onboarding, diagnosticLatency: latency } };
}
const ids = (r: DogRecord) => buildPersonalPlan(r).map((i) => i.stretchId);
const DEFAULT = ['theory-harness', 'theory-doorbell', 'theory-poste', 'theory-loose-leash'];

describe('Personal Plan', () => {
  it('equals the default plan when nothing is answered, with the Poste first when the latency is slow', () => {
    expect(ids(blank(0.3))).toEqual(DEFAULT);
    expect(ids(blank(null))).toEqual(DEFAULT);
    expect(ids(blank(0.7))).toEqual(['theory-poste', 'theory-harness', 'theory-doorbell', 'theory-loose-leash']);
    expect(buildPersonalPlan(blank(0.7))[0].because).toBe('slow');
  });

  it('puts biting first: its Home Stretch leads even over a reaction to dogs at level 3', () => {
    const r = setTriggerLevel(setMainConcerns(blank(), ['bite-owner']), 'dog', 3);
    const plan = buildPersonalPlan(r);
    expect(plan[0]).toEqual({ stretchId: 'theory-bite-owner', concern: 'bite-owner' });
    expect(plan.map((i) => i.stretchId)).toContain('theory-home-rest');
    expect(plan.map((i) => i.stretchId)).not.toContain('theory-named-behaviours');
    expect(plan.findIndex((i) => i.stretchId === 'theory-slack-u')).toBeGreaterThan(0);
  });

  it('ranks the stronger biting Concern first and eating non-food things after biting', () => {
    const r = setHomeConcern(setHomeConcern(blank(), 'eat-objects', 3), 'bite-others', 1);
    expect(buildPersonalPlan(r).map((i) => i.concern).slice(0, 3)).toEqual(['bite-others', 'bite-others', 'bite-others']);
    const eating = setHomeConcern(blank(), 'eat-objects', 2);
    expect(buildPersonalPlan(eating)[0].concern).toBe('eat-objects');
  });

  it('puts the Stretch of an outdoor Main Concern in the first two items', () => {
    for (const latency of [0.3, 0.7]) expect(ids(setMainConcerns(blank(latency), ['react-bicycle'])).slice(0, 2)).toContain('theory-blind-corner');
  });

  it('plans for the other Concerns by level, and only outdoor reactions at level 3', () => {
    expect(ids(setTriggerLevel(blank(), 'food', 3))).toContain('theory-leave-it');
    expect(ids(setTriggerLevel(blank(), 'food', 2))).toEqual(DEFAULT);
    expect(ids(setHomeConcern(blank(), 'bark-home', 1))[0]).toBe('theory-bark-home');
  });

  it('orders being alone at level 3 among the other Concerns by level', () => {
    const r = setHomeConcern(setHomeConcern(blank(), 'alone', 3), 'destroy', 1);
    const plan = buildPersonalPlan(r);
    const at = (c: string) => plan.findIndex((i) => i.concern === c);
    expect(plan[at('alone')].stretchId).toBe('theory-alone-space');
    expect(at('alone')).toBeGreaterThanOrEqual(0);
    expect(at('alone')).toBeLessThan(at('destroy'));
    const low = buildPersonalPlan(setHomeConcern(setHomeConcern(blank(), 'alone', 1), 'destroy', 3));
    expect(low.findIndex((i) => i.concern === 'destroy')).toBeLessThan(low.findIndex((i) => i.concern === 'alone'));
  });

  it('ranks the at-home Stretches above leash-heavy ones for a puppy', () => {
    const plan = ids(setAgeBand(setTriggerLevel(blank(), 'bicycle', 3), 'puppy'));
    expect(plan.slice(0, 2)).toEqual(['theory-home-rest', 'theory-calm-first']);
    expect(plan.indexOf('theory-home-rest')).toBeLessThan(plan.indexOf('theory-blind-corner'));
  });

  it('moves the Poste up for an adolescent and leaves the order alone for an adult or a senior', () => {
    expect(ids(setAgeBand(blank(), 'adolescent'))[0]).toBe('theory-poste');
    expect(ids(setAgeBand(blank(), 'adult'))).toEqual(DEFAULT);
    expect(ids(setAgeBand(blank(), 'senior'))).toEqual(DEFAULT);
  });

  it('ignores sex', () => {
    const base = setHomeConcern(setMainConcerns(blank(), ['react-dog']), 'destroy', 2);
    expect(buildPersonalPlan(setSex(base, 'male'))).toEqual(buildPersonalPlan(setSex(base, 'female')));
    expect(buildPersonalPlan(setSex(base, 'male'))).toEqual(buildPersonalPlan(base));
  });

  it('keeps the slow-latency Poste after the biting Home Stretch', () => {
    const plan = ids(setMainConcerns(blank(0.7), ['bite-owner']));
    expect(plan.indexOf('theory-poste')).toBeGreaterThan(plan.indexOf('theory-bite-owner'));
  });

  it.each([null, 0.1, 0.3, 0.7])('has 3 to 5 distinct existing Stretches at latency %s', (latency) => {
    let r = blank(latency);
    for (const c of Object.keys(CONCERN_STRETCHES) as (keyof typeof CONCERN_STRETCHES)[]) {
      const plan = ids(setMainConcerns(r, [c]));
      expect(plan.length).toBeGreaterThanOrEqual(3);
      expect(plan.length).toBeLessThanOrEqual(5);
      expect(new Set(plan).size).toBe(plan.length);
      for (const id of plan) expect(findStretch(id) ?? isHomeStretchId(id)).toBeTruthy();
    }
    r = setAgeBand(setHomeConcern(setHomeConcern(r, 'bite-owner', 3), 'destroy', 3), 'puppy');
    expect(ids(r).length).toBeLessThanOrEqual(5);
  });

  it('maps every Concern to existing Stretches, a home Concern to its own Home Stretch first', () => {
    const lead = new Set(WORLDS.flatMap((w) => w.stretches.filter((s) => s.length).map((s) => stopsOf({ ...w, stretches: [s] })[0].id)));
    for (const list of Object.values(CONCERN_STRETCHES)) for (const id of list) expect(lead.has(id) || isHomeStretchId(id)).toBe(true);
    for (const c of ['bite-owner', 'bite-others', 'bark-home', 'destroy', 'eat-objects', 'alone'] as const) {
      expect(isHomeStretchId(CONCERN_STRETCHES[c][0])).toBe(true);
      expect(CONCERN_STRETCHES[c]).not.toContain('theory-named-behaviours');
    }
  });

  it('rebuilds the plan onto the record', () => {
    const r = rebuildPlan(setMainConcerns(blank(), ['bite-owner']));
    expect(r.onboarding.plan[0].stretchId).toBe('theory-bite-owner');
  });

  it('keeps the old default for an existing Dog with a default Trigger Profile and no answers', () => {
    expect(DEFAULT_TRIGGER_PROFILE.dog).toBe(2);
    expect(ids({ ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, diagnosticLatency: 0.3 } })).toEqual(DEFAULT);
  });
});

describe('several Main Concerns', () => {
  it('plans for each in the order picked, after biting', () => {
    const r = setMainConcerns(blank(), ['react-food', 'react-bicycle', 'bark-home']);
    expect(buildPersonalPlan(r).slice(0, 4).map((i) => i.concern)).toEqual(['react-food', 'react-bicycle', 'bark-home', 'bark-home']);
    expect(ids(setMainConcerns(blank(), ['react-bicycle', 'bite-owner']))[0]).toBe('theory-bite-owner');
  });

  it('keeps at most three, drops repeats, and ignores a fourth pick', () => {
    expect(setMainConcerns(blank(), ['react-dog', 'react-dog', 'destroy', 'bark-home', 'react-food']).mainConcerns).toEqual(['react-dog', 'destroy', 'bark-home']);
    const full = setMainConcerns(blank(), ['react-dog', 'destroy', 'bark-home']);
    expect(toggleMainConcern(full, 'react-food')).toBe(full);
    expect(toggleMainConcern(full, 'destroy').mainConcerns).toEqual(['react-dog', 'bark-home']);
    expect(toggleMainConcern(toggleMainConcern(full, 'destroy'), 'react-food').mainConcerns).toEqual(['react-dog', 'bark-home', 'react-food']);
  });
});

describe('plan notes', () => {
  it.each([[1, false], [2, true], [3, true]] as const)('biting others at level %s: professional help %s', (level, expected) => {
    expect(planNotes(setHomeConcern(blank(), 'bite-others', level)).professionalHelp).toBe(expected);
    expect(planNotes(setHomeConcern(blank(), 'bite-owner', level)).professionalHelp).toBe(expected);
  });

  it('is off with both biting Concerns at level 1', () => {
    expect(planNotes(setHomeConcern(setHomeConcern(blank(), 'bite-owner', 1), 'bite-others', 1)).professionalHelp).toBe(false);
  });

  it('shows the supervision note only for children at level 3, and drops it when the level is lowered', () => {
    const three = setTriggerLevel(blank(), 'child', 3);
    expect(planNotes(three).supervision).toBe(true);
    expect(planNotes(setTriggerLevel(three, 'child', 2)).supervision).toBe(false);
    expect(planNotes(setTriggerLevel(blank(), 'dog', 3)).supervision).toBe(false);
  });

  it('shows both together and stores nothing', () => {
    const r = setTriggerLevel(setHomeConcern(blank(), 'bite-owner', 3), 'child', 3);
    expect(planNotes(r)).toEqual({ professionalHelp: true, supervision: true });
    expect(JSON.stringify(r)).not.toMatch(/professionalHelp|supervision/);
  });
});

describe('editing the answers later', () => {
  it('rebuilds the plan when the Main Concern changes and keeps the diagnostic latency', () => {
    const before = rebuildPlan(blank(0.7));
    expect(before.onboarding.plan[0].stretchId).toBe('theory-poste');
    const after = rebuildPlan(chooseMainConcerns(before, ['bite-owner']));
    expect(after.onboarding.plan[0]).toEqual({ stretchId: 'theory-bite-owner', concern: 'bite-owner' });
    expect(after.onboarding.diagnosticLatency).toBe(0.7);
    expect(after.mainConcerns).toEqual(['bite-owner']);
  });

  it('rebuilds the plan when the age or a Trigger level changes, and when a Concern is cleared', () => {
    expect(rebuildPlan(setAgeBand(blank(), 'puppy')).onboarding.plan.slice(0, 2).map((i) => i.stretchId)).toEqual(['theory-home-rest', 'theory-calm-first']);
    expect(rebuildPlan(setTriggerLevel(blank(), 'bicycle', 3)).onboarding.plan.map((i) => i.stretchId)).toContain('theory-blind-corner');
    const off = rebuildPlan(setTriggerLevel(rebuildPlan(setTriggerLevel(blank(), 'bicycle', 3)), 'bicycle', 0));
    expect(off.onboarding.plan.map((i) => i.stretchId)).toEqual(DEFAULT);
  });
});
