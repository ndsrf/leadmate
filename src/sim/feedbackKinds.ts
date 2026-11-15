import type { SimEvent } from './sim';

/** Whether a Feedback Message praises an action or explains a mistake. */
export type FeedbackPolarity = 'right' | 'wrong';

/**
 * Every kind of handled action a Feedback Message (and a Stage Meter) can be about, with its
 * polarity. Adding a kind is one line here, plus its event in `feedbackKindOf`.
 */
export const FEEDBACK_ACTION_KINDS = {
  'marker-hit': 'right',
  'check-in-hit': 'right',
  'followed-turn': 'right',
  disengagement: 'right',
  poste: 'right',
  sintonia: 'right',
  'go-sniff': 'right',
  'missed-reward-window': 'wrong',
  'late-marker-press': 'wrong',
  'reactive-marker': 'wrong',
  'wasted-marker': 'wrong',
  'missed-opportunity': 'wrong',
  'wrong-cue': 'wrong',
  'harsh-stop': 'wrong',
  'rigid-pull': 'wrong',
  'go-sniff-cut-short': 'wrong',
} as const satisfies Record<string, FeedbackPolarity>;

export type FeedbackActionKind = keyof typeof FEEDBACK_ACTION_KINDS;

export function isFeedbackActionKind(kind: string): kind is FeedbackActionKind {
  return Object.prototype.hasOwnProperty.call(FEEDBACK_ACTION_KINDS, kind);
}

/** The kind of handled action a simulation event reports, or null when it reports none. */
export function feedbackKindOf(e: SimEvent): FeedbackActionKind | null {
  switch (e.type) {
    case 'marker-hit': return 'marker-hit';
    case 'check-in-hit': return 'check-in-hit';
    case 'dog-follow': return 'followed-turn';
    case 'disengagement': return e.poste ? 'poste' : 'disengagement';
    case 'sintonia-start': return 'sintonia';
    case 'go-sniff-start': return 'go-sniff';
    case 'marker-miss': return 'missed-reward-window';
    case 'marker-late': return 'late-marker-press';
    case 'marker-reactive': return 'reactive-marker';
    case 'marker-wasted': return 'wasted-marker';
    case 'missed-opportunity': return 'missed-opportunity';
    case 'cue-mismatch': return 'wrong-cue';
    case 'poste-stop': return e.abrupt ? 'harsh-stop' : null;
    case 'tension-change': return e.tension === 'rigid' ? 'rigid-pull' : null;
    case 'go-sniff-end': return e.reason === 'tension' ? 'go-sniff-cut-short' : null;
    default: return null;
  }
}
