import { STAGE_SIGNALS } from '../../sim/messages';
import { loadDogRecord, newDogRecord, saveDogRecord, type KeyValueStore } from '../dogRecord';
import { closeMarksOn, COACH_ID, hintFor, HINT_IDS, hintsRemain, markHintSeen } from './hints';

describe('hints', () => {
  it('maps each Stage signal to one hint', () => {
    expect(STAGE_SIGNALS.map((s) => hintFor(s, []))).toEqual(['leash-colors', 'marker', 'poste', null, 'dog-approaching', null]);
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
    const rest = ['leash-colors', 'marker', 'poste'];
    expect(hintsRemain(rest)).toBe(true);
    expect(hintsRemain([...rest, 'dog-approaching', 'coach-move'])).toBe(true);
    expect(hintsRemain([...rest, 'dog-approaching', 'coach-move', 'coach-mark', 'coach-gather', 'coach-poste', 'coach-close-mark'])).toBe(false);
  });

  it('never turns a control-used signal into a hint', () => {
    expect(hintFor('control-used', [])).toBeNull();
  });

  it('knows when nothing is left to show', () => {
    expect(hintsRemain([])).toBe(true);
    expect(hintsRemain([...HINT_IDS])).toBe(false);
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

  it('records each in seenHints with its own id, and has ids in HINT_IDS', () => {
    let r = newDogRecord();
    r = markHintSeen(r, COACH_ID.gather);
    expect(r.seenHints).toEqual(['coach-gather']);
    for (const id of Object.values(COACH_ID)) expect(HINT_IDS).toContain(id);
  });
});
