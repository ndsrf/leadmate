import { es } from '../../i18n';
import { findFix, MISSIONS } from './content';
import { lessonTextKeys } from '../lessons/lesson';

const fixes = MISSIONS.flatMap((m) => [...m.problems.map((p) => p.fix), m.generalFix]);

describe('Mission content', () => {
  it('has 14 Missions with unique ids, and Fixes with unique ids', () => {
    expect(MISSIONS).toHaveLength(14);
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
    expect(MISSIONS.filter((m) => m.place === 'home').map((m) => m.id)).toEqual(['mission-dog-as-dog', 'mission-home-rest', 'mission-calm-first']);
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
