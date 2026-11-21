import type { DogSign } from '../../sim/messages';
import type { HintId } from './hints';

/** A Hint, or the approaching-dog warning, due in the guided first Stage. */
export interface QueuedHint {
  id: HintId;
  /** The Dog sign it explains; the Hint is dropped from the queue when the sign goes. */
  sign?: DogSign;
  /** Where the approaching dog comes from on screen, in radians. */
  bearing?: number;
}

/** What shows first when several are due: the first Fixation, then the approaching-dog warning, then the rest in this order. */
export const HINT_PRIORITY: readonly HintId[] = ['fixation-ring', 'marker-rhythm', 'marker', 'dog-approaching', 'leash-colors', 'poste', 'sign-eye', 'sign-alert', 'sign-bark'];

export interface HintQueue {
  current: QueuedHint | null;
  /** Milliseconds the current one has left on screen. */
  remainingMs: number;
  waiting: readonly QueuedHint[];
}

export const EMPTY_HINT_QUEUE: HintQueue = { current: null, remainingMs: 0, waiting: [] };

const rank = (id: HintId): number => {
  const i = HINT_PRIORITY.indexOf(id);
  return i < 0 ? HINT_PRIORITY.length : i;
};

/** A Hint that is due: shown now when nothing is shown, otherwise it waits its turn (never twice in the queue). */
export function offerHint(queue: HintQueue, hint: QueuedHint, showMs: number): HintQueue {
  if (queue.current?.id === hint.id || queue.waiting.some((w) => w.id === hint.id)) return queue;
  if (!queue.current) return { current: hint, remainingMs: showMs, waiting: queue.waiting };
  const waiting = [...queue.waiting, hint].sort((a, b) => rank(a.id) - rank(b.id));
  return { ...queue, waiting };
}

/** The sign a waiting Hint explains has gone: the Hint is dropped. The one on screen stays out its time. */
export function dropStale(queue: HintQueue, sign: DogSign): HintQueue {
  return queue.waiting.some((w) => w.sign === sign) ? { ...queue, waiting: queue.waiting.filter((w) => w.sign !== sign) } : queue;
}

/** Time passes. A paused Stage stops the timer; when the Hint has had its time the next one that is waiting shows. */
export function elapseHint(queue: HintQueue, ms: number, paused: boolean, showMs: number): HintQueue {
  if (paused || !queue.current) return queue;
  const remainingMs = queue.remainingMs - ms;
  if (remainingMs > 0) return { ...queue, remainingMs };
  const [next, ...waiting] = queue.waiting;
  return next ? { current: next, remainingMs: showMs, waiting } : { current: null, remainingMs: 0, waiting: [] };
}
