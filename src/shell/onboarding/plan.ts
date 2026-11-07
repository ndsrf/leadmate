import { CONCERNS, isHomeConcern, KIND_OF_OUTDOOR, type Concern, type PlanBecause, type PlanItem } from '../concerns';
import type { DogRecord } from '../dogRecord';
import { isHomeStretchId } from '../homeBehaviours';
import { findStretch } from '../world';
import { latencyBand } from './latency';

/** The default order of the opening Stretches, each named by its first Stop: harness, doorbell, Poste, the first walk. */
const DEFAULT_PLAN = ['theory-harness', 'theory-doorbell', 'theory-poste', 'theory-loose-leash'] as const;

/** The Stretch that practices the Poste, which a slow reaction time or an adolescent Dog moves up. */
export const POSTE_STRETCH_ID = 'theory-poste';
export const POSTE_NODE_ID = 'poste-practice';

/** The Stretches about being at home, which a puppy and every home Concern follow. */
const AT_HOME = ['theory-home-rest', 'theory-calm-first'] as const;

/**
 * The Stretches that train each Concern, in the order they are worth doing, named by their first Stop. A home Concern
 * leads with its own Home Stretch (named by its Lesson, see `HOME_BEHAVIOUR_CONTENT`), then the at-home Stretches of
 * the Basics World.
 */
export const CONCERN_STRETCHES: Record<Concern, readonly string[]> = {
  'bite-owner': ['theory-bite-owner', ...AT_HOME],
  'bite-others': ['theory-bite-others', ...AT_HOME],
  'bark-home': ['theory-bark-home', ...AT_HOME],
  destroy: ['theory-destroy', ...AT_HOME],
  'eat-objects': ['theory-eat-objects', 'theory-home-rest'],
  alone: ['theory-alone-space', 'theory-home-rest'],
  'react-dog': ['theory-slack-u'],
  'react-child': ['theory-slack-u'],
  'react-bicycle': ['theory-blind-corner'],
  'react-skateboard': ['theory-loose-leash'],
  'react-food': ['theory-leave-it'],
};

const BITING: readonly Concern[] = ['bite-owner', 'bite-others'];
const MAX_PLAN = 5;

/** How strongly the Dog has a Concern, 0 to 3: the saved level, or at least 1 for the Main Concern. */
export function concernLevel(record: Pick<DogRecord, 'homeConcerns' | 'triggerProfile' | 'mainConcerns'>, concern: Concern): number {
  const saved = isHomeConcern(concern) ? (record.homeConcerns[concern] ?? 0) : record.triggerProfile[KIND_OF_OUTDOOR[concern]];
  return Math.max(saved, record.mainConcerns.includes(concern) ? 1 : 0);
}

/** The Concerns to plan for besides the Main Concern: every home concern set, and the outdoor reactions at the highest level. */
function otherConcerns(record: DogRecord): Concern[] {
  return CONCERNS.filter((c) => !record.mainConcerns.includes(c) && !BITING.includes(c) && c !== 'eat-objects')
    .filter((c) => (isHomeConcern(c) ? concernLevel(record, c) > 0 : concernLevel(record, c) === 3))
    .sort((a, b) => concernLevel(record, b) - concernLevel(record, a));
}

/**
 * The Personal Plan: an ordered list of 3 to 5 existing Stretches. Biting comes first (its Home Stretch, then the at-home
 * Stretches), then eating non-food things, then what age or a slow reaction time call for, then the
 * Main Concern, the other Concerns by level, and the default trail order. Sex never changes the order. Pure.
 */
export function buildPersonalPlan(record: DogRecord): PlanItem[] {
  const items: PlanItem[] = [];
  const add = (stretchIds: readonly string[], why: { concern?: Concern; because?: PlanBecause }) => {
    for (const stretchId of stretchIds) {
      if (!items.some((i) => i.stretchId === stretchId) && (findStretch(stretchId) || isHomeStretchId(stretchId))) items.push({ stretchId, ...why });
    }
  };

  for (const c of BITING.filter((b) => concernLevel(record, b) > 0).sort((a, b) => concernLevel(record, b) - concernLevel(record, a))) add(CONCERN_STRETCHES[c], { concern: c });
  if (concernLevel(record, 'eat-objects') > 0) add(CONCERN_STRETCHES['eat-objects'], { concern: 'eat-objects' });

  if (record.ageBand === 'puppy') add(AT_HOME, { because: 'puppy' });
  const latency = record.onboarding.diagnosticLatency;
  if (record.ageBand === 'adolescent') add([POSTE_STRETCH_ID], { because: 'adolescent' });
  else if (latency !== null && latencyBand(latency) === 'slow') add([POSTE_STRETCH_ID], { because: 'slow' });

  for (const c of record.mainConcerns) add(CONCERN_STRETCHES[c], { concern: c });
  for (const c of otherConcerns(record)) add(CONCERN_STRETCHES[c], { concern: c });
  add(DEFAULT_PLAN, {});
  return items.slice(0, MAX_PLAN);
}

/** The record with its plan rebuilt from its answers. */
export function rebuildPlan(record: DogRecord): DogRecord {
  return { ...record, onboarding: { ...record.onboarding, plan: buildPersonalPlan(record) } };
}

/** The two safety notes, derived from the current levels and never stored. */
export interface PlanNotes {
  /** Either biting Concern at level 2 or 3. */
  professionalHelp: boolean;
  /** Reacting to children at level 3. */
  supervision: boolean;
}

export function planNotes(record: Pick<DogRecord, 'homeConcerns' | 'triggerProfile'>): PlanNotes {
  const levels = [record.homeConcerns['bite-owner'] ?? 0, record.homeConcerns['bite-others'] ?? 0];
  return { professionalHelp: levels.some((l) => l >= 2), supervision: record.triggerProfile.child === 3 };
}
