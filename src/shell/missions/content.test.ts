import { es } from '../../i18n';
import { findFix, findMission, MISSIONS } from './content';
import { applyDaySkip, newDogRecord } from '../dogRecord';
import { activeTarget, checkIn, isOwed, NEW_MISSION, startMission } from './mission';
import { lessonTextKeys } from '../lessons/lesson';

const fixes = MISSIONS.flatMap((m) => [...m.problems.map((p) => p.fix), m.generalFix]);

describe('Mission content', () => {
  it('has 19 Missions with unique ids, and Fixes with unique ids', () => {
    expect(MISSIONS).toHaveLength(19);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    expect(new Set(fixes.map((f) => f.id)).size).toBe(fixes.length);
  });

  it.each(MISSIONS.map((m) => [m.id, m] as const))('%s has a target, reps, a success sign, a technique, 3-4 problems and a general Fix', (_id, m) => {
    for (const key of [m.title, m.target, m.successSign, ...m.problems.map((p) => p.label)]) expect(es[key]).toBeTruthy();
    expect(m.reps).toBeGreaterThan(0);
    expect(m.technique).toBeTruthy();
    expect(m.trains.length).toBeGreaterThan(0);
    expect(m.problems.length).toBeGreaterThanOrEqual(3);
    expect(m.problems.length).toBeLessThanOrEqual(4);
    expect(m.generalFix).toBeDefined();
  });

  it.each(fixes.map((f) => [f.id, f] as const))('%s is reassurance, cause, corrections with media, then the easier target and a Stop', (_id, f) => {
    const [reassure, cause, ...corrections] = f.blocks;
    expect(reassure).toMatchObject({ type: 'text' });
    expect(cause).toMatchObject({ type: 'text' });
    expect(reassure.type === 'text' && reassure.text.endsWith('.reassure')).toBe(true);
    expect(cause.type === 'text' && cause.text.endsWith('.cause')).toBe(true);
    const texts = corrections.filter((b) => b.type === 'text');
    expect(texts.length).toBeGreaterThanOrEqual(2);
    expect(texts.length).toBeLessThanOrEqual(3);
    const media = corrections.filter((b) => b.type === 'image' || b.type === 'video');
    expect(media.length).toBeGreaterThan(0);
    for (const b of f.blocks) {
      if (b.type === 'image' || b.type === 'video') {
        expect(es[b.alt]).toBeTruthy();
        expect(es[b.caption]).toBeTruthy();
      }
    }
    for (const key of lessonTextKeys(f.blocks)) expect(es[key]).toBeTruthy();
    expect(es[f.easierTarget]).toBeTruthy();
    expect(f.practise).toBeDefined();
  });

  it('finds each Fix with its Mission and problem, and names the general one "Otra cosa"', () => {
    const harness = findFix('fix-harness-excited')!;
    expect(harness.mission.id).toBe('mission-harness');
    expect(es[harness.problem]).toBe('Se excita al ver el arnés');
    expect(es[findFix('fix-harness-general')!.problem]).toBe('Otra cosa');
    expect(findFix('nope')).toBeUndefined();
  });
});

describe('Basics home Missions', () => {
  it('are done at home with the reps and problems of the design', () => {
    const shape = (id: string) => {
      const m = MISSIONS.find((x) => x.id === id)!;
      return { place: m.place, reps: m.reps, problems: m.problems.map((p) => p.id) };
    };
    expect(shape('mission-dog-as-dog')).toEqual({ place: 'home', reps: 1, problems: ['cries', 'family', 'bed'] });
    expect(shape('mission-home-rest')).toEqual({ place: 'home', reps: 3, problems: ['insists', 'barks', 'comesback'] });
    expect(shape('mission-calm-first')).toEqual({ place: 'home', reps: 2, problems: ['neverstops', 'escalates', 'givein'] });
    expect(MISSIONS.filter((m) => m.place === 'home').map((m) => m.id).slice(0, 3)).toEqual(['mission-dog-as-dog', 'mission-home-rest', 'mission-calm-first']);
  });

  it('word the brief and success for home, never for a walk', () => {
    for (const m of MISSIONS.filter((x) => x.place === 'home')) {
      for (const key of [m.title, m.target, m.successSign]) expect(es[key]).not.toMatch(/paseo|correa|acera/i);
    }
  });

  it('asks calmly to send the Dog away three times with no eye contact, words or touch, and the Dog goes to rest', () => {
    const m = MISSIONS.find((x) => x.id === 'mission-home-rest')!;
    expect(m.reps).toBe(3);
    expect(es[m.target]).toMatch(/sin mirarle, hablarle ni tocarlo/);
    expect(es[m.successSign]).toMatch(/descansar a su cama por su cuenta/);
  });
});

