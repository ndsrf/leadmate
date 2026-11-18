import { createTranslator, en, es, type TextKey } from '../i18n';
import { FEEDBACK_ACTION_KINDS, feedbackKindOf, type FeedbackActionKind } from '../sim/feedbackKinds';
import type { SimEvent } from '../sim/sim';
import { FEEDBACK_RULES, FeedbackDecider, feedbackTextKey, TIER_SECONDS } from './feedback';

const hit = (time: number, grade: 'perfect' | 'good' = 'good'): SimEvent => ({ type: 'marker-hit', time, accuracyMs: 100, grade });
const checkIn = (time: number, grade: 'perfect' | 'good' = 'good'): SimEvent => ({ type: 'check-in-hit', time, grade });
const follow = (time: number): SimEvent => ({ type: 'dog-follow', time });
const rigid = (time: number): SimEvent => ({ type: 'tension-change', time, tension: 'rigid' });
const reactive = (time: number): SimEvent => ({ type: 'marker-reactive', time });

const step = (d: FeedbackDecider, time: number, ...events: SimEvent[]) => d.step({ time, events });

describe('right actions', () => {
  it('shows a right message for every right kind', () => {
    const events: SimEvent[] = [
      hit(0),
      checkIn(0),
      follow(0),
      { type: 'disengagement', time: 0, poste: false },
      { type: 'disengagement', time: 0, poste: true },
      { type: 'sintonia-start', time: 0 },
      { type: 'go-sniff-start', time: 0 },
    ];
    for (const e of events) {
      const m = step(new FeedbackDecider(), 0, e);
      expect(m?.polarity).toBe('right');
    }
  });

  it('answers a Check-in with the Hint first and the short form later', () => {
    const d = new FeedbackDecider();
    const first = step(d, 0, checkIn(0));
    expect(first).toMatchObject({ kind: 'check-in-hit', firstTime: true, textKey: 'feedback.check-in-hit.full' });
    const later = step(d, 20, checkIn(20));
    expect(later).toMatchObject({ kind: 'check-in-hit', firstTime: false, textKey: 'feedback.check-in-hit.short' });
  });

  it('uses the short form for kinds already seen', () => {
    const d = new FeedbackDecider({ seenKinds: ['check-in-hit'] });
    expect(step(d, 0, checkIn(0))).toMatchObject({ firstTime: false, textKey: 'feedback.check-in-hit.short' });
  });

  it('does not count a Hint that was dropped as shown', () => {
    const d = new FeedbackDecider();
    step(d, 0, reactive(0)); // wrong message on screen
    expect(step(d, 0.1, checkIn(0.1))).toBeNull();
    expect(step(d, 10, checkIn(10))).toMatchObject({ firstTime: true });
  });

  it('makes Perfect medium and Good small', () => {
    expect(step(new FeedbackDecider(), 0, hit(0, 'perfect'))?.tier).toBe('medium');
    expect(step(new FeedbackDecider(), 0, hit(0, 'good'))?.tier).toBe('small');
    expect(step(new FeedbackDecider(), 0, checkIn(0, 'perfect'))?.tier).toBe('medium');
  });

  it('makes poste and let-go medium and the rest of the right actions small', () => {
    expect(step(new FeedbackDecider(), 0, { type: 'disengagement', time: 0, poste: true })).toMatchObject({ kind: 'poste', tier: 'medium' });
    expect(step(new FeedbackDecider(), 0, { type: 'disengagement', time: 0, poste: false })).toMatchObject({ kind: 'disengagement', tier: 'medium' });
    expect(step(new FeedbackDecider(), 0, follow(0))?.tier).toBe('small');
    expect(step(new FeedbackDecider(), 0, { type: 'go-sniff-start', time: 0 })?.tier).toBe('small');
  });

  it('shows nothing for events that are not handled actions', () => {
    const d = new FeedbackDecider();
    expect(step(d, 0, { type: 'fixation-start', time: 0 }, { type: 'poste-stop', time: 0, abrupt: false, outwardSpeed: 1, arousalBump: 0 })).toBeNull();
  });
});

