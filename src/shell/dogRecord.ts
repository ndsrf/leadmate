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
import { findWorld, isWorldComplete, isWorldUnlocked, stopsOf, stretchIdContaining, findStretch, worldsFor } from './world';
import { hasDedicatedLesson, isHomeStretchId } from './homeBehaviours';
import { HOME_CONCERNS, isAgeBand, isConcern, isHomeConcern, isPlanBecause, isSex, readConcernList, readHomeConcerns, type AgeBand, type Concern, type HomeConcern, type HomeConcerns, type ConcernLevel, type PlanItem, type Sex } from './concerns';
import { activityAt, addActivity, readActivityLog, type ActivityEvent } from './activity';
import type { PuzzleSummary } from './puzzle/types';
import { addDiaryEntry, DIARY_OUTCOMES, isDateString, localDateString, markActive, NO_STREAK, type DiaryOutcome, type StreakRecord, type WalkDiaryEntry } from './streak';
import { checkIn, fixFor, readMissions, readSeenFixes, skipDay, NEW_MISSION, type MissionDef, type MissionState, type SeenFix } from './missions/mission';

/** The answers to "how does the Dog cope with being left alone". */
export const ALONE_ANSWERS = ['ok', 'sometimes', 'bad', 'unknown'] as const;
export type AloneAnswer = (typeof ALONE_ANSWERS)[number];
export const isAloneAnswer = (v: unknown): v is AloneAnswer => ALONE_ANSWERS.includes(v as AloneAnswer);

export const RECORD_VERSION = 11;
export const RECORD_KEY = 'leadmate.dog';

/** Seconds of the Checkpoint timer; 0 turns it off. */
export type CheckpointSeconds = 0 | 10 | 15 | 20;

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
  /** What worries the owner most: up to three Concerns in the order picked; empty until answered or skipped. */
  mainConcerns: Concern[];
  /** The level (1 to 3) of each home-behaviour concern; absent means not a concern. Outdoor reactions live in `triggerProfile`. */
  homeConcerns: HomeConcerns;
  /**
   * The Home Stretches that belong to World 2 (ADR 0023). Absent means every home Concern the Dog has; once it is
   * set, a Concern declared after World 2 was complete is not added to it and stays in Other Home Behaviours.
   */
  worldHome?: HomeConcern[];
  /**
   * How the owner said the Dog copes with being left alone. Absent means the question was never asked; any answer, or
   * making being alone a Concern another way, means it was. Answering is not progress.
   */
  aloneAnswer?: AloneAnswer;
  /** The Dog's age band; null until answered. It only reorders the plan, and unset acts as adult. */
  ageBand: AgeBand | null;
  /** The Dog's sex; null until answered. Used for pronouns only. */
  sex: Sex | null;
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
  /** Check-ins on real walks: on Missions, and on Node Debriefs before Missions existed. */
  walkDiary: WalkDiaryEntry[];
  /** The daily Streak; it never affects the attributes above. */
  streak: StreakRecord;
  /** Best Daily Stage handling score (0-1000) by local date. */
  dailyBest: Record<string, number>;
  /** The Daily Solve Time by the Daily Barkdoku board's date: its first solve only, never replaced. */
  dailyBarkdoku: Record<string, DailyBarkdokuSolve>;
  /** ISO date-time of the last change; the later one wins when two copies conflict. */
  updatedAt: string;
  weights: Weights;
  onboarding: OnboardingState;
  /** Ids of the one-shot hints already shown. */
  seenHints: string[];
  /** Ids of the Theory Library Lessons the user reached the end of; only ever grows. */
  readLessons: string[];
  /** Mission state by Mission id; a Mission is absent until its brief is first used. */
  missions: Record<string, MissionState>;
  /** Every Fix the user has been shown, for the Library's "Tus ajustes". */
  seenFixes: SeenFix[];
  /**
   * The Nodes completed before Missions existed (records older than version 7), copied once on migration. Only
   * used to grandfather each World's last Mission; empty for a Dog that started with Missions.
   */
  legacyNodes: string[];
  /** Dated log of what the user did, oldest first, for the Diary; nothing reads progress from it. */
  activityLog: ActivityEvent[];
  /** Verified subscription entitlements from store billing, cached for offline continuity. */
  billing?: BillingRecordState;
}

export interface BillingRecordState {
  isSubscribed: boolean;
  expiresAt: string | null;
  lastVerifiedAt: string;
  tier?: 'annual' | 'monthly';
}

