import type { DistractorKind } from '../sim/learning';

/** The problems owners have at home; they never reach the simulation. */
export const HOME_CONCERNS = ['bite-owner', 'bite-others', 'bark-home', 'destroy', 'eat-objects', 'alone'] as const;
export type HomeConcern = (typeof HOME_CONCERNS)[number];

/** Asked in the app (a one-time card, Other Home Behaviours, Settings), never in onboarding or as a Main Concern. */
export const NON_ONBOARDING_HOME_CONCERNS: readonly HomeConcern[] = ['alone'];
/** The home concerns onboarding offers. */
export const ONBOARDING_HOME_CONCERNS: readonly HomeConcern[] = HOME_CONCERNS.filter(
  (c) => !NON_ONBOARDING_HOME_CONCERNS.includes(c),
);

/** The outdoor reactions; they live in the Trigger Profile, keyed by Distractor kind. */
export const OUTDOOR_CONCERNS = ['react-dog', 'react-child', 'react-bicycle', 'react-skateboard', 'react-food'] as const;
export type OutdoorConcern = (typeof OUTDOOR_CONCERNS)[number];

export type Concern = HomeConcern | OutdoorConcern;
export const CONCERNS: readonly Concern[] = [...HOME_CONCERNS, ...OUTDOOR_CONCERNS];
/** The Concerns onboarding offers as Main Concern chips. */
export const ONBOARDING_CONCERNS: readonly Concern[] = [...ONBOARDING_HOME_CONCERNS, ...OUTDOOR_CONCERNS];

/** The Distractor kind of each outdoor Concern. */
export const KIND_OF_OUTDOOR: Record<OutdoorConcern, DistractorKind> = {
  'react-dog': 'dog',
  'react-child': 'child',
  'react-bicycle': 'bicycle',
  'react-skateboard': 'skateboard',
  'react-food': 'food',
};

/** How many Concerns the owner can name as the ones that worry them most. */
export const MAX_MAIN_CONCERNS = 3;

export const isHomeConcern = (v: unknown): v is HomeConcern => HOME_CONCERNS.includes(v as HomeConcern);
export const isConcern = (v: unknown): v is Concern => CONCERNS.includes(v as Concern);
/** Whether a Concern can be one of the Main Concerns. */
export const isMainConcernable = (v: unknown): v is Concern => ONBOARDING_CONCERNS.includes(v as Concern);

/** The Distractor kind of an outdoor Concern; undefined for a Home Behaviour. */
export function outdoorKind(concern: Concern): DistractorKind | undefined {
  return isHomeConcern(concern) ? undefined : KIND_OF_OUTDOOR[concern];
}

/** 1 (a little) to 3 (a lot); a home concern at 0 is simply absent. */
export type ConcernLevel = 1 | 2 | 3;
export type HomeConcerns = Partial<Record<HomeConcern, ConcernLevel>>;

export const AGE_BANDS = ['puppy', 'adolescent', 'adult', 'senior'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];
export const isAgeBand = (v: unknown): v is AgeBand => AGE_BANDS.includes(v as AgeBand);

export const SEXES = ['male', 'female'] as const;
export type Sex = (typeof SEXES)[number];
export const isSex = (v: unknown): v is Sex => SEXES.includes(v as Sex);

export const isConcernLevel = (v: unknown): v is ConcernLevel => v === 1 || v === 2 || v === 3;

/** A stored home-concerns value read into the current shape; anything unreadable is dropped. */
export function readHomeConcerns(raw: unknown): HomeConcerns {
  const out: HomeConcerns = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const concern of HOME_CONCERNS) {
    const level = (raw as Record<string, unknown>)[concern];
    if (isConcernLevel(level)) out[concern] = level;
  }
  return out;
}

/** One entry of the Personal Plan: a Stretch, named by the id of its first Stop, and the Concern that put it there. */
export interface PlanItem {
  stretchId: string;
  /** The Concern that put it there; absent for an item placed by age, reaction time or the default order. */
  concern?: Concern;
  /** Why an item with no Concern is there. */
  because?: PlanBecause;
}

export const PLAN_BECAUSE = ['puppy', 'adolescent', 'slow'] as const;
export type PlanBecause = (typeof PLAN_BECAUSE)[number];
export const isPlanBecause = (v: unknown): v is PlanBecause => PLAN_BECAUSE.includes(v as PlanBecause);

/** A stored list of Main Concerns read into the current shape: known, distinct, at most `MAX_MAIN_CONCERNS`, in order. */
export function readConcernList(raw: unknown): Concern[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(isMainConcernable))].slice(0, MAX_MAIN_CONCERNS);
}
