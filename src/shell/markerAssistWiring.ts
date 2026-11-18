import type { AssistState } from '../hud/markerAssist';
import type { DogRecord } from './dogRecord';
import type { UiSettings } from './ui/uiSettings';

/** The fields of a walking Stage's `start` message that drive the telegraph (telegraph-marker-timing). */
export interface TelegraphStartFields {
  markerAssist: AssistState;
  alwaysTimingHelp: boolean;
  guidedFirstStage: boolean;
}

export function telegraphStartFields(record: Pick<DogRecord, 'markerAssist'>, settings: Pick<UiSettings, 'alwaysTimingHelp'>, routeName: string): TelegraphStartFields {
  return {
    markerAssist: record.markerAssist ?? { level: 'full', successRun: 0, failRun: 0 },
    alwaysTimingHelp: settings.alwaysTimingHelp,
    guidedFirstStage: routeName === 'first-stage',
  };
}

/** The Timing assist is written to the Dog record in every recorded Stage (the Daily Stage included), never in the Taste Stage: the same gate as `firstTime` Hints. */
export function recordMarkerAssist(record: DogRecord, state: AssistState, routeName: string): DogRecord {
  if (routeName === 'taste') return record;
  return { ...record, markerAssist: { ...state } };
}