/** The first solve of a date's Daily Barkdoku. */
export interface DailyBarkdokuSolve {
  /** The Solve Time in seconds. */
  seconds: number;
  /** ISO date-time it was solved; the earlier solve wins when two copies conflict. */
  at: string;
  /** The Target Time it was played against; absent when the board had none. */
  targetSeconds?: number;
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
  /** The Personal Plan shown on the card and followed by the map. */
  plan: PlanItem[];
  mockSubscribed?: boolean;
  trialRecapSeenAt?: string;
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
    mainConcerns: [],
    homeConcerns: {},
    ageBand: null,
    sex: null,
    voicePack: DEFAULT_VOICE_PACK,
    checkpointSeconds: 15,
    completedNodes: [],
    stars: {},
    lastStageDate: null,
    posteFailures: 0,
    posture: 0,
    customCues: {},
    walkDiary: [],
    streak: { ...NO_STREAK },
    dailyBest: {},
    dailyBarkdoku: {},
    updatedAt: new Date(0).toISOString(),
    weights: { dogKg: null, handlerKg: null },
    onboarding: { ...NEW_ONBOARDING },
    seenHints: [],
    readLessons: [],
    missions: {},
    seenFixes: [],
    legacyNodes: [],
    activityLog: [],
  };
}

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

function readDiary(raw: unknown): WalkDiaryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((e): WalkDiaryEntry[] => {
    if (!e || typeof e !== 'object') return [];
    const r = e as Partial<Record<keyof WalkDiaryEntry, unknown>>;
    const nodeId = typeof r.nodeId === 'string' ? r.nodeId : undefined;
    const missionId = typeof r.missionId === 'string' ? r.missionId : undefined;
    if (!isDateString(r.date) || !DIARY_OUTCOMES.includes(r.outcome as DiaryOutcome) || (nodeId === undefined && missionId === undefined)) return [];
    const entry: WalkDiaryEntry = { date: r.date, outcome: r.outcome as DiaryOutcome };
    if (nodeId !== undefined) entry.nodeId = nodeId;
    if (missionId !== undefined) entry.missionId = missionId;
    if (typeof r.problemId === 'string') entry.problemId = r.problemId;
    return [entry];
  });
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

function readDailyBarkdoku(raw: unknown): Record<string, DailyBarkdokuSolve> {
  const solves: Record<string, DailyBarkdokuSolve> = {};
  if (!raw || typeof raw !== 'object') return solves;
  for (const [date, v] of Object.entries(raw)) {
    if (!isDateString(date) || !v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    if (typeof r.seconds !== 'number' || !Number.isFinite(r.seconds) || r.seconds <= 0) continue;
    if (typeof r.at !== 'string' || Number.isNaN(Date.parse(r.at))) continue;
    const solve: DailyBarkdokuSolve = { seconds: Math.round(r.seconds), at: r.at };
    if (typeof r.targetSeconds === 'number' && Number.isFinite(r.targetSeconds) && r.targetSeconds > 0) solve.targetSeconds = r.targetSeconds;
    solves[date] = solve;
  }
  return solves;
}

const kg = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is string => typeof n === 'string') : []);

function readWeights(raw: unknown): Weights {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Weights, unknown>>;
  return { dogKg: kg(r.dogKg), handlerKg: kg(r.handlerKg) };
}

/** A stored plan of any version: items as they are, or the Node ids of an old plan mapped to the Stretch holding them. Unknown ids are dropped. */
function readPlan(raw: unknown): PlanItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: PlanItem[] = [];
  for (const entry of raw) {
    let item: PlanItem | undefined;
    if (typeof entry === 'string') {
      const stretchId = stretchIdContaining(entry);
      if (stretchId) item = { stretchId };
    } else if (entry && typeof entry === 'object' && typeof (entry as PlanItem).stretchId === 'string' && (findStretch((entry as PlanItem).stretchId) || isHomeStretchId((entry as PlanItem).stretchId))) {
      const { stretchId, concern, because } = entry as PlanItem;
      item = { stretchId, ...(isConcern(concern) ? { concern } : {}), ...(isPlanBecause(because) ? { because } : {}) };
    }
    if (item && !seen.has(item.stretchId)) {
      seen.add(item.stretchId);
      out.push(item);
    }
  }
  return out;
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
  const out: OnboardingState = {
    step,
    firstStageCompletedAt: completedAt,
    trialStartedAt: strOrNull(r.trialStartedAt),
    diagnosticLatency: kg(r.diagnosticLatency),
    plan: readPlan(r.plan),
  };
  if (typeof r.mockSubscribed === 'boolean') out.mockSubscribed = r.mockSubscribed;
  if (typeof r.trialRecapSeenAt === 'string' && !Number.isNaN(Date.parse(r.trialRecapSeenAt))) {
    out.trialRecapSeenAt = r.trialRecapSeenAt;
  }
  return out;
}

