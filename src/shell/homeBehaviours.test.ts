import { HOME_CONCERNS } from './concerns';
import { newDogRecord, setHomeConcern } from './dogRecord';
import { contentGaps, CONTENT_PARTS, HOME_BEHAVIOUR_CONTENT, homeBehaviourEntries, homeBehaviourProgress, KNOWN_GAPS, hasContent, REQUIRED_PARTS, behaviourActions, homeConcernOfStop, homeMissionAfter, isHomeMission, isHomeStretchId } from './homeBehaviours';
import { isWorldComplete, isWorldUnlocked, missionOfStop, progressOf, stopsOf, worldOfNode, WORLDS } from './world';

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

  it('has no known gap left: every Home Behaviour has every part it requires', () => {
    expect(KNOWN_GAPS).toEqual([]);
    expect(contentGaps()).toEqual([]);
    for (const c of HOME_CONCERNS) for (const part of REQUIRED_PARTS[c]) expect(hasContent(c, part)).toBe(true);
  });

  it('gives the biting concerns a Lesson and a Mission and no exercise, and the others all three', () => {
    for (const c of ['bite-owner', 'bite-others'] as const) expect(Object.keys(HOME_BEHAVIOUR_CONTENT[c]).sort()).toEqual(['lesson', 'mission']);
    for (const c of ['bark-home', 'destroy', 'eat-objects'] as const) expect(Object.keys(HOME_BEHAVIOUR_CONTENT[c]).sort()).toEqual(['lesson', 'mission', 'node']);
  });

  // The two failures the guard exists for, checked against the same comparison with the inputs changed.
  const covered = (gaps: readonly string[], have: (c: string, p: string) => boolean) =>
    HOME_CONCERNS.flatMap((c) => REQUIRED_PARTS[c].map((p) => `${c}:${p}`)).every((key) => gaps.includes(key) === !have(...(key.split(':') as [string, string])));

  it('fails when a gap is closed without removing its entry', () => {
    expect(covered(['bark-home:lesson'], () => true)).toBe(false);
  });

  it('fails when content is missing and not listed', () => {
    expect(covered(KNOWN_GAPS, (c, p) => `${c}:${p}` !== 'destroy:node')).toBe(false);
  });

  it('agrees with the shipped content', () => {
    expect(covered(KNOWN_GAPS, (c, p) => hasContent(c as (typeof HOME_CONCERNS)[number], p as (typeof CONTENT_PARTS)[number]))).toBe(true);
  });
});

describe('Required parts', () => {
  it('never requires an exercise for the biting concerns', () => {
    expect(REQUIRED_PARTS['bite-owner']).toEqual(['lesson', 'mission']);
    expect(REQUIRED_PARTS['bite-others']).toEqual(['lesson', 'mission']);
    expect(KNOWN_GAPS).not.toContain('bite-owner:node');
    expect(KNOWN_GAPS).not.toContain('bite-others:node');
  });

  it('has no gap for a biting concern with a lesson and a mission', () => {
    const have = (c: string, p: string) => c === 'bite-owner' && p !== 'node';
    const gaps = REQUIRED_PARTS['bite-owner'].filter((p) => !have('bite-owner', p));
    expect(gaps).toEqual([]);
  });

  it('counts two parts toward the progress of biting', () => {
    const content = { ...HOME_BEHAVIOUR_CONTENT, 'bite-owner': { lesson: 'l', mission: 'm' } };
    expect(homeBehaviourProgress('bite-owner', { readLessons: [], completedNodes: [], missions: {} }, content).total).toBe(2);
  });
});

