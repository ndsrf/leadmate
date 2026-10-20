import { STAGE_SIGNALS } from '../../sim/messages';
import { loadDogRecord, newDogRecord, saveDogRecord, type KeyValueStore } from '../dogRecord';
import { hintFor, HINT_IDS, hintsRemain, markHintSeen } from './hints';

describe('hints', () => {
  it('maps each Stage signal to one hint', () => {
    expect(STAGE_SIGNALS.map((s) => hintFor(s, []))).toEqual(['leash-colors', 'marker', 'poste']);
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

  it('knows when nothing is left to show', () => {
    expect(hintsRemain([])).toBe(true);
    expect(hintsRemain([...HINT_IDS])).toBe(false);
  });
});
