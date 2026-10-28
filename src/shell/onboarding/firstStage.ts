import type { SimulationDebriefPayload } from '../../sim/payload';
import { activityAt, addActivity, stageSummary } from '../activity';
import { applyActivity, applyStage, type DogRecord } from '../dogRecord';
import { nextStep } from './flow';

/** The guided first Stage ended: the Dog learns from it like from any Stage, and the funnel is over. */
export function completeFirstStage(record: DogRecord, payload: SimulationDebriefPayload, now: Date): DogRecord {
  const played = applyActivity(applyStage(record, payload, now), now);
  const activityLog = addActivity(played.activityLog, activityAt(now, { kind: 'first-stage', id: '', stage: stageSummary(payload) }));
  return { ...played, activityLog, onboarding: { ...played.onboarding, firstStageCompletedAt: now.toISOString(), step: nextStep('first-stage') } };
}