describe('Home Behaviours section', () => {
  it('has one row per Home Behaviour, folded unless it is a Concern', () => {
    const rows = homeBehaviourEntries({ 'bark-home': 2 });
    expect(rows.map((r) => r.concern)).toEqual([...HOME_CONCERNS]);
    expect(rows.filter((r) => r.isConcern).map((r) => r.concern)).toEqual(['bark-home']);
    expect(rows.find((r) => r.concern === 'destroy')).toMatchObject({ level: 0, isConcern: false });
  });

  it('shows no placeholder: every Home Behaviour has a Lesson', () => {
    expect(homeBehaviourEntries({}).some((r) => r.comingSoon)).toBe(false);
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
    expect(homeBehaviourProgress('destroy', done, content)).toEqual({ done: 0, total: 3 });
    expect(homeBehaviourProgress('bite-owner', done, content)).toEqual({ done: 0, total: 2 });
  });

  it('keeps every Home Behaviour Stop out of the static WORLDS: they join World 1 per Dog (see world.test.ts)', () => {
    const stops = WORLDS.flatMap((w) => stopsOf(w));
    for (const c of HOME_CONCERNS) {
      const own = HOME_BEHAVIOUR_CONTENT[c];
      expect(stops.some((s) => s.id === own.lesson || s.id === own.node || s.id === own.mission)).toBe(false);
      expect(worldOfNode(own.node ?? '')).toBeUndefined();
    }
    // off the trail a Home Stop still names the Mission that ends its Stretch
    expect(missionOfStop({ kind: 'node', id: 'bark-home' })).toBe('mission-bark-home');
    expect(missionOfStop({ kind: 'lesson', id: 'theory-bite-owner' })).toBe('mission-bite-owner');
    // finishing all of it changes nothing of the static trail
    const all = HOME_CONCERNS.flatMap((c) => (HOME_BEHAVIOUR_CONTENT[c].node ? [HOME_BEHAVIOUR_CONTENT[c].node!] : []));
    expect(WORLDS.map((w) => isWorldComplete(w, progressOf(all)))).toEqual(WORLDS.map(() => false));
    expect(WORLDS.map((w) => isWorldUnlocked(w, progressOf(all)))).toEqual(WORLDS.map((w) => isWorldUnlocked(w, progressOf([]))));
  });
});

describe('Home Behaviour buttons', () => {
  const none = { readLessons: [], completedNodes: [], missions: {} };
  const entry = (concern: (typeof HOME_CONCERNS)[number], isConcern: boolean) => ({ concern, isConcern });

  it('shows only the parts that exist: a biting row has no Exercise button', () => {
    expect(behaviourActions(entry('bite-owner', true), none).map((a) => a.part)).toEqual(['lesson', 'mission']);
    expect(behaviourActions(entry('bark-home', true), none).map((a) => a.part)).toEqual(['lesson', 'node', 'mission']);
  });

  it('enables the Lesson, the Exercise and the Mission whether or not the behaviour is a Concern', () => {
    expect(behaviourActions(entry('destroy', false), none).map((a) => [a.part, a.enabled])).toEqual([['lesson', true], ['node', true], ['mission', true]]);
    expect(behaviourActions(entry('destroy', true), none).every((a) => a.enabled)).toBe(true);
  });

  it('lists in Other Home Behaviours only the behaviours whose Stretch is not in World 1', () => {
    expect(homeBehaviourEntries({}).map((e) => e.concern)).toEqual([...HOME_CONCERNS]);
    expect(homeBehaviourEntries({ destroy: 1 }, (c) => c === 'destroy').map((e) => e.concern)).toEqual(HOME_CONCERNS.filter((c) => c !== 'destroy'));
    expect(homeBehaviourEntries({}, () => true)).toEqual([]);
    expect(setHomeConcern(newDogRecord(), 'destroy', 1).homeConcerns.destroy).toBe(1);
  });

  it('marks each part done from the record', () => {
    const done = { readLessons: ['theory-destroy'], completedNodes: ['destroy'], missions: { 'mission-destroy': { passedOn: '2026-11-01' } } };
    expect(behaviourActions(entry('destroy', true), done).map((a) => a.done)).toEqual([true, true, true]);
    expect(behaviourActions(entry('destroy', true), none).map((a) => a.done)).toEqual([false, false, false]);
  });
});

