import {
  DEFAULT_ATTRIBUTES,
  DEFAULT_TRIGGER_PROFILE,
  DISTRACTOR_KINDS,
  ATTRIBUTE_KEYS,
  type DistractorKind,
  type Equipment,
  type LearningAttributes,
  type LearningSnapshot,
  type TriggerLevel,
  type TriggerProfile,
} from '../sim/learning';
import type { SimulationDebriefPayload } from '../sim/payload';
import { DEFAULT_VOICE_PACK } from './voice';
import { bestStars, isStars, starsFor, type Stars } from './stars';
import { isCoat, type DogCoat } from './onboarding/look';
import { DEFAULT_BREED, isBreed, type BreedId } from './onboarding/breeds';
import { cleanDogName } from './onboarding/name';
import { nextPosture, updateLearning, updateTriggerProfile } from './learning';
import { isOnboardingStep, type OnboardingStep } from './onboarding/flow';
import { addDiaryEntry, DIARY_OUTCOMES, isDateString, localDateString, markActive, NO_STREAK, type DiaryOutcome, type StreakRecord, type WalkDiaryEntry } from './streak';

export const RECORD_VERSION = 6;
export const RECORD_KEY = 'leadmate.dog';

/** Seconds of the Checkpoint timer; 0 turns it off. */
export type CheckpointSeconds = 0 | 5 | 10;

/**
 * Everything the app remembers about the Dog, in one versioned record per Dog. Shaped so that
 * `onboarding-and-accounts` can migrate it on registration. Nothing here is lowered by absence.
 */
export interface DogRecord {
  version: typeof RECORD_VERSION;
  attributes: LearningAttributes;
  triggerProfile: TriggerProfile;
  /** Calm encounters counted toward lowering each kind's level. */
  calmCounts: Partial<Record<DistractorKind, number>>;
  equipment: Equipment;
  /** What the user calls the Dog; empty for a Dog from before names, and the text then says "your Dog". */
  name: string;
  /** The Dog's coat colour, drawn in the Stage; purely cosmetic. */
  coat: DogCoat;
  /** The Dog's breed, drawn in the shell and used as a weight hint; cosmetic, the simulation never reads it. */
  breed: BreedId;
  voicePack: string;
  checkpointSeconds: CheckpointSeconds;
  completedNodes: string[];
  /** Best star rating (1-3) per completed Node; derived from handling quality, only ever raised, and a Node completed before stars existed shows 1. */
  stars: Record<string, Stars>;
  /** ISO date-time of the last graded Stage; null before the first. */
  lastStageDate: string | null;
  /** Failed Poste attempts in a row, for the link back to the practice Node. */
  posteFailures: number;
  /** Visual posture reached; never goes back. */
  posture: 0 | 1 | 2;
  /** Device-only recordings of the user's own Cue, by language code. */
  customCues: Record<string, string>;
  /** Check-ins on the real-world exercise of each Node. */
  walkDiary: WalkDiaryEntry[];
  /** The daily Streak; it never affects the attributes above. */
  streak: StreakRecord;
  /** Best Daily Stage handling score (0-1000) by local date. */
  dailyBest: Record<string, number>;
  /** ISO date-time of the last change; the later one wins when two copies conflict. */
  updatedAt: string;
  weights: Weights;
  onboarding: OnboardingState;
  /** Ids of the one-shot hints already shown. */
  seenHints: string[];
}

/** Dog and Handler weights in kilograms; null until entered (setup lets the user skip). */
export interface Weights {
  dogKg: number | null;
  handlerKg: number | null;
}

/** Where the first-run funnel stands, and what it recorded along the way. */
export interface OnboardingState {
  step: OnboardingStep;
  firstStageCompletedAt: string | null;
  trialStartedAt: string | null;
  /** Median reaction time of the Diagnostic, in seconds; null before it ran. */
  diagnosticLatency: number | null;
  /** Node ids of the Walk Plan shown on the card. */
  plan: string[];
}

export const NEW_ONBOARDING: OnboardingState = { step: 'welcome', firstStageCompletedAt: null, trialStartedAt: null, diagnosticLatency: null, plan: [] };

export function newDogRecord(): DogRecord {
  return {
    version: RECORD_VERSION,
    attributes: { ...DEFAULT_ATTRIBUTES },
    triggerProfile: { ...DEFAULT_TRIGGER_PROFILE },
    calmCounts: {},
    equipment: 'collar',
    name: '',
    coat: 'golden',
    breed: DEFAULT_BREED,
    voicePack: DEFAULT_VOICE_PACK,
    checkpointSeconds: 5,
    completedNodes: [],
    stars: {},
    lastStageDate: null,
    posteFailures: 0,
    posture: 0,
    customCues: {},
    walkDiary: [],
    streak: { ...NO_STREAK },
    dailyBest: {},
    updatedAt: new Date(0).toISOString(),
    weights: { dogKg: null, handlerKg: null },
    onboarding: { ...NEW_ONBOARDING },
    seenHints: [],
  };
}

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

