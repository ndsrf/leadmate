import type { Catalog } from '../i18n';
import type { CueType, ScenarioConfig } from './config';
import type { CloseExerciseConfig } from './closeExercise';
import type { SimulationDebriefPayload } from './payload';
import { FEEDBACK_ACTION_KINDS, isFeedbackActionKind, type FeedbackActionKind, type FeedbackPolarity } from './feedbackKinds';
import type { ReactionTier } from './sim';

/** Shell -> bundle. */
export type ShellMessage =
  | {
      type: 'start';
      /** Seed for the new Stage; the bundle picks one when absent. */
      seed?: number;
      /** Text for the active language; keys it lacks fall back to Spanish. */
      catalog?: Catalog;
      scenario?: (Partial<ScenarioConfig> | Partial<CloseExerciseConfig>) & { mode?: string };
      /** Kinds already in the Dog record's `seenHints` (without the `feedback:` prefix). */
      seenKinds?: readonly string[];
      /** The Taste Stage: wrong kinds are dropped and no Hint is offered to be recorded. */
      isTasteStage?: boolean;
      /** OS reduced-motion preference: animations switch to fades, static poses, or 0 particles. */
      reducedMotion?: boolean;
      /** The Dog record's Timing assist (telegraph-marker-timing); absent in close exercises. */
      markerAssist?: MarkerAssistState;
      /** The "always show timing help" setting: the telegraph runs at Full and the stored assist is not updated. */
      alwaysTimingHelp?: boolean;
      /** The guided first Stage: the telegraph runs at Full, outcomes still count. */
      guidedFirstStage?: boolean;
    }
  | { type: 'pause' }
  | { type: 'resume' }
  /** Zoom the camera in on the Handler and the Dog; the Stage keeps running. */
  | { type: 'focus' }
  /** No Stage is on screen (World Map, menus, screen off): stop drawing frames. */
  | { type: 'suspend' }
  /** A Stage is on screen again: restart the render loop. */
  | { type: 'wake' };

/** Bundle -> shell. */
export type BundleMessage =
  | { type: 'ready' }
  | { type: 'paused' }
  | { type: 'debrief'; payload: SimulationDebriefPayload }
  /** A Cue took effect in the simulation; the shell picks and plays the audio (fire and forget). */
  | { type: 'playCue'; cueType?: CueType }
  /** The Dog crossed a Reaction Tier threshold; the shell plays a vocalization (fire and forget). */
  | { type: 'reaction-tier-change'; tier: ReactionTier; time: number }
  /**
   * A moment the shell may explain to a new user, sent at most once per Stage and signal: the leash first gets
   * Taut, the Dog first fixates (a Reward Window follows its calming), the leash first reaches its limit.
   * `first-input` is not a hint: the Handler first moves or presses a button. `control-used` says which
   * control (`control`), and `dog-approaching` where the dog comes from on screen (`bearing`, radians).
   */
  | { type: 'stage-signal'; signal: StageSignal; time: number; control?: StageControl; bearing?: number; assist?: MarkerAssistLevel }
  /** A count-in tick of the Approach ring (beat 1 to 3, Full assist only); the shell plays it (fire and forget). */
  | { type: 'telegraph-tick'; beat: 1 | 2 | 3 }
  /** The Timing assist changed; the shell writes it to the Dog record in recorded Stages. */
  | { type: 'marker-assist'; state: MarkerAssistState }
  /**
   * A Feedback Message was shown in the Stage; the shell plays its sound and haptic (fire and forget). `combo` is the
   * run of right actions of this kind (1 for the first). `firstTime` says the Hint (full text) was shown, so the shell
   * records `feedback:<kind>` in `seenHints` (recorded Stages only).
   */
  | FeedbackMessage
  | { type: 'error'; message: string };

export const ASSIST_LEVELS = ['full', 'ring', 'late', 'off'] as const;
/** The Timing assist level (the same values as `AssistLevel` in `src/hud/markerAssist.ts`). */
export type MarkerAssistLevel = (typeof ASSIST_LEVELS)[number];
/** The Timing assist as stored in the Dog record (the same shape as `AssistState` in `src/hud/markerAssist.ts`). */
export interface MarkerAssistState {
  level: MarkerAssistLevel;
  successRun: number;
  failRun: number;
}

export function isMarkerAssistState(v: unknown): v is MarkerAssistState {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    (ASSIST_LEVELS as readonly unknown[]).includes(o.level) &&
    Number.isInteger(o.successRun) &&
    (o.successRun as number) >= 0 &&
    Number.isInteger(o.failRun) &&
    (o.failRun as number) >= 0
  );
}

