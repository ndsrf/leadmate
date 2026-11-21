import { STAGE_SIGNALS } from '../../sim/messages';
import { loadDogRecord, newDogRecord, saveDogRecord, type KeyValueStore } from '../dogRecord';
import { feedbackHintId, feedbackKindSeen, markFeedbackKindSeen } from './hints';
import { closeMarksOn, COACH_ID, hintFor, HINT_IDS, hintsRemain, isControlIntroduced, markHintSeen } from './hints';

describe('hints', () => {
  it('maps each Stage signal to one hint', () => {
    expect(STAGE_SIGNALS.map((s) => hintFor(s, []))).toEqual(['leash-colors', 'marker', 'poste', null, 'dog-approaching', null, null, null]);
  });

  it('never turns the first input into a hint', () => {
    expect(hintFor('first-input', [])).toBeNull();
  });

  it('shows each hint once', () => {
    let r = newDogRecord();
    expect(hintFor('first-taut', r.seenHints)).toBe('leash-colors');
    r = markHintSeen(r, 'leash-colors');
    expect(hintFor('first-taut', r.seenHints)).toBeNull();
    expect(hintFor('leash-limit', r.seenHints)).toBe('poste');
  });

  it('does not repeat on replay after a restart', async () => {
    const data = new Map<string, string>();
    const store: KeyValueStore = { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
    await saveDogRecord(store, markHintSeen(markHintSeen(newDogRecord(), 'marker'), 'marker'));
    const reopened = await loadDogRecord(store);
    expect(reopened.seenHints).toEqual(['marker']);
    expect(hintFor('first-fixation', reopened.seenHints)).toBeNull();
  });

  it('shows the approaching-dog warning once', () => {
    expect(hintFor('dog-approaching', [])).toBe('dog-approaching');
    expect(hintFor('dog-approaching', ['dog-approaching'])).toBeNull();
  });

  it('counts the warning and both Coach marks among the hints left to show', () => {
    const rest = ['leash-colors', 'marker', 'marker-rhythm', 'poste'];
    expect(hintsRemain(rest)).toBe(true);
    expect(hintsRemain([...rest, 'dog-approaching', 'coach-move'])).toBe(true);
    expect(hintsRemain([...rest, 'dog-approaching', 'coach-move', 'coach-mark', 'coach-gather', 'coach-poste', 'coach-close-mark'])).toBe(false);
  });

  it('selects rhythm Hint at Full assist when unseen, otherwise follows marker rule', () => {
    // New user at Full assist
    expect(hintFor('first-fixation', [], 'full')).toBe('marker-rhythm');

    // Existing dog that saw marker before this change, now at Full assist
    expect(hintFor('first-fixation', ['marker'], 'full')).toBe('marker-rhythm');

    // Rhythm hint already seen at Full assist
    expect(hintFor('first-fixation', ['marker-rhythm', 'marker'], 'full')).toBeNull();

    // Assist below Full (e.g. ring) when rhythm hint unseen: shows marker hint
    expect(hintFor('first-fixation', [], 'ring')).toBe('marker');

    // Assist below Full when marker already seen
    expect(hintFor('first-fixation', ['marker'], 'ring')).toBeNull();
    expect(hintFor('first-fixation', ['marker'], 'late')).toBeNull();
    expect(hintFor('first-fixation', ['marker'], 'off')).toBeNull();
  });

  it('records both marker-rhythm and marker when marker-rhythm is marked seen', () => {
    let r = newDogRecord();
    expect(r.seenHints).toEqual([]);
    r = markHintSeen(r, 'marker-rhythm');
    expect(r.seenHints).toContain('marker-rhythm');
    expect(r.seenHints).toContain('marker');
  });

  it('never turns a control-used signal into a hint', () => {
    expect(hintFor('control-used', [])).toBeNull();
  });

  it('knows when nothing is left to show', () => {
    expect(hintsRemain([])).toBe(true);
    expect(hintsRemain([...HINT_IDS])).toBe(false);
  });

  it('gates the poste hint by introducedKinds: null when not introduced, poste when introduced or absent', () => {
    expect(hintFor('leash-limit', [], undefined, ['rigid-pull', 'marker-hit'])).toBeNull();
    expect(hintFor('leash-limit', [], undefined, ['poste', 'marker-hit'])).toBe('poste');
    expect(hintFor('leash-limit', [], undefined, undefined)).toBe('poste');
    expect(hintFor('leash-limit', [])).toBe('poste');
  });

  describe('isControlIntroduced mapping', () => {
    it('maps controls to their action kinds and always allows gather', () => {
      expect(isControlIntroduced('gather', [])).toBe(true);
      expect(isControlIntroduced('move', ['rigid-pull'])).toBe(true);
      expect(isControlIntroduced('move', ['marker-hit'])).toBe(false);
      expect(isControlIntroduced('poste', ['poste'])).toBe(true);
      expect(isControlIntroduced('poste', ['rigid-pull'])).toBe(false);
      expect(isControlIntroduced('mark', ['marker-hit'])).toBe(true);
      expect(isControlIntroduced('mark', ['rigid-pull'])).toBe(false);
      expect(isControlIntroduced('close-mark', ['marker-hit'])).toBe(true);
      expect(isControlIntroduced('close-mark', ['rigid-pull'])).toBe(false);
      // absent introducedKinds allows all
      expect(isControlIntroduced('move', undefined)).toBe(true);
      expect(isControlIntroduced('poste', undefined)).toBe(true);
    });
  });
});

describe('close-view Coach marks', () => {
  it('show all three on a first run', () => {
    expect(closeMarksOn([], {}, false)).toEqual({ gather: true, poste: true, marker: true });
  });

  it('drops a mark at the first press of its control, leaving the others', () => {
    expect(closeMarksOn([], { gather: true }, false)).toEqual({ gather: false, poste: true, marker: true });
  });

  it('drops every mark after the timeout', () => {
    expect(closeMarksOn([], {}, true)).toEqual({ gather: false, poste: false, marker: false });
  });

  it('does not show a mark again once it is recorded as seen (replay)', () => {
    const seen = [COACH_ID.gather, COACH_ID.poste, COACH_ID['close-mark']];
    expect(closeMarksOn(seen, {}, false)).toEqual({ gather: false, poste: false, marker: false });
  });

  it('does not count the walking Marker mark for the close Marker', () => {
    expect(closeMarksOn([COACH_ID.mark, COACH_ID.move], { mark: true, move: true }, false).marker).toBe(true);
  });

  it('gates close-view Coach marks by introducedKinds', () => {
    // without poste introduced
    expect(closeMarksOn([], {}, false, ['marker-hit'])).toEqual({ gather: true, poste: false, marker: true });
    // with poste introduced
    expect(closeMarksOn([], {}, false, ['marker-hit', 'poste'])).toEqual({ gather: true, poste: true, marker: true });
  });

  it('records each in seenHints with its own id, and has ids in HINT_IDS', () => {
    let r = newDogRecord();
    r = markHintSeen(r, COACH_ID.gather);
    expect(r.seenHints).toEqual(['coach-gather']);
    for (const id of Object.values(COACH_ID)) expect(HINT_IDS).toContain(id);
  });
});

describe('feedback seen kinds', () => {
  it('records feedback:<kind> once', () => {
    expect(feedbackHintId('marker-hit')).toBe('feedback:marker-hit');
    let r = newDogRecord();
    expect(feedbackKindSeen(r.seenHints, 'marker-hit')).toBe(false);
    r = markFeedbackKindSeen(r, 'marker-hit');
    r = markFeedbackKindSeen(r, 'marker-hit');
    expect(r.seenHints).toEqual(['feedback:marker-hit']);
    expect(feedbackKindSeen(r.seenHints, 'marker-hit')).toBe(true);
    expect(feedbackKindSeen(r.seenHints, 'wrong-cue')).toBe(false);
  });

  it('does not count as one of the hints left to show', () => {
    expect(hintsRemain(['feedback:marker-hit'])).toBe(true);
  });

  it('persists across a restart', async () => {
    const data = new Map<string, string>();
    const store: KeyValueStore = { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
    await saveDogRecord(store, markFeedbackKindSeen(newDogRecord(), 'poste'));
    expect((await loadDogRecord(store)).seenHints).toEqual(['feedback:poste']);
  });
});
