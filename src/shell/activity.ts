import type { SimulationDebriefPayload } from '../sim/payload';
import type { PuzzleSummary } from './puzzle/types';
import { isStars, type Stars } from './stars';
import { isDateString, localDateString } from './streak';

/**
 * The Activity Log: one dated entry per thing the user did (a Node Debrief, a Daily Stage, the first
 * Daily Barkdoku solve of a day, a Lesson read, the first Stage), kept for the Diary. It is a record of what happened, never an input: no
 * Learning Attribute, Streak or star is ever read back from it.
 */

export type ActivityKind = 'node' | 'daily' | 'barkdoku' | 'lesson' | 'first-stage';
const ACTIVITY_KINDS: readonly ActivityKind[] = ['node', 'daily', 'barkdoku', 'lesson', 'first-stage'];

/** The numbers of one Stage kept in the log. */
export interface StageSummary {
  score: number;
  durationSeconds: number;
  slack: number;
  pull: number;
  peakArousal: number;
  /** Absent when there was no Marker hit. */
  markerAccuracyMs?: number;
  markerHits: number;
  missedOpportunities: number;
  checkInHits: number;
  posteSuccesses: number;
  harshStops: number;
  sintoniaSeconds: number;
  goSniffs: number;
}

/** Minigame results, 0 (worst) to 1, by Metric. */
export type MinigameMetrics = Partial<Record<'tension' | 'timing' | 'poste' | 'attention', number>>;

export interface ActivityEvent {
  /** ISO date-time it happened. */
  at: string;
  /** Local calendar day it happened, `YYYY-MM-DD`. */
  date: string;
  kind: ActivityKind;
  /** The Node, Lesson or Barkdoku board id; empty for a Daily Stage and the first Stage. */
  id: string;
  /** Stars earned on this run (not the best). */
  stars?: Stars;
  stage?: StageSummary;
  metrics?: MinigameMetrics;
  /** The solved board of a Daily Barkdoku or a Barkdoku Node. */
  puzzle?: PuzzleSummary;
  /** Catalog key of the real-world exercise the Debrief assigned. */
  exercise?: string;
}

/** Oldest entries are dropped past this many, so the record stays small. */
export const ACTIVITY_LOG_MAX = 500;

export function stageSummary(p: SimulationDebriefPayload): StageSummary {
  return {
    score: p.handlingScore,
    durationSeconds: p.durationSeconds,
    slack: p.slackPercentage,
    pull: p.pullPercentage,
    peakArousal: p.peakArousalScore,
    ...(p.markerAccuracyMs !== undefined ? { markerAccuracyMs: p.markerAccuracyMs } : {}),
    markerHits: p.markerHits,
    missedOpportunities: p.missedOpportunities,
    checkInHits: p.checkInHits,
    posteSuccesses: p.posteSuccesses,
    harshStops: p.harshStops,
    sintoniaSeconds: p.sintoniaTimeSeconds,
    goSniffs: p.goSniffs,
  };
}

/** A new log entry stamped at `now`. */
export function activityAt(now: Date, entry: Omit<ActivityEvent, 'at' | 'date'>): ActivityEvent {
  return { at: now.toISOString(), date: localDateString(now), ...entry };
}

export const activityKey = (e: ActivityEvent) => `${e.at}|${e.kind}|${e.id}`;

/** The log sorted oldest first and cut to the newest `ACTIVITY_LOG_MAX`. */
export function trimLog(log: readonly ActivityEvent[]): ActivityEvent[] {
  const sorted = [...log].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return sorted.slice(Math.max(0, sorted.length - ACTIVITY_LOG_MAX));
}

/** Adds an entry to a log. */
export function addActivity(log: readonly ActivityEvent[], event: ActivityEvent): ActivityEvent[] {
  return trimLog([...log, event]);
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function readStage(raw: unknown): StageSummary | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const fields = ['score', 'durationSeconds', 'slack', 'pull', 'peakArousal', 'markerHits', 'missedOpportunities', 'checkInHits', 'posteSuccesses', 'harshStops', 'sintoniaSeconds', 'goSniffs'] as const;
  if (!fields.every((f) => finite(r[f]))) return undefined;
  const stage = Object.fromEntries(fields.map((f) => [f, r[f]])) as unknown as StageSummary;
  if (finite(r.markerAccuracyMs)) stage.markerAccuracyMs = r.markerAccuracyMs;
  return stage;
}

function readMetrics(raw: unknown): MinigameMetrics | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const metrics: MinigameMetrics = {};
  for (const key of ['tension', 'timing', 'poste', 'attention'] as const) {
    const v = (raw as Record<string, unknown>)[key];
    if (finite(v)) metrics[key] = Math.max(0, Math.min(1, v));
  }
  return metrics;
}

const DIFFICULTIES: readonly NonNullable<PuzzleSummary['difficulty']>[] = ['tutorial', 'easy', 'medium', 'hard'];

function readPuzzle(raw: unknown): PuzzleSummary | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (!finite(r.size) || r.size < 4 || r.size > 9 || !finite(r.durationSeconds) || r.durationSeconds <= 0 || !finite(r.mistakes) || r.mistakes < 0) return undefined;
  const puzzle: PuzzleSummary = { size: r.size, durationSeconds: r.durationSeconds, mistakes: r.mistakes };
  if (DIFFICULTIES.includes(r.difficulty as never)) puzzle.difficulty = r.difficulty as PuzzleSummary['difficulty'];
  if (finite(r.targetSeconds) && r.targetSeconds > 0) puzzle.targetSeconds = r.targetSeconds;
  return puzzle;
}

/** Reads a stored log; unreadable entries are dropped. */
export function readActivityLog(raw: unknown): ActivityEvent[] {
  if (!Array.isArray(raw)) return [];
  const log: ActivityEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.at !== 'string' || Number.isNaN(Date.parse(r.at)) || !isDateString(r.date)) continue;
    if (!ACTIVITY_KINDS.includes(r.kind as ActivityKind) || typeof r.id !== 'string') continue;
    const event: ActivityEvent = { at: r.at, date: r.date, kind: r.kind as ActivityKind, id: r.id };
    if (isStars(r.stars)) event.stars = r.stars;
    const stage = readStage(r.stage);
    if (stage) event.stage = stage;
    const metrics = readMetrics(r.metrics);
    if (metrics) event.metrics = metrics;
    const puzzle = readPuzzle(r.puzzle);
    if (puzzle) event.puzzle = puzzle;
    if (typeof r.exercise === 'string') event.exercise = r.exercise;
    log.push(event);
  }
  return trimLog(log);
}
