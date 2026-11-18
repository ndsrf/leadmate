import type { SimEvent } from '../sim/sim';
import { applyOutcome, assistOutcomeOf, effectiveLevel, type AssistLevel, type AssistState } from './markerAssist';
import { beatsCrossed, TelegraphModel, type Beat, type TelegraphState, type TelegraphView } from './telegraph';

export interface TelegraphControllerOptions {
  /** The Dog record's Timing assist at the start of the Stage. */
  assist: AssistState;
  /** "Always show timing help": Full, and the stored assist is not updated. */
  alwaysTimingHelp?: boolean;
  /** The guided first Stage: Full whatever the stored level, outcomes still count. */
  guidedFirstStage?: boolean;
  /** The Taste Stage: outcomes never change the assist. */
  isTasteStage?: boolean;
}

/** The state of the sim just before this tick, for judging a press. */
export interface TelegraphTickContext {
  pre: { dogMode: string; calmElapsed: number };
  marksUsed: number;
  markBudget: number;
}

export interface TelegraphFrame extends TelegraphState {
  /** The level sampled for what is on screen (the one the scene draws and signals). */
  level: AssistLevel;
  /** The Marker highlight is on: Full assist during the Perfect span of a landed window or Check-in look. */
  highlight: boolean;
  /** Count-in beats crossed this tick (Full assist only). */
  beats: Beat[];
  /** The new Timing assist when this tick changed it, else null. */
  assistChanged: AssistState | null;
  /** Seconds since the ring landed, the Reward Window left (1 to 0), the snap's age and the progress before it. */
  landedAge: number | undefined;
  goodLeft: number | undefined;
  snapAge: number | undefined;
  snapFromProgress: number | undefined;
}

/**
 * Runs the telegraph for one Stage from the sim's state and events: samples the effective level between approaches,
 * feeds Marker outcomes to the Timing assist and picks the count-in beats. Read-only on the sim: it never draws from
 * a seeded stream and never changes what the sim does (ADR 0002).
 */
export class TelegraphController {
  private readonly model = new TelegraphModel();
  private assist: AssistState;
  private sampled: AssistLevel;
  private idle = true;
  private prevCalm = 0;
  private prevProgress = 0;
  private landedAt: number | null = null;
  private snapAt: number | null = null;
  private snapFrom = 0;
  private last: TelegraphFrame | null = null;

  constructor(private readonly options: TelegraphControllerOptions) {
    this.assist = { ...options.assist };
    this.sampled = this.current();
  }

  private current(): AssistLevel {
    return effectiveLevel(this.assist, { alwaysFull: this.options.alwaysTimingHelp, guidedFirstStage: this.options.guidedFirstStage });
  }

  /** The level the ring or arc now on screen was sampled at (what `first-fixation` reports). */
  get level(): AssistLevel {
    return this.sampled;
  }

  get frame(): TelegraphFrame | null {
    return this.last;
  }

  step(view: TelegraphView, events: readonly SimEvent[], ctx: TelegraphTickContext): TelegraphFrame {
    // a level change only applies between approaches: resample when nothing is on screen or a new Fixation begins
    if (this.idle || events.some((e) => e.type === 'fixation-start')) this.sampled = this.current();

    const state = this.model.update(view, this.sampled);

    let assistChanged: AssistState | null = null;
    if (!this.options.alwaysTimingHelp && !this.options.isTasteStage) {
      for (const e of events) {
        const outcome = assistOutcomeOf(e, { dogMode: ctx.pre.dogMode, calmElapsed: ctx.pre.calmElapsed, marksUsed: ctx.marksUsed, markBudget: ctx.markBudget });
        if (outcome === 'neutral') continue;
        const next = applyOutcome(this.assist, outcome);
        if (next.level !== this.assist.level || next.successRun !== this.assist.successRun || next.failRun !== this.assist.failRun) assistChanged = next;
        this.assist = next;
      }
    }

    let beats: Beat[] = [];
    if (state.ring !== null && this.sampled === 'full' && view.dogMode === 'fixated') {
      beats = beatsCrossed(this.prevCalm, view.calmElapsed, view.calmSeconds);
    }
    this.prevCalm = view.dogMode === 'fixated' ? view.calmElapsed : 0;

    const ring = state.ring;
    if (ring?.snap) {
      this.snapAt = view.time;
      this.snapFrom = this.prevProgress;
    }
    this.prevProgress = ring && (ring.phase === 'open' || ring.phase === 'closing') ? ring.progress : 0;
    if (ring?.phase === 'landed' && this.landedAt === null) this.landedAt = view.time;
    if (!ring || ring.phase === 'open' || ring.phase === 'closing') this.landedAt = null;

    const win = view.rewardWindow;
    const goodLeft = ring?.phase === 'good' && win ? Math.min(1, Math.max(0, (win.closesAt - view.time) / (win.closesAt - win.openedAt))) : undefined;
    const highlight = this.sampled === 'full' && (ring?.phase === 'landed' || state.checkInArc?.phase === 'landed');

    this.idle = state.ring === null && state.checkInArc === null;
    this.last = {
      ...state,
      level: this.sampled,
      highlight,
      beats,
      assistChanged,
      landedAge: ring?.phase === 'landed' && this.landedAt !== null ? view.time - this.landedAt : undefined,
      goodLeft,
      snapAge: this.snapAt !== null ? view.time - this.snapAt : undefined,
      snapFromProgress: this.snapAt !== null ? this.snapFrom : undefined,
    };
    return this.last;
  }
}
