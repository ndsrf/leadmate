import type { TextKey } from '../i18n';
import { feedbackKindOf, isFollowedFreshMove, FEEDBACK_ACTION_KINDS, type FeedbackActionKind, type FeedbackPolarity } from '../sim/feedbackKinds';
import type { TensionState } from '../sim/leash';
import type { SimEvent } from '../sim/sim';
import { HINT_SECONDS, HintTracker } from './hints';

/** How big an effect a Feedback Message gets (design Decision 2); the drawing and the sound follow it. */
export type FeedbackTier = 'small' | 'medium' | 'big' | 'wrong';

/**
 * What a Feedback Message is about: a handled action, or an existing event Hint (the leash first Taut or
 * in Rigid Pull), which shares the same one-at-a-time slot at top priority.
 */
export type FeedbackKind = FeedbackActionKind | 'leash-hint';

/** The Stage Meter a message's action filled, taken from the `meter-points` events of the same tick. */
export interface FeedbackMeter {
  id: string;
  value: number;
  full: boolean;
}

export interface FeedbackMessage {
  kind: FeedbackKind;
  tier: FeedbackTier;
  polarity: FeedbackPolarity;
  /** Catalog key to show: the Hint (`.full`) the first time, the short form after. */
  textKey: TextKey;
  /** True when `textKey` is the Hint of a kind not yet in `seenHints`; the shell records it (recorded Stages only). */
  firstTime: boolean;
  /** Same-kind right actions within `COMBO_WINDOW_SECONDS`; 1 means no Combo. */
  combo: number;
  /** Perfect Marker presses in a row inside this Stage (GLOSSARY: "Perfects in a row"). */
  perfectRun?: number;
  meterPoints?: number;
  meter?: FeedbackMeter;
}

/** Seconds a message stays up, by tier (spec "Effect tiers"); event Hints keep `HINT_SECONDS`. */
export const TIER_SECONDS: Record<FeedbackTier, number> = { small: 0.6, medium: 0.8, big: 1.2, wrong: 0.6 };
/** Right actions of one kind this close together merge into a Combo. */
export const COMBO_WINDOW_SECONDS = 4;
/** Combos of this many or more are big. */
export const BIG_COMBO = 3;
/** The Rigid Pull message shows at most once per this many seconds. */
export const RIGID_PULL_INTERVAL_SECONDS = 8;

interface KindRule {
  /** Tier of the message; wrong kinds are always `wrong`. */
  tier: FeedbackTier;
  /** Tier when the event carries a Perfect Marker timing grade. */
  perfectTier?: FeedbackTier;
  /** Shown at most once per this many seconds. */
  minIntervalSeconds?: number;
}

/**
 * One row per kind of handled action. Adding a kind (for example for scent walks) is one line here
 * plus its line in `FEEDBACK_ACTION_KINDS` and its event in `feedbackKindOf`; the compiler rejects a
 * table that misses a kind. Texts are `feedback.<kind>.full` and `.short` in both catalogs.
 */
export const FEEDBACK_RULES = {
  'marker-hit': { tier: 'small', perfectTier: 'medium' },
  'check-in-hit': { tier: 'small', perfectTier: 'medium' },
  'followed-turn': { tier: 'small' },
  disengagement: { tier: 'medium' },
  poste: { tier: 'medium' },
  sintonia: { tier: 'small' },
  'go-sniff': { tier: 'small' },
  'missed-reward-window': { tier: 'wrong' },
  'late-marker-press': { tier: 'wrong' },
  'reactive-marker': { tier: 'wrong' },
  'wasted-marker': { tier: 'wrong' },
  'missed-opportunity': { tier: 'wrong' },
  'wrong-cue': { tier: 'wrong' },
  'harsh-stop': { tier: 'wrong' },
  'rigid-pull': { tier: 'wrong', minIntervalSeconds: RIGID_PULL_INTERVAL_SECONDS },
  'go-sniff-cut-short': { tier: 'wrong' },
  // scent walks (rethink-unpredictable-walk-stage 4.2); Chains and full meters become big via the generic rule
  'granted-sniff': { tier: 'small' },
  'waited-plant': { tier: 'medium' },
  'waited-marking': { tier: 'medium' },
  'check-in-after-change': { tier: 'small', perfectTier: 'medium' },
  'fresh-move': { tier: 'small' },
  chain: { tier: 'big' },
  'leave-it-food': { tier: 'small' },
  'smart-jackpot': { tier: 'medium' },
  'scent-dragged-past': { tier: 'wrong' },
  'dragged-plant': { tier: 'wrong' },
  'interrupted-marking': { tier: 'wrong' },
  'food-eaten': { tier: 'wrong' },
  'repeated-move-ignored': { tier: 'wrong' },
  'empty-sniff': { tier: 'wrong' },
  'wasted-jackpot': { tier: 'wrong' },
} as const satisfies Record<FeedbackActionKind, KindRule>;