function readBilling(raw: unknown): BillingRecordState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const b = raw as Record<string, unknown>;
  if (typeof b.isSubscribed !== 'boolean') return undefined;
  const expiresAt = typeof b.expiresAt === 'string' && !Number.isNaN(Date.parse(b.expiresAt)) ? b.expiresAt : null;
  const lastVerifiedAt = typeof b.lastVerifiedAt === 'string' && !Number.isNaN(Date.parse(b.lastVerifiedAt)) ? b.lastVerifiedAt : new Date(0).toISOString();
  const tier = b.tier === 'annual' || b.tier === 'monthly' ? b.tier : undefined;
  return {
    isSubscribed: b.isSubscribed,
    expiresAt,
    lastVerifiedAt,
    ...(tier ? { tier } : {}),
  };
}

/** Reads a stored value of any known version into the current shape; anything unreadable gets defaults. */
/** The World every record from before version 8 with progress gets marked complete in (the Basics World). */
export const SKIPPED_WORLD = 'basics';

/**
 * Marks the Basics World complete on a record from before version 8 that already has progress (a finished first
 * Stage, a completed Node, a read Lesson or a started Mission): its Lessons read, its Nodes completed and each of its
 * Missions passed on `today`, unless it already has state. No stars, activity, streak or Diary change, so no
 * celebration follows. A record without progress is left as it is: its user plays the World.
 */
export function skipBasicsWorld(record: DogRecord, version: unknown, today: string): DogRecord {
  if (typeof version === 'number' && version >= 8) return record;
  const progress = record.onboarding.firstStageCompletedAt !== null || record.completedNodes.length > 0 || record.readLessons.length > 0 || Object.keys(record.missions).length > 0;
  const world = findWorld(SKIPPED_WORLD);
  if (!progress || !world) return record;
  const stops = stopsOf(world);
  const union = (have: readonly string[], kind: 'lesson' | 'node') => [...new Set([...have, ...stops.filter((s) => s.kind === kind).map((s) => s.id)])];
  const missions = { ...record.missions };
  for (const s of stops) if (s.kind === 'mission' && !missions[s.id]) missions[s.id] = { ...NEW_MISSION, passedOn: today };
  return { ...record, readLessons: union(record.readLessons, 'lesson'), completedNodes: union(record.completedNodes, 'node'), missions };
}

/**
 * Re-reads `worldHome` of a record from before version 10, when it listed the Home Stretches of World 1 (ADR 0021):
 * the Home Stretches now belong to World 2 (ADR 0023). A Dog whose World 2 is already complete keeps the list, so that
 * World stays complete; any other Dog drops it, so every Concern it has joins World 2.
 */
export function moveHomeStretchesToWorldTwo(record: DogRecord, version: unknown): DogRecord {
  if ((typeof version === 'number' && version >= 10) || !record.worldHome) return record;
  const home = worldsFor(record.onboarding.plan, record).find((w) => w.id === 'home');
  if (home && isWorldComplete(home, record)) return record;
  const { worldHome: _dropped, ...rest } = record;
  return rest;
}

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
  const completedNodes = strings(r.completedNodes);
  const beforeMissions = typeof r.version !== 'number' || r.version < 7;
  const billing = readBilling(r.billing);
  return moveHomeStretchesToWorldTwo(skipBasicsWorld({
    version: RECORD_VERSION,
    attributes,
    triggerProfile: profile,
    calmCounts: typeof r.calmCounts === 'object' && r.calmCounts ? (r.calmCounts as DogRecord['calmCounts']) : {},
    equipment: r.equipment === 'harness' ? 'harness' : 'collar',
    name: cleanDogName(r.name) ?? '',
    coat: isCoat(r.coat) ? r.coat : 'golden',
    breed: isBreed(r.breed) ? r.breed : DEFAULT_BREED,
    // a record saved while the question took one answer keeps it as the first of the list
    mainConcerns: readConcernList(Array.isArray(r.mainConcerns) ? r.mainConcerns : [(r as { mainConcern?: unknown }).mainConcern]),
    homeConcerns: readHomeConcerns(r.homeConcerns),
    ...(Array.isArray(r.worldHome) ? { worldHome: r.worldHome.filter(isHomeConcern) } : {}),
    ...(isAloneAnswer(r.aloneAnswer) ? { aloneAnswer: r.aloneAnswer } : {}),
    ageBand: isAgeBand(r.ageBand) ? r.ageBand : null,
    sex: isSex(r.sex) ? r.sex : null,
    voicePack: typeof r.voicePack === 'string' ? r.voicePack : base.voicePack,
    checkpointSeconds: checkpoint === 0 || checkpoint === 10 || checkpoint === 15 || checkpoint === 20 ? checkpoint : 15,
    completedNodes,
    stars: readStars(r.stars),
    lastStageDate: typeof r.lastStageDate === 'string' ? r.lastStageDate : null,
    posteFailures: Math.max(0, Math.floor(num(r.posteFailures, 0))),
    posture: r.posture === 1 || r.posture === 2 ? r.posture : 0,
    customCues: typeof r.customCues === 'object' && r.customCues ? (r.customCues as Record<string, string>) : {},
    walkDiary: readDiary(r.walkDiary),
    streak: readStreak(r.streak),
    dailyBest: readDailyBest(r.dailyBest),
    dailyBarkdoku: readDailyBarkdoku(r.dailyBarkdoku),
    updatedAt: typeof r.updatedAt === 'string' && !Number.isNaN(Date.parse(r.updatedAt)) ? r.updatedAt : base.updatedAt,
    weights: readWeights(r.weights),
    onboarding: readOnboarding(r.onboarding, r.version),
    seenHints: strings(r.seenHints),
    readLessons: strings(r.readLessons),
    missions: readMissions(r.missions),
    seenFixes: readSeenFixes(r.seenFixes),
    legacyNodes: beforeMissions ? [...completedNodes] : strings(r.legacyNodes),
    activityLog: readActivityLog(r.activityLog),
    ...(billing ? { billing } : {}),
  }, r.version, localDateString(new Date())), r.version);
}