describe('Home Behaviour navigation', () => {
  const record = (level: 0 | 1, missions = {}) => ({ homeConcerns: level ? { 'bark-home': 1 as const, 'bite-owner': 1 as const } : {}, missions });

  it('finds the Home Behaviour of a Stop, and of a Home Mission', () => {
    expect(homeConcernOfStop({ kind: 'node', id: 'eat-objects' })).toBe('eat-objects');
    expect(homeConcernOfStop({ kind: 'node', id: 'calm-first' })).toBeUndefined();
    expect(isHomeMission('mission-bite-others')).toBe(true);
    expect(isHomeMission('mission-calm-first')).toBe(false);
    expect(isHomeStretchId('theory-bark-home')).toBe(true);
    expect(isHomeStretchId('theory-calm-first')).toBe(false);
  });

  it('opens the Mission brief after a Home Node, or after the Lesson of a biting behaviour, once and only for a Concern', () => {
    expect(homeMissionAfter({ kind: 'node', id: 'bark-home' }, record(1))).toBe('mission-bark-home');
    expect(homeMissionAfter({ kind: 'lesson', id: 'theory-bark-home' }, record(1))).toBeNull();
    expect(homeMissionAfter({ kind: 'lesson', id: 'theory-bite-owner' }, record(1))).toBe('mission-bite-owner');
    expect(homeMissionAfter({ kind: 'node', id: 'bark-home' }, record(0))).toBeNull();
    expect(homeMissionAfter({ kind: 'node', id: 'bark-home' }, record(1, { 'mission-bark-home': { startedAt: '2026-11-01T10:00:00.000Z' } }))).toBeNull();
    expect(homeMissionAfter({ kind: 'node', id: 'bark-home' }, record(1, { 'mission-bark-home': { passedOn: '2026-11-01' } }))).toBeNull();
    expect(homeMissionAfter({ kind: 'node', id: 'calm-first' }, record(1))).toBeNull();
  });
});

describe('biting content points to the hand drill (task 3.5)', () => {
  const { es: catalog } = require('../i18n/es');
  const { findLesson } = require('./lessons/content');
  const { findMission } = require('./missions/content');
  const { findNode } = require('./nodes/content');
  const { stopsOf, WORLDS } = require('./world');

  it('mentions the drill in both biting Lessons, after their professional-help note, as calm practice and not as a bite exercise', () => {
    for (const id of ['theory-bite-owner', 'theory-bite-others']) {
      const blocks = findLesson(id).blocks as { type: string; text?: string }[];
      const notice = blocks.findIndex((b) => b.type === 'notice' && b.text === 'plan.note.professional');
      const tip = blocks.findIndex((b) => b.type === 'tip');
      expect(notice).toBeGreaterThanOrEqual(0);
      expect(tip).toBeGreaterThan(notice);
      const text = catalog[blocks[tip].text as keyof typeof catalog] as string;
      expect(text).toContain('Manos y correa en calma');
      expect(text).toMatch(/no un ejercicio contra mordiscos/);
    }
  });

  it('mentions the drill in both biting Missions', () => {
    for (const id of ['mission-bite-owner', 'mission-bite-others']) expect(catalog[findMission(id).target as keyof typeof catalog]).toContain('primer ejercicio del Mundo 1');
  });

  it('keeps the required parts and gives no biting Home Stretch a Node', () => {
    expect(REQUIRED_PARTS['bite-owner']).toEqual(['lesson', 'mission']);
    expect(REQUIRED_PARTS['bite-others']).toEqual(['lesson', 'mission']);
    for (const c of ['bite-owner', 'bite-others'] as const) expect(hasContent(c, 'node')).toBe(false);
    expect(findNode('calm-hands')).toBeDefined();
    expect(stopsOf(WORLDS[0]).some((s: { id: string }) => s.id === 'calm-hands')).toBe(true);
  });

  it('keeps the drill free of any mention of biting', () => {
    for (const key of Object.keys(catalog).filter((k) => k.startsWith('node.calmhands.'))) expect(catalog[key as keyof typeof catalog]).not.toMatch(/mord|muerd|mordisc/i);
  });
});
