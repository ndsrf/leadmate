import { HOME_CONCERNS } from './concerns';
import { newDogRecord, setHomeConcern } from './dogRecord';
import { contentGaps, CONTENT_PARTS, HOME_BEHAVIOUR_CONTENT, homeBehaviourEntries, homeBehaviourProgress, KNOWN_GAPS, hasContent } from './homeBehaviours';
import { isWorldComplete, isWorldUnlocked, progressOf, stopsOf, WORLDS } from './world';

describe('Home Behaviour content coverage', () => {
  it('lists every missing Lesson, Node and Mission, and nothing that exists', () => {
    expect([...KNOWN_GAPS].sort()).toEqual(contentGaps().sort());
  });

  it('has an entry for every Home Behaviour', () => {
    expect(Object.keys(HOME_BEHAVIOUR_CONTENT).sort()).toEqual([...HOME_CONCERNS].sort());
  });

  it('only lists known Home Behaviours and parts', () => {
    for (const gap of KNOWN_GAPS) {
      const [concern, part] = gap.split(':');
      expect(HOME_CONCERNS).toContain(concern);
      expect(CONTENT_PARTS).toContain(part);
    }
  });

  it('passes while barking at home has no Lesson and is listed', () => {
    expect(hasContent('bark-home', 'lesson')).toBe(false);
    expect(KNOWN_GAPS).toContain('bark-home:lesson');
  });

  // The two failures the guard exists for, checked against the same comparison with the inputs changed.
  const covered = (gaps: readonly string[], have: (c: string, p: string) => boolean) =>
    HOME_CONCERNS.flatMap((c) => CONTENT_PARTS.map((p) => `${c}:${p}`)).every((key) => gaps.includes(key) === !have(...(key.split(':') as [string, string])));

  it('fails when a gap is closed without removing its entry', () => {
    expect(covered(KNOWN_GAPS, (c, p) => `${c}:${p}` === 'bark-home:lesson')).toBe(false);
  });

  it('fails when content is missing and not listed', () => {
    expect(covered(KNOWN_GAPS.filter((g) => g !== 'destroy:node'), () => false)).toBe(false);
  });

  it('agrees with the shipped content', () => {
    expect(covered(KNOWN_GAPS, (c, p) => hasContent(c as (typeof HOME_CONCERNS)[number], p as (typeof CONTENT_PARTS)[number]))).toBe(true);
  });
});

describe('Home Behaviours section', () => {
  it('has one row per Home Behaviour, folded unless it is a Concern', () => {
    const rows = homeBehaviourEntries({ 'bark-home': 2 });
    expect(rows.map((r) => r.concern)).toEqual([...HOME_CONCERNS]);
    expect(rows.filter((r) => r.isConcern).map((r) => r.concern)).toEqual(['bark-home']);
    expect(rows.find((r) => r.concern === 'destroy')).toMatchObject({ level: 0, isConcern: false });
  });

  it('shows a placeholder for every Home Behaviour without a Lesson', () => {
    expect(homeBehaviourEntries({}).every((r) => r.comingSoon)).toBe(true);
  });

  it('becomes a Concern at level 1 with the answers kept', () => {
    const r = setHomeConcern(newDogRecord(), 'destroy', 1);
    expect(homeBehaviourEntries(r.homeConcerns).find((e) => e.concern === 'destroy')).toMatchObject({ level: 1, isConcern: true });
  });

  it('is in no World, so it is in no completion, unlock or progress count of the trail', () => {
    const stopIds = WORLDS.flatMap((w) => stopsOf(w).map((s) => s.id));
    for (const c of HOME_CONCERNS) for (const id of Object.values(HOME_BEHAVIOUR_CONTENT[c])) expect(stopIds).not.toContain(id);
    // the trail reads only Stops of Worlds, so Home Behaviours leave its completion and locks as they are
    const progress = progressOf([]);
    expect(WORLDS.some((w) => isWorldComplete(w, progress))).toBe(false);
    expect(WORLDS.map((w) => isWorldUnlocked(w, progress))).toEqual([true, ...WORLDS.slice(1).map(() => false)]);
  });

  it('counts toward its own progress only', () => {
    const content = { ...HOME_BEHAVIOUR_CONTENT, 'bark-home': { lesson: 'l1', node: 'n1', mission: 'm1' } };
    const done = { readLessons: ['l1'], completedNodes: [], missions: { m1: { passedOn: '2026-05-02' } } };
    expect(homeBehaviourProgress('bark-home', done, content)).toEqual({ done: 2, total: 3 });
    expect(homeBehaviourProgress('destroy', done, content)).toEqual({ done: 0, total: 0 });
  });
});
