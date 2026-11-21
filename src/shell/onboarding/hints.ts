import type { TextKey } from '../../i18n';
import type { FeedbackActionKind } from '../../sim/feedbackKinds';
import type { StageControl, StageSignal } from '../../sim/messages';
import type { AssistLevel } from '../../hud/markerAssist';
import type { DogRecord } from '../dogRecord';

export const HINT_IDS = ['leash-colors', 'marker', 'marker-rhythm', 'poste', 'dog-approaching', 'coach-move', 'coach-mark', 'coach-gather', 'coach-poste', 'coach-close-mark', 'fixation-ring', 'sign-alert', 'sign-eye', 'sign-bark'] as const;
export type HintId = (typeof HINT_IDS)[number];

const HINT_FOR_SIGNAL: Partial<Record<StageSignal, HintId>> = {
  'first-taut': 'leash-colors',
  'first-fixation': 'marker',
  'leash-limit': 'poste',
  'dog-approaching': 'dog-approaching',
};

export const HINT_TEXT: Record<HintId, TextKey> = {
  'leash-colors': 'onboarding.hint.leashColors',
  marker: 'onboarding.hint.marker',
  'marker-rhythm': 'onboarding.hint.markerRhythm',
  poste: 'onboarding.hint.poste',
  'dog-approaching': 'coach.dog.warning',
  'coach-move': 'coach.controls.move',
  'coach-mark': 'coach.controls.mark',
  'coach-gather': 'coach.close.gather',
  'coach-poste': 'coach.close.poste',
  'coach-close-mark': 'coach.close.mark',
  'fixation-ring': 'onboarding.hint.fixationRing',
  'sign-alert': 'onboarding.hint.sign.alert',
  'sign-eye': 'onboarding.hint.sign.eye',
  'sign-bark': 'onboarding.hint.sign.bark',
};

/** The Coach mark ids, by the control they point at. Not Hints: drawn over the controls, recorded when the control is used. */
export const COACH_ID: Record<StageControl, HintId> = {
  move: 'coach-move',
  mark: 'coach-mark',
  gather: 'coach-gather',
  poste: 'coach-poste',
  'close-mark': 'coach-close-mark',
};

const MARKER_ACTION_KINDS: readonly string[] = [
  'marker-hit',
  'missed-reward-window',
  'late-marker-press',
  'reactive-marker',
  'wasted-marker',
  'missed-opportunity',
];

/**
 * Checks whether a Stage control's actions are Introduced (design decision 4:
 * movement -> rigid-pull; Marker -> Marker kinds; Poste -> poste; Gather -> always).
 * Absent introducedKinds means every kind is Introduced.
 */
export function isControlIntroduced(control: StageControl, introducedKinds?: readonly string[]): boolean {
  if (!introducedKinds) return true;
  switch (control) {
    case 'gather':
      return true;
    case 'move':
      return introducedKinds.includes('rigid-pull');
    case 'poste':
      return introducedKinds.includes('poste');
    case 'mark':
    case 'close-mark':
      return MARKER_ACTION_KINDS.some((kind) => introducedKinds.includes(kind));
    default:
      return true;
  }
}

/** Which of the close view's three Coach marks are on: not used yet this run, not timed out, not seen in an earlier run, and actions Introduced. */
export function closeMarksOn(
  seenHints: readonly string[],
  used: Partial<Record<StageControl, boolean>>,
  expired: boolean,
  introducedKinds?: readonly string[],
): { gather: boolean; poste: boolean; marker: boolean } {
  const on = (control: 'gather' | 'poste' | 'close-mark') =>
    !used[control] && !expired && !seenHints.includes(COACH_ID[control]) && isControlIntroduced(control, introducedKinds);
  return { gather: on('gather'), poste: on('poste'), marker: on('close-mark') };
}

/** The hint a Stage signal calls for, or null when that hint was already seen or its action is not Introduced. */
export function hintFor(
  signal: StageSignal,
  seenHints: readonly string[],
  assist?: AssistLevel,
  introducedKinds?: readonly string[],
): HintId | null {
  if (signal === 'first-fixation') {
    if (assist === 'full' && !seenHints.includes('marker-rhythm')) {
      return 'marker-rhythm';
    }
    return seenHints.includes('marker') ? null : 'marker';
  }
  const id = HINT_FOR_SIGNAL[signal];
  if (id === undefined || seenHints.includes(id)) return null;
  if (id === 'poste' && introducedKinds && !introducedKinds.includes('poste')) {
    return null;
  }
  return id;
}

/** True while some hint is still unseen, so the shell has reason to watch the Stage's signals. */
export function hintsRemain(seenHints: readonly string[]): boolean {
  return HINT_IDS.some((id) => !seenHints.includes(id));
}

export function markHintSeen(record: DogRecord, id: HintId): DogRecord {
  if (id === 'marker-rhythm') {
    const next = new Set(record.seenHints);
    next.add('marker-rhythm');
    next.add('marker');
    return { ...record, seenHints: [...next] };
  }
  return record.seenHints.includes(id) ? record : { ...record, seenHints: [...record.seenHints, id] };
}

/** The `seenHints` entry for a Feedback Message kind whose Hint (full text) was shown. */
export function feedbackHintId(kind: FeedbackActionKind): string {
  return `feedback:${kind}`;
}

export function feedbackKindSeen(seenHints: readonly string[], kind: FeedbackActionKind): boolean {
  return seenHints.includes(feedbackHintId(kind));
}

export function markFeedbackKindSeen(record: DogRecord, kind: FeedbackActionKind): DogRecord {
  const id = feedbackHintId(kind);
  return record.seenHints.includes(id) ? record : { ...record, seenHints: [...record.seenHints, id] };
}