export const FEEDBACK_TIERS = ['small', 'medium', 'big'] as const;
export type FeedbackTier = (typeof FEEDBACK_TIERS)[number];

export interface FeedbackMessage {
  type: 'feedback';
  kind: FeedbackActionKind;
  tier: FeedbackTier;
  polarity: FeedbackPolarity;
  combo: number;
  firstTime: boolean;
  /** Perfects in a row, set on the message shown for a Perfect press; the shell raises the sound's pitch by it. */
  perfectRun?: number;
}

function isFeedbackMessage(v: Record<string, unknown>): boolean {
  return (
    typeof v.kind === 'string' &&
    isFeedbackActionKind(v.kind) &&
    (FEEDBACK_TIERS as readonly unknown[]).includes(v.tier) &&
    v.polarity === FEEDBACK_ACTION_KINDS[v.kind] &&
    Number.isInteger(v.combo) &&
    (v.combo as number) >= 0 &&
    typeof v.firstTime === 'boolean' &&
    (v.perfectRun === undefined || (Number.isInteger(v.perfectRun) && (v.perfectRun as number) >= 1))
  );
}

export const STAGE_SIGNALS = ['first-taut', 'first-fixation', 'leash-limit', 'first-input', 'dog-approaching', 'control-used'] as const;
export type StageSignal = (typeof STAGE_SIGNALS)[number];

/**
 * The controls a Coach mark can point at: the joystick (`move`) and the Marker button (`mark`) of the walking Stage,
 * and the leash, Poste and Marker controls of the close view (`gather`, `poste`, `close-mark`).
 */
export type StageControl = 'move' | 'mark' | 'gather' | 'poste' | 'close-mark';

/** Lets each signal through once per Stage; `control-used` once per control. */
export function createSignalGate(): (signal: StageSignal, control?: StageControl) => boolean {
  const sent = new Set<string>();
  return (signal, control) => {
    const key = control ? `${signal}:${control}` : signal;
    if (sent.has(key)) return false;
    sent.add(key);
    return true;
  };
}

export function encode(message: ShellMessage | BundleMessage): string {
  return JSON.stringify(message);
}

/** Parses a raw message (string or object), returning null for anything that is not ours. */
export function decode<T extends { type: string }>(raw: unknown, types: readonly T['type'][]): T | null {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (value && typeof value === 'object' && types.includes((value as { type: string }).type)) {
      const v = value as Record<string, unknown>;
      if (v.type === 'feedback' && !isFeedbackMessage(v)) return null;
      if (v.type === 'telegraph-tick' && ![1, 2, 3].includes(v.beat as number)) return null;
      if (v.type === 'marker-assist' && !isMarkerAssistState(v.state)) return null;
      if (v.type === 'stage-signal' && v.assist !== undefined && !(ASSIST_LEVELS as readonly unknown[]).includes(v.assist)) return null;
      if (v.type === 'start') {
        if (v.markerAssist !== undefined && !isMarkerAssistState(v.markerAssist)) return null;
        if (v.alwaysTimingHelp !== undefined && typeof v.alwaysTimingHelp !== 'boolean') return null;
        if (v.guidedFirstStage !== undefined && typeof v.guidedFirstStage !== 'boolean') return null;
      }
      return value as T;
    }
  } catch {
    // not ours
  }
  return null;
}

export const SHELL_MESSAGE_TYPES: readonly ShellMessage['type'][] = ['start', 'pause', 'resume', 'focus', 'suspend', 'wake'];
export const BUNDLE_MESSAGE_TYPES: readonly BundleMessage['type'][] = ['ready', 'paused', 'debrief', 'playCue', 'reaction-tier-change', 'stage-signal', 'feedback', 'telegraph-tick', 'marker-assist', 'error'];

/** Where the bundle sends its messages: the native WebView bridge, the parent window, or nowhere. */
export type Outbox = (message: BundleMessage) => void;

export function createOutbox(
  win: {
    ReactNativeWebView?: { postMessage(data: string): void };
    parent?: { postMessage(data: string, origin: string): void };
    self?: unknown;
  },
): Outbox {
  return (message) => {
    const data = encode(message);
    if (win.ReactNativeWebView) win.ReactNativeWebView.postMessage(data);
    else if (win.parent && win.parent !== win.self) win.parent.postMessage(data, '*');
  };
}
