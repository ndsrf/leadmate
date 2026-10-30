import { es } from '../../i18n';
import { findFix, MISSIONS } from './content';
import { lessonTextKeys } from '../lessons/lesson';

const fixes = MISSIONS.flatMap((m) => [...m.problems.map((p) => p.fix), m.generalFix]);

describe('Mission content', () => {
  it('has 11 Missions with unique ids, and Fixes with unique ids', () => {
    expect(MISSIONS).toHaveLength(11);
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
    expect(m.placeholder).toBe(true);
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
    expect(f.placeholder).toBe(true);
  });

  it('finds each Fix with its Mission and problem, and names the general one "Otra cosa"', () => {
    const harness = findFix('fix-harness-excited')!;
    expect(harness.mission.id).toBe('mission-harness');
    expect(es[harness.problem]).toBe('Se excita al ver el arnés');
    expect(es[findFix('fix-harness-general')!.problem]).toBe('Otra cosa');
    expect(findFix('nope')).toBeUndefined();
  });
});