const RULES: Record<FeedbackActionKind, KindRule> = FEEDBACK_RULES;

/** Catalog key of a kind's Hint (`full`) or short form. */
export function feedbackTextKey(kind: FeedbackActionKind, form: 'full' | 'short'): TextKey {
  return `feedback.${kind}.${form}` as TextKey;
}

const TIER_ORDER: Record<FeedbackTier, number> = { small: 0, medium: 1, big: 2, wrong: 0 };

/** Wrong wins over right, then the higher tier; event Hints win over everything. */
function rank(m: FeedbackMessage): number {
  if (m.kind === 'leash-hint') return 1000;
  return (m.polarity === 'wrong' ? 100 : 0) + TIER_ORDER[m.tier];
}

export interface FeedbackStep {
  /** Seconds into the Stage. */
  time: number;
  /** This tick's simulation events, in order. */
  events: readonly SimEvent[];
  /** The leash state, for the event Hints (tracked once per Stage, as `HintTracker` always did). */
  tension?: TensionState;
}

export interface FeedbackOptions {
  /** Kinds already in the Dog record's `seenHints` (without the `feedback:` prefix). */
  seenKinds?: Iterable<string>;
  /** The Taste Stage: wrong kinds are dropped and no Hint is offered to be recorded. */
  isTasteStage?: boolean;
}

/**
 * Decides which one Feedback Message, if any, a tick shows. Pure and deterministic: its input is the
 * tick's events and time plus what it remembers (Combos, last-shown times, kinds hinted this Stage).
 * It never feeds back into the simulation.
 */
export class FeedbackDecider {
  private readonly seen: Set<string>;
  private readonly isTasteStage: boolean;
  private readonly leashHints = new HintTracker();
  private readonly combos = new Map<FeedbackActionKind, { count: number; last: number }>();
  private readonly lastShown = new Map<FeedbackActionKind, number>();
  private showing: { message: FeedbackMessage; until: number } | null = null;
  private perfectRun = 0;

  constructor(options: FeedbackOptions = {}) {
    this.seen = new Set(options.seenKinds ?? []);
    this.isTasteStage = options.isTasteStage ?? false;
  }

  /** The message still on screen at `time`, if any. */
  current(time: number): FeedbackMessage | null {
    return this.showing && time < this.showing.until ? this.showing.message : null;
  }