function readDiary(raw: unknown): WalkDiaryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is WalkDiaryEntry =>
      !!e && typeof e === 'object' && isDateString((e as WalkDiaryEntry).date) && typeof (e as WalkDiaryEntry).nodeId === 'string' && DIARY_OUTCOMES.includes((e as WalkDiaryEntry).outcome),
  );
}

function readStreak(raw: unknown): StreakRecord {
  if (!raw || typeof raw !== 'object') return { ...NO_STREAK };
  const r = raw as Partial<Record<keyof StreakRecord, unknown>>;
  const current = Math.max(0, Math.floor(num(r.current, 0)));
  const last = isDateString(r.lastActiveDate) ? r.lastActiveDate : '';
  return { current: last ? current : 0, best: Math.max(current, Math.floor(num(r.best, 0))), lastActiveDate: last };
}

function readStars(raw: unknown): Record<string, Stars> {
  const stars: Record<string, Stars> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return stars;
  for (const [id, value] of Object.entries(raw)) if (isStars(value)) stars[id] = value;
  return stars;
}

function readDailyBest(raw: unknown): Record<string, number> {
  const best: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return best;
  for (const [date, score] of Object.entries(raw)) {
    if (isDateString(date) && typeof score === 'number' && Number.isFinite(score)) best[date] = Math.max(0, Math.min(1000, Math.round(score)));
  }
  return best;
}

const kg = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is string => typeof n === 'string') : []);

function readWeights(raw: unknown): Weights {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Weights, unknown>>;
  return { dogKg: kg(r.dogKg), handlerKg: kg(r.handlerKg) };
}

/** A record saved before onboarding existed belongs to an existing user, who never sees the funnel. */
function readOnboarding(raw: unknown, version: unknown): OnboardingState {
  if (!raw || typeof raw !== 'object') return { ...NEW_ONBOARDING, step: 'done' };
  const r = raw as Partial<Record<keyof OnboardingState, unknown>>;
  // before version 5 the paywall came ahead of the first Stage; a user at it still has that Stage to play
  const old = typeof version !== 'number' || version < 5;
  const completedAt = strOrNull(r.firstStageCompletedAt);
  let step: OnboardingStep = isOnboardingStep(r.step) ? r.step : 'setup';
  if (old && step === 'paywall') step = 'first-stage';
  // before version 5 the first Stage came after the paywall: one who has played it has seen everything
  else if (old && step === 'first-stage' && completedAt) step = 'done';
  return {
    step,
    firstStageCompletedAt: completedAt,
    trialStartedAt: strOrNull(r.trialStartedAt),
    diagnosticLatency: kg(r.diagnosticLatency),
    plan: strings(r.plan),
  };
}

/** Reads a stored value of any known version into the current shape; anything unreadable gets defaults. */
export function migrateRecord(raw: unknown): DogRecord {
  const base = newDogRecord();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Record<keyof DogRecord, unknown>>;
  const attributes = { ...base.attributes };
  const stored = (r.attributes ?? {}) as Partial<LearningAttributes>;
  for (const key of ATTRIBUTE_KEYS) attributes[key] = Math.max(0, Math.min(1, num(stored[key], base.attributes[key])));
  const profile = { ...base.triggerProfile };
  const storedProfile = (r.triggerProfile ?? {}) as Partial<Record<DistractorKind, unknown>>;
  for (const kind of DISTRACTOR_KINDS) {
    const level = storedProfile[kind];
    if (level === 0 || level === 1 || level === 2 || level === 3) profile[kind] = level;
  }
  const checkpoint = r.checkpointSeconds;
  return {
    version: RECORD_VERSION,
    attributes,
    triggerProfile: profile,
    calmCounts: typeof r.calmCounts === 'object' && r.calmCounts ? (r.calmCounts as DogRecord['calmCounts']) : {},
    equipment: r.equipment === 'harness' ? 'harness' : 'collar',
    name: cleanDogName(r.name) ?? '',
    coat: isCoat(r.coat) ? r.coat : 'golden',
    breed: isBreed(r.breed) ? r.breed : DEFAULT_BREED,
    voicePack: typeof r.voicePack === 'string' ? r.voicePack : base.voicePack,
    checkpointSeconds: checkpoint === 0 || checkpoint === 10 ? checkpoint : 5,
    completedNodes: Array.isArray(r.completedNodes) ? r.completedNodes.filter((n): n is string => typeof n === 'string') : [],
    stars: readStars(r.stars),
    lastStageDate: typeof r.lastStageDate === 'string' ? r.lastStageDate : null,
    posteFailures: Math.max(0, Math.floor(num(r.posteFailures, 0))),
    posture: r.posture === 1 || r.posture === 2 ? r.posture : 0,
    customCues: typeof r.customCues === 'object' && r.customCues ? (r.customCues as Record<string, string>) : {},
    walkDiary: readDiary(r.walkDiary),
    streak: readStreak(r.streak),
    dailyBest: readDailyBest(r.dailyBest),
    updatedAt: typeof r.updatedAt === 'string' && !Number.isNaN(Date.parse(r.updatedAt)) ? r.updatedAt : base.updatedAt,
    weights: readWeights(r.weights),
    onboarding: readOnboarding(r.onboarding, r.version),
    seenHints: strings(r.seenHints),
  };
}

