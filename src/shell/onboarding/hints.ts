import type { TextKey } from '../../i18n';
import type { StageControl, StageSignal } from '../../sim/messages';
import type { DogRecord } from '../dogRecord';

export const HINT_IDS = ['leash-colors', 'marker', 'poste', 'dog-approaching', 'coach-move', 'coach-mark'] as const;
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
  poste: 'onboarding.hint.poste',
  'dog-approaching': 'coach.dog.warning',
  'coach-move': 'coach.controls.move',
  'coach-mark': 'coach.controls.mark',
};

/** The Coach mark ids, by the control they point at. Not Hints: drawn over the controls, recorded when the control is used. */
export const COACH_ID: Record<StageControl, HintId> = { move: 'coach-move', mark: 'coach-mark' };

/** The hint a Stage signal calls for, or null when that hint was already seen. */
export function hintFor(signal: StageSignal, seenHints: readonly string[]): HintId | null {
  const id = HINT_FOR_SIGNAL[signal];
  return id === undefined || seenHints.includes(id) ? null : id;
}

/** True while some hint is still unseen, so the shell has reason to watch the Stage's signals. */
export function hintsRemain(seenHints: readonly string[]): boolean {
  return HINT_IDS.some((id) => !seenHints.includes(id));
}

export function markHintSeen(record: DogRecord, id: HintId): DogRecord {
  return record.seenHints.includes(id) ? record : { ...record, seenHints: [...record.seenHints, id] };
}