describe('Home Behaviour Missions', () => {
  const HOME_IDS = ['mission-bite-owner', 'mission-bite-others', 'mission-bark-home', 'mission-destroy', 'mission-eat-objects'];

  it('has the five Home Missions, done at home, found by id and each with three problems and a general Fix', () => {
    for (const id of HOME_IDS) {
      const m = findMission(id)!;
      expect(m).toBeDefined();
      expect(m.place).toBe('home');
      expect(m.problems).toHaveLength(3);
      for (const key of [m.title, m.target, m.successSign, m.generalFix.easierTarget, ...m.problems.map((p) => p.label)]) expect({ id, key, text: es[key] }).toEqual({ id, key, text: expect.any(String) });
    }
  });

  it('trains a Lesson Stop for the biting Missions and the exercise Node for the others', () => {
    expect(findMission('mission-bite-owner')!.trains).toEqual([{ kind: 'lesson', id: 'theory-bite-owner' }]);
    expect(findMission('mission-bite-others')!.trains).toEqual([{ kind: 'lesson', id: 'theory-bite-others' }]);
    expect(findMission('mission-bark-home')!.trains).toEqual([{ kind: 'node', id: 'bark-home' }]);
    expect(findMission('mission-destroy')!.trains).toEqual([{ kind: 'node', id: 'destroy' }]);
    expect(findMission('mission-eat-objects')!.trains).toEqual([{ kind: 'node', id: 'eat-objects' }]);
  });

  it('shows the one shared vet note in every Fix of the eating Mission, and the professional note in the biting ones', () => {
    const textsOf = (id: string) => findMission(id)!.problems.map((p) => p.fix).concat(findMission(id)!.generalFix).map((f) => lessonTextKeys(f.blocks));
    for (const keys of textsOf('mission-eat-objects')) expect(keys).toContain('lesson.note.vet');
    for (const id of ['mission-bite-owner', 'mission-bite-others']) for (const keys of textsOf(id)) expect(keys).toContain('plan.note.professional');
  });

  it('points a failed swallowing check-in at the vet', () => {
    const fix = findMission('mission-eat-objects')!.problems.find((p) => p.id === 'swallowed')!.fix;
    expect(lessonTextKeys(fix.blocks)).toContain('lesson.note.vet');
    expect(es['fix.eatobjects.swallowed.c1']).toMatch(/veterinario/);
  });

  it('keeps the check-in, the skip answer and the Remediation of a Mission', () => {
    const m = findMission('mission-bark-home')!;
    const started = startMission(NEW_MISSION, new Date(2026, 10, 1, 10));
    const next = new Date(2026, 10, 2, 10);
    const skipped = checkIn(started, 'skipped', undefined, next);
    expect(skipped.skipRun).toBe(1);
    const struggled = checkIn(started, 'struggled', 'nonstop', next);
    expect(struggled.target).toBe('easier');
    expect(activeTarget(m, struggled)).toBe('fix.barkhome.nonstop.easier');
    expect(checkIn(started, 'completed', undefined, next).passedOn).toBe('2026-11-02');
  });

  it('takes a Day Skip like any Mission: a Home Mission can be Owed', () => {
    const now = new Date(2026, 10, 1, 20);
    let record = newDogRecord();
    record = { ...record, missions: { 'mission-bark-home': startMission(NEW_MISSION, new Date(2026, 10, 1, 10)) } };
    expect(isOwed(applyDaySkip(record, 'mission-bark-home', now).missions['mission-bark-home'])).toBe(true);
  });
});