/** Where the record lives; AsyncStorage satisfies it on a phone and in the browser. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem?(key: string): Promise<void>;
}

export async function loadDogRecord(store: KeyValueStore): Promise<DogRecord> {
  try {
    const raw = await store.getItem(RECORD_KEY);
    return raw ? migrateRecord(JSON.parse(raw)) : newDogRecord();
  } catch {
    return newDogRecord();
  }
}

export async function saveDogRecord(store: KeyValueStore, record: DogRecord): Promise<void> {
  await store.setItem(RECORD_KEY, JSON.stringify(record));
}

/** The record stamped as changed at `now`; always strictly later than the previous stamp. */
export function touch(record: DogRecord, now: Date): DogRecord {
  const stamp = Math.max(now.getTime(), Date.parse(record.updatedAt) + 1);
  return { ...record, updatedAt: new Date(stamp).toISOString() };
}

/** The read-only snapshot a Stage receives (ADR 0003). */
export function toSnapshot(record: DogRecord, capacityMultiplier = 1): LearningSnapshot {
  return {
    attributes: { ...record.attributes },
    triggerProfile: { ...record.triggerProfile },
    equipment: record.equipment,
    capacityMultiplier,
    posture: record.posture,
  };
}

/** True when the Stage met a Distractor but the Handler never got a Poste success out of it. */
export function failedPoste(payload: SimulationDebriefPayload): boolean {
  return payload.missedOpportunities > 0 && payload.posteSuccesses === 0;
}

/**
 * The record after a graded Stage: new Learning Attributes, Trigger Profile and posture, the Stage
 * date and the Poste failure streak. Minigames and warm-ups never come through here.
 */
export function applyStage(record: DogRecord, payload: SimulationDebriefPayload, now: Date): DogRecord {
  const attributes = updateLearning(record.attributes, payload);
  const triggers = updateTriggerProfile(record.triggerProfile, record.calmCounts, payload);
  return {
    ...record,
    attributes,
    triggerProfile: triggers.profile,
    calmCounts: triggers.counts,
    posture: nextPosture(attributes, record.posture),
    lastStageDate: now.toISOString(),
    posteFailures: payload.posteSuccesses > 0 ? 0 : failedPoste(payload) ? record.posteFailures + 1 : record.posteFailures,
  };
}

export function setTriggerLevel(record: DogRecord, kind: DistractorKind, level: TriggerLevel): DogRecord {
  return { ...record, triggerProfile: { ...record.triggerProfile, [kind]: level }, calmCounts: { ...record.calmCounts, [kind]: 0 } };
}

/** A check-in on a Node's real-world exercise: logged in the Walk Diary, and the day counts for the Streak. */
export function applyDiary(record: DogRecord, nodeId: string, outcome: DiaryOutcome, now: Date): DogRecord {
  const date = localDateString(now);
  return { ...record, walkDiary: addDiaryEntry(record.walkDiary, { date, nodeId, outcome }), streak: markActive(record.streak, date) };
}

/** Marks today as active (a Node Debrief or a Daily Stage) without touching anything else. */
export function applyActivity(record: DogRecord, now: Date): DogRecord {
  const streak = markActive(record.streak, localDateString(now));
  return streak === record.streak ? record : { ...record, streak };
}

export interface DailyResult {
  record: DogRecord;
  /** The first score of the day. */
  firstOfDay: boolean;
  /** The score beat the day's best (or was the first). */
  improved: boolean;
  best: number;
}

/**
 * Records a Daily Stage score for `date`: replays are unlimited and only a better score replaces
 * the day's best. Nothing else in the record changes here.
 */
export function recordDailyScore(record: DogRecord, date: string, score: number): DailyResult {
  const clean = Math.max(0, Math.min(1000, Math.round(score)));
  const before = record.dailyBest[date];
  const firstOfDay = before === undefined;
  const improved = firstOfDay || clean > before;
  const best = improved ? clean : before;
  return { record: improved ? { ...record, dailyBest: { ...record.dailyBest, [date]: best } } : record, firstOfDay, improved, best };
}