describe('wrong actions', () => {
  it('shows a wrong message with the wrong tier for every wrong kind', () => {
    const events: SimEvent[] = [
      { type: 'marker-miss', time: 0 },
      { type: 'marker-late', time: 0 },
      reactive(0),
      { type: 'marker-wasted', time: 0 },
      { type: 'missed-opportunity', time: 0 },
      { type: 'cue-mismatch', time: 0, cue: 'lets-go' },
      { type: 'poste-stop', time: 0, abrupt: true, outwardSpeed: 1, arousalBump: 0 },
      rigid(0),
      { type: 'go-sniff-end', time: 0, reason: 'tension' },
    ];
    for (const e of events) expect(step(new FeedbackDecider(), 0, e)).toMatchObject({ polarity: 'wrong', tier: 'wrong' });
  });

  it('shows no message for a gentle stop or a Go Sniff that ended on time', () => {
    const d = new FeedbackDecider();
    expect(step(d, 0, { type: 'poste-stop', time: 0, abrupt: false, outwardSpeed: 1, arousalBump: 0 }, { type: 'go-sniff-end', time: 0, reason: 'time' })).toBeNull();
  });

  it('says what to try next in every wrong text', () => {
    const tr = createTranslator(en);
    const trEs = createTranslator(es);
    for (const kind of Object.keys(FEEDBACK_ACTION_KINDS) as FeedbackActionKind[]) {
      if (FEEDBACK_ACTION_KINDS[kind] !== 'wrong') continue;
      for (const form of ['full', 'short'] as const) {
        const key = feedbackTextKey(kind, form);
        expect(tr(key)).toMatch(/[.!]/);
        expect(trEs(key).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Hints and the Taste Stage', () => {
  it('shows the leash Hint through the same slot, once per Stage', () => {
    const d = new FeedbackDecider();
    expect(d.step({ time: 0, events: [], tension: 'slack' })).toBeNull();
    expect(d.step({ time: 1, events: [], tension: 'taut' })).toMatchObject({ kind: 'leash-hint', textKey: 'hint.taut', firstTime: false });
    expect(d.step({ time: 9, events: [], tension: 'slack' })).toBeNull();
    expect(d.step({ time: 10, events: [], tension: 'taut' })).toBeNull();
  });

  it('shows only the Hint, not a Rigid Pull message, on the first Rigid Pull', () => {
    const d = new FeedbackDecider();
    const m = d.step({ time: 5, events: [rigid(5)], tension: 'rigid' });
    expect(m).toMatchObject({ kind: 'leash-hint', textKey: 'hint.rigid' });
    // the Hint still holds the slot, so the same-event message does not appear at its side
    expect(d.step({ time: 6, events: [{ type: 'marker-reactive', time: 6 }], tension: 'rigid' })).toBeNull();
  });

  it('lets the Hint win over a Feedback Message due on the same tick', () => {
    const d = new FeedbackDecider();
    const m = d.step({ time: 1, events: [reactive(1), checkIn(1)], tension: 'taut' });
    expect(m?.kind).toBe('leash-hint');
  });

  it('shows a Rigid Pull message on a later Rigid Pull after the Hint was used', () => {
    const d = new FeedbackDecider();
    d.step({ time: 0, events: [rigid(0)], tension: 'rigid' });
    expect(d.step({ time: 10, events: [rigid(10)], tension: 'rigid' })).toMatchObject({ kind: 'rigid-pull' });
  });

  it('drops every wrong kind in the Taste Stage', () => {
    const d = new FeedbackDecider({ isTasteStage: true });
    expect(step(d, 0, reactive(0), { type: 'marker-miss', time: 0 }, rigid(0))).toBeNull();
  });

  it('shows right kinds in the Taste Stage but never offers a Hint to record', () => {
    const d = new FeedbackDecider({ isTasteStage: true });
    expect(step(d, 0, checkIn(0))).toMatchObject({ firstTime: false, textKey: 'feedback.check-in-hit.short' });
  });
});

describe('one message at a time', () => {
  it('lets the wrong message win over the right one on the same tick', () => {
    const d = new FeedbackDecider();
    expect(step(d, 0, checkIn(0), rigid(0))).toMatchObject({ kind: 'rigid-pull' });
  });

  it('lets the higher tier win between two right messages', () => {
    const d = new FeedbackDecider();
    expect(step(d, 0, follow(0), hit(0, 'perfect'))).toMatchObject({ kind: 'marker-hit', tier: 'medium' });
  });

  it('drops a losing message instead of queueing it', () => {
    const d = new FeedbackDecider();
    step(d, 0, rigid(0));
    expect(step(d, 0.1, checkIn(0.1))).toBeNull();
    expect(step(d, 0.2, follow(0.2))).toBeNull();
    // once the wrong message has finished, nothing from the dropped ones appears
    expect(d.current(TIER_SECONDS.wrong + 0.1)).toBeNull();
    expect(step(d, 2)).toBeNull();
  });

  it('replaces a showing message only when the new one would win', () => {
    const d = new FeedbackDecider();
    step(d, 0, follow(0));
    expect(step(d, 0.1, hit(0.1, 'perfect'))).toMatchObject({ kind: 'marker-hit' });
    expect(step(d, 0.2, follow(0.2))).toBeNull();
    expect(step(d, 0.3, reactive(0.3))).toMatchObject({ kind: 'reactive-marker' });
  });

  it('shows nothing after five right actions in one second once they have finished', () => {
    const d = new FeedbackDecider();
    const kinds = [follow, checkIn, hit, follow, checkIn];
    kinds.forEach((make, i) => step(d, i * 0.2, make(i * 0.2)));
    expect(d.current(1.0 + TIER_SECONDS.big + 0.01)).toBeNull();
  });
});

describe('Combos', () => {
  it('merges three turns within 4 s into one message updated to x2 and x3', () => {
    const d = new FeedbackDecider({ seenKinds: ['followed-turn'] });
    expect(step(d, 0, follow(0))?.combo).toBe(1);
    expect(step(d, 3, follow(3))).toMatchObject({ kind: 'followed-turn', combo: 2 });
    expect(step(d, 6, follow(6))).toMatchObject({ kind: 'followed-turn', combo: 3, tier: 'big' });
  });

  it('starts over when more than 4 s pass', () => {
    const d = new FeedbackDecider();
    step(d, 0, follow(0));
    expect(step(d, 4.5, follow(4.5))?.combo).toBe(1);
  });

  it('keeps a Combo per kind', () => {
    const d = new FeedbackDecider();
    step(d, 0, follow(0));
    expect(step(d, 1, checkIn(1))?.combo).toBe(1);
  });

  it('ends every Combo on a wrong action', () => {
    const d = new FeedbackDecider();
    step(d, 0, follow(0));
    step(d, 1, follow(1));
    step(d, 2, reactive(2));
    expect(step(d, 2.2, follow(2.2))).toBeNull(); // wrong still showing
    // the dropped turn at 2.2 restarted the count at 1; without the reset this would be 4
    expect(step(d, 5, follow(5))?.combo).toBe(2);
  });
});

describe('Rigid Pull rate limit', () => {
  it('shows the Rigid Pull message at most three times in 20 s', () => {
    const d = new FeedbackDecider();
    // first one's Hint was spent earlier in the Stage
    d.step({ time: -100, events: [], tension: 'rigid' });
    let shown = 0;
    for (let t = 0; t <= 20; t += 0.5) {
      if (step(d, t, rigid(t))?.kind === 'rigid-pull') shown += 1;
    }
    expect(shown).toBeLessThanOrEqual(3);
    expect(shown).toBeGreaterThanOrEqual(2);
  });

  it('does not let a rate-limited Rigid Pull hold back a right message', () => {
    const d = new FeedbackDecider();
    d.step({ time: -100, events: [], tension: 'rigid' });
    step(d, 0, rigid(0));
    expect(step(d, 5, rigid(5), checkIn(5))).toMatchObject({ kind: 'check-in-hit' });
  });
});

describe('Stage Meters', () => {
  const points = (time: number, kind: FeedbackActionKind, full: boolean): SimEvent => ({ type: 'meter-points', time, meterId: 'nose', kind, points: 2, value: full ? 10 : 4, full });

  it('carries the Meter Points and the meter on the message of the action that filled it', () => {
    const m = step(new FeedbackDecider(), 0, follow(0), points(0, 'followed-turn', false));
    expect(m).toMatchObject({ meterPoints: 2, meter: { id: 'nose', value: 4, full: false } });
  });

  it('makes a message that fills a meter big', () => {
    expect(step(new FeedbackDecider(), 0, follow(0), points(0, 'followed-turn', true))).toMatchObject({ tier: 'big', meter: { full: true } });
  });

  it('adds nothing in Stages without meters', () => {
    const m = step(new FeedbackDecider(), 0, follow(0));
    expect(m).not.toHaveProperty('meter');
    expect(m).not.toHaveProperty('meterPoints');
  });
});

describe('determinism', () => {
  it('gives the same messages for the same events', () => {
    const run = () => {
      const d = new FeedbackDecider();
      return [step(d, 0, follow(0)), step(d, 1, follow(1)), step(d, 2, reactive(2)), step(d, 9, checkIn(9))];
    };
    expect(run()).toEqual(run());
  });
});

describe('texts', () => {
  const kinds = Object.keys(FEEDBACK_ACTION_KINDS) as FeedbackActionKind[];

  it('has a rule for every kind', () => {
    expect(Object.keys(FEEDBACK_RULES).sort()).toEqual([...kinds].sort());
  });

  it('has a full and a short text in Spanish and English for every kind', () => {
    for (const kind of kinds) {
      for (const form of ['full', 'short'] as const) {
        const key = feedbackTextKey(kind, form) as TextKey;
        expect(es[key]).toBeTruthy();
        expect(en[key]).toBeTruthy();
      }
    }
    expect(es['feedback.combo']).toContain('{n}');
    expect(en['feedback.combo']).toContain('{n}');
  });
});

describe('scent-walk kinds', () => {
  const cases: [FeedbackActionKind, SimEvent][] = [
    ['granted-sniff', { type: 'go-sniff-start', time: 0, scent: 'granted' } as SimEvent],
    ['empty-sniff', { type: 'go-sniff-start', time: 0, scent: 'empty' } as SimEvent],
    ['waited-plant', { type: 'plant-end', time: 0, result: 'waited' } as SimEvent],
    ['dragged-plant', { type: 'plant-end', time: 0, result: 'dragged' } as SimEvent],
    ['waited-marking', { type: 'marking-end', time: 0, result: 'waited' } as SimEvent],
    ['interrupted-marking', { type: 'marking-end', time: 0, result: 'interrupted' } as SimEvent],
    ['check-in-after-change', { type: 'change-check-in', time: 0, change: 'left-turn', grade: 'good' } as SimEvent],
    ['scent-dragged-past', { type: 'scent-dragged-past', time: 0 } as SimEvent],
    ['fresh-move', { type: 'walk-change', time: 0, change: 'left-turn', novelty: 1, freshness: 'fresh', followed: true, pos: { x: 0, y: 0 } } as SimEvent],
    ['repeated-move-ignored', { type: 'walk-change', time: 0, change: 'left-turn', novelty: 0.1, freshness: 'repeated', followed: false, pos: { x: 0, y: 0 } } as SimEvent],
    ['chain', { type: 'chain' } as unknown as SimEvent],
    ['leave-it-food', { type: 'food-left' } as unknown as SimEvent],
    ['food-eaten', { type: 'food-eaten' } as unknown as SimEvent],
    ['smart-jackpot', { type: 'jackpot', time: 0, result: 'smart' } as unknown as SimEvent],
    ['wasted-jackpot', { type: 'jackpot', time: 0, result: 'wasted' } as unknown as SimEvent],
  ];
  it.each(cases)('shows %s with its polarity and Hint', (kind, event) => {
    const m = step(new FeedbackDecider(), 0, event);
    expect(m).toMatchObject({ kind, polarity: FEEDBACK_ACTION_KINDS[kind], textKey: `feedback.${kind}.full` });
  });

  it('tiers: waited Plant and waited marking medium, Chain big, wrong kinds wrong', () => {
    expect(FEEDBACK_RULES['waited-plant'].tier).toBe('medium');
    expect(FEEDBACK_RULES['waited-marking'].tier).toBe('medium');
    expect(FEEDBACK_RULES['smart-jackpot'].tier).toBe('medium');
    expect(FEEDBACK_RULES.chain.tier).toBe('big');
    for (const k of Object.keys(FEEDBACK_ACTION_KINDS) as FeedbackActionKind[]) {
      if (FEEDBACK_ACTION_KINDS[k] === 'wrong') expect(FEEDBACK_RULES[k].tier).toBe('wrong');
    }
  });

  it('shows one message for a Check-in hit paired with a change Check-in', () => {
    const m = step(new FeedbackDecider(), 0, checkIn(0), { type: 'change-check-in', time: 0, change: 'left-turn', grade: 'good' } as SimEvent);
    expect(m?.kind).toBe('check-in-after-change');
  });

  it('shows one message for a followed fresh turn, and none for a followed stop', () => {
    const fresh = { type: 'walk-change', time: 0, change: 'left-turn', novelty: 1, freshness: 'fresh', followed: true, pos: { x: 0, y: 0 } } as SimEvent;
    expect(step(new FeedbackDecider(), 0, fresh, { type: 'dog-follow', time: 0, change: 'left-turn' })?.kind).toBe('fresh-move');
    expect(feedbackKindOf({ type: 'dog-follow', time: 0, change: 'stop' })).toBeNull();
    expect(feedbackKindOf({ type: 'dog-follow', time: 0 })).toBe('followed-turn');
  });

  it('gives a Perfect change Check-in the medium tier', () => {
    const m = step(new FeedbackDecider(), 0, checkIn(0, 'perfect'), { type: 'change-check-in', time: 0, change: 'left-turn', grade: 'perfect' } as SimEvent);
    expect(m).toMatchObject({ kind: 'check-in-after-change', tier: 'medium' });
  });

  it('says what to try for Dragged Plant and Repeated move', () => {
    expect(en['feedback.dragged-plant.full']).toMatch(/sniffing/);
    expect(en['feedback.dragged-plant.full']).toMatch(/turn/);
    expect(en['feedback.repeated-move-ignored.full']).toMatch(/expected/);
    expect(es['feedback.repeated-move-ignored.full']).toMatch(/esperaba/);
  });

  it('has Spanish and English text for every kind, with a name slot', () => {
    for (const k of Object.keys(FEEDBACK_ACTION_KINDS) as FeedbackActionKind[]) {
      for (const form of ['full', 'short'] as const) {
        const key = feedbackTextKey(k, form);
        expect((es as Record<string, string>)[key]).toBeTruthy();
        expect((en as Record<string, string>)[key]).toBeTruthy();
        if (form === 'full' && !['go-sniff-cut-short', 'harsh-stop', 'wrong-cue'].includes(k)) {
          expect(`${k}: ${(es as Record<string, string>)[key]}`).toContain('{name}');
          expect(`${k}: ${(en as Record<string, string>)[key]}`).toContain('{name}');
        }
      }
    }
  });
});

describe('perfectRun (task 3.1)', () => {
  it('increments on Perfect hits regardless of time between them', () => {
    const d = new FeedbackDecider();
    const m1 = step(d, 0, hit(0, 'perfect'));
    expect(m1?.perfectRun).toBe(1);

    // 20 seconds later
    const m2 = step(d, 20, hit(20, 'perfect'));
    expect(m2?.perfectRun).toBe(2);

    // Another 30 seconds later with check-in hit
    const m3 = step(d, 50, checkIn(50, 'perfect'));
    expect(m3?.perfectRun).toBe(3);
  });

  it('starts at 0 in a new decider', () => {
    const d = new FeedbackDecider();
    const m = step(d, 0, hit(0, 'perfect'));
    expect(m?.perfectRun).toBe(1);
  });

  it('resets on Good Marker hit', () => {
    const d = new FeedbackDecider();
    step(d, 0, hit(0, 'perfect'));
    step(d, 1, hit(1, 'perfect'));

    const good = step(d, 2, hit(2, 'good'));
    expect(good?.perfectRun).toBeUndefined();

    const nextPerfect = step(d, 3, hit(3, 'perfect'));
    expect(nextPerfect?.perfectRun).toBe(1);
  });

  it('resets on marker-miss, marker-late, marker-reactive, and marker-wasted', () => {
    for (const wrongEvent of [
      { type: 'marker-miss', time: 10 } as SimEvent,
      { type: 'marker-late', time: 10 } as SimEvent,
      reactive(10),
      { type: 'marker-wasted', time: 10 } as SimEvent,
    ]) {
      const d = new FeedbackDecider();
      step(d, 0, hit(0, 'perfect'));
      step(d, 1, hit(1, 'perfect'));

      step(d, 10, wrongEvent);

      const next = step(d, 20, hit(20, 'perfect'));
      expect(next?.perfectRun).toBe(1);
    }
  });

  it('is not touched by missed-opportunity', () => {
    const d = new FeedbackDecider();
    step(d, 0, hit(0, 'perfect'));
    step(d, 1, hit(1, 'perfect'));

    step(d, 10, { type: 'missed-opportunity', time: 10 });

    const next = step(d, 20, hit(20, 'perfect'));
    expect(next?.perfectRun).toBe(3);
  });

  it('carries perfectRun on change-check-in when graded Perfect', () => {
    const d = new FeedbackDecider();
    const m = step(
      d,
      0,
      checkIn(0, 'perfect'),
      { type: 'change-check-in', time: 0, change: 'left-turn', grade: 'perfect' } as SimEvent
    );
    expect(m?.kind).toBe('check-in-after-change');
    expect(m?.perfectRun).toBe(1);

    const m2 = step(
      d,
      10,
      checkIn(10, 'perfect'),
      { type: 'change-check-in', time: 10, change: 'right-turn', grade: 'perfect' } as SimEvent
    );
    expect(m2?.kind).toBe('check-in-after-change');
    expect(m2?.perfectRun).toBe(2);
  });
});

