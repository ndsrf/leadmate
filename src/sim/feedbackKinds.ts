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
  // scent walks (rethink-unpredictable-walk-stage)
  'granted-sniff': 'right',
  'waited-plant': 'right',
  'waited-marking': 'right',
  'check-in-after-change': 'right',
  'fresh-move': 'right',
  chain: 'right',
  'leave-it-food': 'right',
  'smart-jackpot': 'right',
  'scent-dragged-past': 'wrong',
  'dragged-plant': 'wrong',
  'interrupted-marking': 'wrong',
  'food-eaten': 'wrong',
  'repeated-move-ignored': 'wrong',
  'empty-sniff': 'wrong',
  'wasted-jackpot': 'wrong',
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
    case 'go-sniff-start':
      // in a scent Stage a Go Sniff is about what it found; the food one is reported by `food-eaten`
      if (e.scent === 'granted') return 'granted-sniff';
      if (e.scent === 'empty') return 'empty-sniff';
      return e.scent === 'food' ? null : 'go-sniff';
    case 'marker-miss': return 'missed-reward-window';
    case 'marker-late': return 'late-marker-press';
    case 'marker-reactive': return 'reactive-marker';
    case 'marker-wasted': return 'wasted-marker';
    case 'missed-opportunity': return 'missed-opportunity';
    case 'cue-mismatch': return 'wrong-cue';
    case 'poste-stop': return e.abrupt ? 'harsh-stop' : null;
    case 'tension-change': return e.tension === 'rigid' ? 'rigid-pull' : null;
    case 'go-sniff-end': return e.reason === 'tension' ? 'go-sniff-cut-short' : null;
    case 'plant-end': return e.result === 'waited' ? 'waited-plant' : e.result === 'dragged' ? 'dragged-plant' : null;
    case 'marking-end': return e.result === 'waited' ? 'waited-marking' : e.result === 'interrupted' ? 'interrupted-marking' : null;
    case 'change-check-in': return 'check-in-after-change';
    case 'walk-change':
      if (e.followed && e.freshness === 'fresh') return 'fresh-move';
      return !e.followed && e.freshness === 'repeated' ? 'repeated-move-ignored' : null;
    case 'chain': return 'chain';
    case 'food-left': return 'leave-it-food';
    case 'food-eaten': return 'food-eaten';
    case 'jackpot': return e.result === 'smart' ? 'smart-jackpot' : 'wasted-jackpot';
    case 'scent-dragged-past': return 'scent-dragged-past';
    default: return null;
  }
}
