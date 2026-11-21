import { dropStale, elapseHint, EMPTY_HINT_QUEUE, offerHint } from './hintQueue';

const MS = 4000;

describe('the Hint queue', () => {
  it('shows a Hint at once when nothing is shown', () => {
    const q = offerHint(EMPTY_HINT_QUEUE, { id: 'leash-colors' }, MS);
    expect(q.current?.id).toBe('leash-colors');
    expect(q.remainingMs).toBe(MS);
  });

  it('makes a second sign wait until the first ends, then shows it', () => {
    let q = offerHint(EMPTY_HINT_QUEUE, { id: 'leash-colors' }, MS);
    q = offerHint(q, { id: 'sign-eye', sign: 'eye' }, MS);
    expect(q.current?.id).toBe('leash-colors');
    expect(q.waiting.map((w) => w.id)).toEqual(['sign-eye']);
    q = elapseHint(q, 3000, false, MS);
    expect(q.current?.id).toBe('leash-colors');
    q = elapseHint(q, 1000, false, MS);
    expect(q.current?.id).toBe('sign-eye');
    expect(q.waiting).toEqual([]);
    q = elapseHint(q, MS, false, MS);
    expect(q.current).toBeNull();
  });

  it('shows the first Fixation before the approaching-dog warning, and that before the rest', () => {
    let q = offerHint(EMPTY_HINT_QUEUE, { id: 'leash-colors' }, MS);
    q = offerHint(q, { id: 'sign-alert', sign: 'alert' }, MS);
    q = offerHint(q, { id: 'dog-approaching', bearing: 1 }, MS);
    q = offerHint(q, { id: 'fixation-ring' }, MS);
    expect(q.waiting.map((w) => w.id)).toEqual(['fixation-ring', 'dog-approaching', 'sign-alert']);
  });

  it('never queues the same Hint twice', () => {
    let q = offerHint(EMPTY_HINT_QUEUE, { id: 'leash-colors' }, MS);
    q = offerHint(q, { id: 'sign-eye', sign: 'eye' }, MS);
    expect(offerHint(q, { id: 'sign-eye', sign: 'eye' }, MS)).toBe(q);
    expect(offerHint(q, { id: 'leash-colors' }, MS)).toBe(q);
  });

  it('drops a waiting Hint whose sign has gone, so it never shows', () => {
    let q = offerHint(EMPTY_HINT_QUEUE, { id: 'leash-colors' }, MS);
    q = offerHint(q, { id: 'sign-eye', sign: 'eye' }, MS);
    q = dropStale(q, 'eye');
    expect(q.waiting).toEqual([]);
    q = elapseHint(q, MS, false, MS);
    expect(q.current).toBeNull();
  });

  it('leaves the Hint on screen when its sign goes', () => {
    const q = offerHint(EMPTY_HINT_QUEUE, { id: 'sign-eye', sign: 'eye' }, MS);
    expect(dropStale(q, 'eye')).toBe(q);
  });

  it('stops the timer while the Stage is paused', () => {
    let q = offerHint(EMPTY_HINT_QUEUE, { id: 'leash-colors' }, MS);
    q = offerHint(q, { id: 'sign-eye', sign: 'eye' }, MS);
    q = elapseHint(q, 3000, false, MS);
    q = elapseHint(q, 60000, true, MS);
    expect(q.current?.id).toBe('leash-colors');
    expect(q.remainingMs).toBe(1000);
    q = elapseHint(q, 1000, false, MS);
    expect(q.current?.id).toBe('sign-eye');
  });
});
