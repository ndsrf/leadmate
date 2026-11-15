import type { SimEvent } from './sim';

/** Whether a Feedback Message praises an action or explains a mistake. */
export type FeedbackPolarity = 'right' | 'wrong';

/**
 * Every kind of handled action a Feedback Message (and a Stage Meter) can be about, with its
 * polarity. Adding a kind is one line here, plus its event in `feedbackKindOf`.
 */
export const FEEDBACK_ACTION_KINDS = {
  mark: 'right',
  'check-in': 'right',
  'followed-turn': 'right',
  'let-go': 'right',
  poste: 'right',
  flow: 'right',
  'sniff-release': 'right',
  'missed-window': 'wrong',
  late: 'wrong',
  'reactive-mark': 'wrong',
  'nothing-to-mark': 'wrong',
  'missed-chance': 'wrong',
  'wrong-cue': 'wrong',
  'harsh-stop': 'wrong',
  pull: 'wrong',
  'sniff-cut-short': 'wrong',
} as const satisfies Record<string, FeedbackPolarity>;

export type FeedbackActionKind = keyof typeof FEEDBACK_ACTION_KINDS;

export function isFeedbackActionKind(kind: string): kind is FeedbackActionKind {
  return Object.prototype.hasOwnProperty.call(FEEDBACK_ACTION_KINDS, kind);
}

/** The kind of handled action a simulation event reports, or null when it reports none. */
export function feedbackKindOf(e: SimEvent): FeedbackActionKind | null {
  switch (e.type) {
    case 'marker-hit': return 'mark';
    case 'check-in-hit': return 'check-in';
    case 'dog-follow': return 'followed-turn';
    case 'disengagement': return e.poste ? 'poste' : 'let-go';
    case 'sintonia-start': return 'flow';
    case 'go-sniff-start': return 'sniff-release';
    case 'marker-miss': return 'missed-window';
    case 'marker-late': return 'late';
    case 'marker-reactive': return 'reactive-mark';
    case 'marker-wasted': return 'nothing-to-mark';
    case 'missed-opportunity': return 'missed-chance';
    case 'cue-mismatch': return 'wrong-cue';
    case 'poste-stop': return e.abrupt ? 'harsh-stop' : null;
    case 'tension-change': return e.tension === 'rigid' ? 'pull' : null;
    case 'go-sniff-end': return e.reason === 'tension' ? 'sniff-cut-short' : null;
    default: return null;
  }
}