  /** Returns the message to show or update this tick, or null when nothing new is shown. */
  step({ time, events, tension }: FeedbackStep): FeedbackMessage | null {
    const hintKey = tension ? this.leashHints.observe(tension) : null;
    const candidates: FeedbackMessage[] = [];
    if (hintKey) {
      candidates.push({ kind: 'leash-hint', tier: 'small', polarity: 'wrong', textKey: hintKey, firstTime: false, combo: 1 });
    }
    const hintCoversRigidPull = hintKey === 'hint.rigid';

    for (const e of events) {
      if (e.type === 'check-in-hit' && events.some((o) => o.type === 'change-check-in')) {
        continue;
      }
      if (e.type === 'marker-hit' || e.type === 'check-in-hit' || e.type === 'change-check-in') {
        if (e.grade === 'perfect') {
          this.perfectRun += 1;
        } else {
          this.perfectRun = 0;
        }
      } else if (
        e.type === 'marker-miss' ||
        e.type === 'marker-late' ||
        e.type === 'marker-reactive' ||
        e.type === 'marker-wasted'
      ) {
        this.perfectRun = 0;
      }
    }

    for (const e of events) {
      const kind = feedbackKindOf(e);
      if (!kind) continue;
      // the Marker on the look after a change reports both events; show only the more specific message
      if (kind === 'check-in-hit' && events.some((o) => o.type === 'change-check-in')) continue;
      if (kind === 'followed-turn' && events.some(isFollowedFreshMove)) continue; // the fresh move already says it
      const polarity = FEEDBACK_ACTION_KINDS[kind];
      if (polarity === 'wrong') {
        this.combos.clear();
        if (this.isTasteStage || (kind === 'rigid-pull' && hintCoversRigidPull)) continue;
        if (this.tooSoon(kind, time)) continue;
        candidates.push(this.build(kind, e, 1, events));
        continue;
      }
      const combo = this.bumpCombo(kind, time);
      candidates.push(this.build(kind, e, combo, events));
    }

    let best: FeedbackMessage | null = null;
    for (const c of candidates) if (!best || rank(c) > rank(best)) best = c;
    if (!best) return null;

    const showing = this.current(time);
    const sameKindUpdate = showing?.kind === best.kind && best.polarity === 'right' && best.combo >= showing.combo;
    if (showing && !sameKindUpdate && rank(best) <= rank(showing)) return null; // dropped, never queued

    return this.show(best, time);
  }

  private show(m: FeedbackMessage, time: number): FeedbackMessage {
    if (m.kind !== 'leash-hint') {
      if (m.firstTime) this.seen.add(m.kind);
      if (m.polarity === 'wrong') this.lastShown.set(m.kind, time);
    }
    const seconds = m.kind === 'leash-hint' ? HINT_SECONDS : TIER_SECONDS[m.tier];
    this.showing = { message: m, until: time + seconds };
    return m;
  }

  private tooSoon(kind: FeedbackActionKind, time: number): boolean {
    const interval = RULES[kind].minIntervalSeconds;
    const last = this.lastShown.get(kind);
    return interval !== undefined && last !== undefined && time - last < interval;
  }

  private bumpCombo(kind: FeedbackActionKind, time: number): number {
    const previous = this.combos.get(kind);
    const count = previous && time - previous.last <= COMBO_WINDOW_SECONDS ? previous.count + 1 : 1;
    this.combos.set(kind, { count, last: time });
    return count;
  }

  private build(kind: FeedbackActionKind, e: SimEvent, combo: number, events: readonly SimEvent[]): FeedbackMessage {
    const rule = RULES[kind];
    const polarity = FEEDBACK_ACTION_KINDS[kind];
    const grade = e.type === 'marker-hit' || e.type === 'check-in-hit' || e.type === 'change-check-in' ? e.grade : undefined;
    let tier: FeedbackTier = grade === 'perfect' && rule.perfectTier ? rule.perfectTier : rule.tier;

    let meterPoints = 0;
    let meter: FeedbackMeter | undefined;
    for (const m of events) {
      if (m.type === 'meter-points' && m.kind === kind) {
        meterPoints += m.points;
        meter = { id: m.meterId, value: m.value, full: m.full };
      }
    }
    if (polarity === 'right' && ((meter && meter.full) || combo >= BIG_COMBO)) tier = 'big';

    const firstTime = !this.isTasteStage && !this.seen.has(kind);
    const message: FeedbackMessage = {
      kind,
      tier,
      polarity,
      textKey: feedbackTextKey(kind, firstTime ? 'full' : 'short'),
      firstTime,
      combo,
    };
    if (grade === 'perfect' && this.perfectRun > 0) {
      message.perfectRun = this.perfectRun;
    }
    if (meter) {
      message.meterPoints = meterPoints;
      message.meter = meter;
    }
    return message;
  }
}
