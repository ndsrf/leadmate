import { join } from 'node:path';
import { es, type TextKey } from '../../i18n';
import { LESSONS } from '../lessons/content';
import { ALL_NODES } from '../nodes/content';
import { MISSIONS } from '../missions/content';
import { WORLDS } from '../world';
import { loadPackFromDisk } from './loader';
import { resolvePack } from './resolver';
import { BASELINE_PACK } from './baseline.generated';

describe('Content Pack Parity', () => {
  const betaPackDir = join(__dirname, '../../../content/beta');
  const stablePackDir = join(__dirname, '../../../content/stable');
  const betaPack = loadPackFromDisk(betaPackDir);
  const stablePack = loadPackFromDisk(stablePackDir);
  const resolvedBeta = resolvePack(betaPack, 'es');
  const resolvedStable = resolvePack(stablePack, 'es');
  const resolvedBaseline = resolvePack(BASELINE_PACK, 'es');

  it('bundled stable baseline pack deep-equals content on disk (content/stable)', () => {
    expect(resolvedStable).toEqual(resolvedBaseline);
    expect(resolvedBeta.worlds.length).toBeGreaterThan(0);
    expect(resolvedBeta.lessons.length).toBeGreaterThan(0);
  });

  it('Worlds deep-equal resolved baseline pack', () => {
    expect(resolvedBaseline.worlds.length).toBe(WORLDS.length);
    for (let i = 0; i < WORLDS.length; i++) {
      const expected = WORLDS[i];
      const actual = resolvedBaseline.worlds.find((w) => w.id === expected.id);
      expect(actual).toBeDefined();
      expect(actual).toEqual(expected);
    }
  });

  it('Lessons deep-equal resolved baseline pack', () => {
    expect(resolvedBaseline.lessons.length).toBe(LESSONS.length);
    for (let i = 0; i < LESSONS.length; i++) {
      const expected = LESSONS[i];
      const actual = resolvedBaseline.lessons.find((l) => l.id === expected.id);
      expect(actual).toBeDefined();
      expect(actual).toEqual(expected);
    }
  });

  it('Nodes deep-equal resolved baseline pack', () => {
    expect(resolvedBaseline.nodes.length).toBe(ALL_NODES.length);
    for (let i = 0; i < ALL_NODES.length; i++) {
      const expected = ALL_NODES[i];
      const actual = resolvedBaseline.nodes.find((n) => n.id === expected.id);
      expect(actual).toBeDefined();
      expect(actual).toEqual(expected);
    }
  });

  it('Missions deep-equal resolved baseline pack', () => {
    expect(resolvedBaseline.missions.length).toBe(MISSIONS.length);
    for (let i = 0; i < MISSIONS.length; i++) {
      const expected = MISSIONS[i];
      const actual = resolvedBaseline.missions.find((m) => m.id === expected.id);
      expect(actual).toBeDefined();
      expect(actual).toEqual(expected);
    }
  });

  it('every content catalog key deep-equals the Spanish catalog with no diffs', () => {
    const resolved = resolvedBaseline;
    // Collect all expected content keys from TS definitions
    const expectedKeys = new Set<string>();

    for (const w of WORLDS) {
      expectedKeys.add(w.title);
      expectedKeys.add(w.topics);
    }

    for (const l of LESSONS) {
      expectedKeys.add(l.title);
      for (const b of l.blocks) {
        if (b.type === 'heading' || b.type === 'text' || b.type === 'tip' || b.type === 'notice') {
          expectedKeys.add(b.text);
        } else if (b.type === 'steps' || b.type === 'takeaways') {
          b.items.forEach((k) => expectedKeys.add(k));
        } else if (b.type === 'example') {
          expectedKeys.add(b.title);
          expectedKeys.add(b.text);
        } else if (b.type === 'compare') {
          expectedKeys.add(b.do.text);
          expectedKeys.add(b.dont.text);
        } else if (b.type === 'image' || b.type === 'video') {
          expectedKeys.add(b.alt);
          expectedKeys.add(b.caption);
        }
      }
    }

    for (const n of ALL_NODES) {
      expectedKeys.add(n.title);
      for (const c of n.primerCards) {
        expectedKeys.add(typeof c === 'string' ? c : c.text);
        if (typeof c !== 'string' && c.media?.caption) expectedKeys.add(c.media.caption);
      }
      for (const q of n.checkpoint) {
        expectedKeys.add(q.question);
        expectedKeys.add(q.explanation);
        for (const opt of q.options) expectedKeys.add(opt.text);
      }
      for (const e of n.exercises) expectedKeys.add(e.key);
      if (n.debrief) {
        expectedKeys.add(n.debrief.calm);
        expectedKeys.add(n.debrief.notCalm);
      }
    }

    for (const m of MISSIONS) {
      expectedKeys.add(m.title);
      expectedKeys.add(m.target);
      expectedKeys.add(m.successSign);
      for (const p of m.problems) {
        expectedKeys.add(p.label);
        for (const b of p.fix.blocks) {
          if (b.type === 'text') expectedKeys.add(b.text);
          else if (b.type === 'image') {
            expectedKeys.add(b.alt);
            expectedKeys.add(b.caption);
          }
        }
        expectedKeys.add(p.fix.easierTarget);
      }
      for (const b of m.generalFix.blocks) {
        if (b.type === 'text') expectedKeys.add(b.text);
        else if (b.type === 'image') {
          expectedKeys.add(b.alt);
          expectedKeys.add(b.caption);
        }
      }
      expectedKeys.add(m.generalFix.easierTarget);
    }

    // Shared interface/app notes that stay in app catalog
    const appShared = [
      'lesson.section.why',
      'lesson.section.how',
      'lesson.section.mistakes',
      'plan.note.professional',
      'lesson.note.vet',
      'lesson.note.alone',
    ];
    for (const k of appShared) expectedKeys.delete(k);

    const diffs: Array<{ key: string; expected: string; actual: string | undefined }> = [];
    for (const key of expectedKeys) {
      const expectedText = es[key as TextKey];
      const actualText = resolved.catalog[key];
      if (actualText !== expectedText) {
        diffs.push({ key, expected: expectedText, actual: actualText });
      }
    }

    expect(diffs).toEqual([]);
    expect(expectedKeys.size).toBeGreaterThan(1500);
  });
});