/**
 * The legacy Nodes of two copies of the same Dog. A copy read from a record older than version 7 (a device still on
 * the old app keeps uploading those) counts every Node it holds as legacy, including ones it pulled down after another
 * copy completed them under Missions; a Node that either copy completed but does not hold as legacy is not legacy.
 */
export function mergeLegacyNodes(a: Pick<DogRecord, 'completedNodes' | 'legacyNodes'>, b: Pick<DogRecord, 'completedNodes' | 'legacyNodes'>): string[] {
  const underMissions = new Set([...a.completedNodes.filter((id) => !a.legacyNodes.includes(id)), ...b.completedNodes.filter((id) => !b.legacyNodes.includes(id))]);
  return [...new Set([...a.legacyNodes, ...b.legacyNodes])].filter((id) => !underMissions.has(id));
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

/** The record with its Main Concerns set (distinct, at most three, in the order given). */
export function setMainConcerns(record: DogRecord, concerns: readonly Concern[]): DogRecord {
  return { ...record, mainConcerns: readConcernList([...concerns]) };
}

/** The record with one home-behaviour concern at a level; level 0 removes it. */
export function setHomeConcern(record: DogRecord, concern: HomeConcern, level: ConcernLevel | 0): DogRecord {
  const homeConcerns = { ...record.homeConcerns };
  if (level === 0) delete homeConcerns[concern];
  else homeConcerns[concern] = level;
  // a Home Stretch joins World 2 with its Concern unless World 2 is already complete (it must stay complete)
  const members = record.worldHome ?? HOME_CONCERNS.filter((c) => (record.homeConcerns[c] ?? 0) > 0);
  const homeWorld = worldsFor(record.onboarding.plan, record).find((w) => w.id === 'home');
  const joins = level > 0 && !members.includes(concern) && !(homeWorld && isWorldComplete(homeWorld, record));
  // making being alone a Concern any other way also counts as answering the question
  const answered = concern === 'alone' && level > 0 && record.aloneAnswer === undefined ? { aloneAnswer: level === 3 ? ('bad' as const) : ('sometimes' as const) } : {};
  return { ...record, ...answered, homeConcerns, worldHome: joins ? [...members, concern] : [...members] };
}

/** The Concern level each answer sets; "ok" and "unknown" set none. */
const ALONE_LEVEL: Record<AloneAnswer, ConcernLevel | 0> = { ok: 0, sometimes: 2, bad: 3, unknown: 0 };

/**
 * The owner's answer about being left alone: it is kept (so the card is not asked again) and turned into the Concern
 * level for being alone. It touches nothing else: answering is not progress (no Active Day, star, Diary or Activity).
 */
export function answerAlone(record: DogRecord, answer: AloneAnswer): DogRecord {
  const level = ALONE_LEVEL[answer];
  const answered = { ...record, aloneAnswer: answer };
  return level > 0 ? setHomeConcern(answered, 'alone', level) : answered;
}

/** True when the one-time question about being alone should show: never answered, World 2 open, and a Lesson to offer. */
export function shouldAskAlone(record: DogRecord): boolean {
  if (record.aloneAnswer !== undefined || !hasDedicatedLesson('alone')) return false;
  const home = worldsFor(record.onboarding.plan, record).find((w) => w.id === 'home');
  return home !== undefined && isWorldUnlocked(home, record);
}

export function setAgeBand(record: DogRecord, ageBand: AgeBand | null): DogRecord {
  return { ...record, ageBand };
}

export function setSex(record: DogRecord, sex: Sex | null): DogRecord {
  return { ...record, sex };
}

/** The record with one Mission's state changed (e.g. by `startMission`); an unchanged state returns the same record. */
export function updateMission(record: DogRecord, missionId: string, change: (state: MissionState) => MissionState): DogRecord {
  const before = record.missions[missionId] ?? NEW_MISSION;
  const after = change(before);
  return after === before ? record : { ...record, missions: { ...record.missions, [missionId]: after } };
}

/**
 * A Mission check-in: the Mission state moves on, the answer is logged in the Walk Diary with its Mission and
 * problem, the day counts for the Streak, and a struggle's Fix joins the seen Fixes. A closed check-in changes
 * nothing. The Learning Attributes are never touched.
 */
export function applyMissionCheckIn(record: DogRecord, mission: MissionDef, outcome: DiaryOutcome, problemId: string | undefined, now: Date): DogRecord {
  const before = record.missions[mission.id] ?? NEW_MISSION;
  const after = checkIn(before, outcome, problemId, now);
  if (after === before) return record;
  const attempt = after.attempts[after.attempts.length - 1];
  const date = localDateString(now);
  const entry: WalkDiaryEntry = { date, missionId: mission.id, outcome };
  if (attempt.problemId) entry.problemId = attempt.problemId;
  let seenFixes = record.seenFixes;
  if (outcome === 'struggled') {
    const fix = fixFor(mission, attempt.problemId);
    if (!seenFixes.some((f) => f.fixId === fix.id)) seenFixes = [...seenFixes, { fixId: fix.id, missionId: mission.id, at: now.toISOString() }];
  }
  return {
    ...record,
    missions: { ...record.missions, [mission.id]: after },
    walkDiary: addDiaryEntry(record.walkDiary, entry),
    streak: markActive(record.streak, date),
    seenFixes,
  };
}

/**
 * Completes a Mission directly without a waiting gate (e.g. for the World 1 check when the user already does it).
 * Marks the day active on the Streak.
 */
export function passMissionDirectly(record: DogRecord, missionId: string, now: Date): DogRecord {
  const before = record.missions[missionId] ?? NEW_MISSION;
  const date = localDateString(now);
  const after: MissionState = { ...before, passedOn: date };
  return {
    ...record,
    missions: { ...record.missions, [missionId]: after },
    streak: markActive(record.streak, date),
  };
}

/**
 * A Day Skip (ADR 0014): the waiting Mission becomes owed and the skip is logged for the Diary. A skip that does not
 * apply returns the same record. Streak, Walk Diary and Learning Attributes are never touched.
 */
export function applyDaySkip(record: DogRecord, missionId: string, now: Date): DogRecord {
  const after = updateMission(record, missionId, (m) => skipDay(m, now));
  if (after === record) return record;
  return { ...after, activityLog: addActivity(record.activityLog, activityAt(now, { kind: 'skip', id: missionId })) };
}

/** Marks today as active (a Node Debrief or a Daily Stage) without touching anything else. */
export function applyActivity(record: DogRecord, now: Date): DogRecord {
  const streak = markActive(record.streak, localDateString(now));
  return streak === record.streak ? record : { ...record, streak };
}

/**
 * Records a solve of the Daily Barkdoku board dated `boardDate`. Only the date's first solve counts (ADR 0014): it
 * keeps the Daily Solve Time and logs the solve. The Streak is marked on the day it was played either way.
 */
export function recordDailyBarkdoku(record: DogRecord, boardId: string, summary: PuzzleSummary, stars: Stars, boardDate: string, now: Date): DogRecord {
  const active = applyActivity(record, now);
  if (record.dailyBarkdoku[boardDate] !== undefined) return active;
  const solve: DailyBarkdokuSolve = {
    seconds: summary.durationSeconds,
    at: now.toISOString(),
    ...(summary.targetSeconds !== undefined ? { targetSeconds: summary.targetSeconds } : {}),
  };
  return {
    ...active,
    dailyBarkdoku: { ...active.dailyBarkdoku, [boardDate]: solve },
    activityLog: addActivity(active.activityLog, activityAt(now, { kind: 'barkdoku', id: boardId, stars, puzzle: summary })),
  };
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
