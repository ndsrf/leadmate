import type { TextKey } from '../../i18n';
import type { LessonBlock } from '../lessons/lesson';
import { DIARY_OUTCOMES, isDateString, localDateString, type DiaryOutcome } from '../streak';
import type { Stop } from '../world';

/**
 * Corrective help for one problem of a Mission: Lesson-style blocks (reassurance, the likely cause, then the
 * corrections with at least one image or video), the easier target for the next attempt and the Stop to practise.
 */
export interface Fix {
  id: string;
  blocks: LessonBlock[];
  easierTarget: TextKey;
  practise: Stop;
  placeholder?: boolean;
}

export interface MissionProblem {
  id: string;
  label: TextKey;
  fix: Fix;
}

/** A real-world task that ends a Stretch; all text is catalog keys so content is plain data. */
export interface MissionDef {
  id: string;
  title: TextKey;
  /** What to do on the walk. */
  target: TextKey;
  /** How many times. */
  reps: number;
  /** What success looks like. */
  successSign: TextKey;
  /** The technique of the Stretch; every Node Stop of the Stretch trains it. */
  technique: string;
  /** The Stops that train the target. */
  trains: Stop[];
  problems: MissionProblem[];
  /** The Fix for "Otra cosa", and the easier target offered after three skips. */
  generalFix: Fix;
  placeholder?: boolean;
}

/** The problem id of "Otra cosa": it leads to the general Fix. */
export const OTHER_PROBLEM = 'other';

export interface MissionAttempt {
  /** Local calendar date of the answer. */
  date: string;
  /** ISO date-time of the answer; the key when two devices are merged. */
  at: string;
  outcome: DiaryOutcome;
  problemId?: string;
}

/** Where one Mission stands on the Dog record; absent from `missions` until the brief is first used. */
export interface MissionState {
  /** ISO date-time the wait started: "Start mission", or the last struggle or skip. Absent until started. */
  startedAt?: string;
  /** The Debrief exercise shown as "Tu foco". */
  focus?: TextKey;
  target: 'full' | 'easier';
  /** "Hoy no pudimos" answers in a row. */
  skipRun: number;
  /** Local date the Mission was passed. */
  passedOn?: string;
  /** Passed with "Move on anyway". */
  keepPractising?: boolean;
  /** ISO date-time of the Day Skip; with no `passedOn`, the Mission is owed (ADR 0014). */
  skippedAt?: string;
  attempts: MissionAttempt[];
}

export const NEW_MISSION: MissionState = { target: 'full', skipRun: 0, attempts: [] };

const HOUR = 3_600_000;
/** The minimum wait between the start (or the last answer) and the check-in, on top of the later-day rule. */
export const MIN_WAIT_MS = 8 * HOUR;
/** "Hoy no pudimos" answers in a row before the easier target is offered. */
export const SKIPS_BEFORE_OFFER = 3;
/** Struggles before "Move on anyway" is offered. */
export const STRUGGLES_BEFORE_MOVE_ON = 2;

const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

export function startMission(state: MissionState, now: Date): MissionState {
  if (state.passedOn || state.startedAt) return state;
  return { ...state, startedAt: now.toISOString() };
}

/** The moment the wait counts from: the later of the start and the last answer; null before the start. */
function waitAnchor(state: MissionState): Date | null {
  if (!state.startedAt) return null;
  const times = [state.startedAt, ...state.attempts.map((a) => a.at)].map(Date.parse);
  return new Date(Math.max(...times));
}

/** The first local midnight after `at`; DST-safe because it is built from calendar fields. */
function nextMidnight(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate() + 1);
}

/**
 * When the check-in opens: a later local calendar day than the start or the last answer, and at least 8 hours
 * after it. Null when the Mission has not started or is passed.
 */
export function checkInOpensAt(state: MissionState): Date | null {
  const anchor = waitAnchor(state);
  if (!anchor || state.passedOn) return null;
  return new Date(Math.max(nextMidnight(anchor).getTime(), anchor.getTime() + MIN_WAIT_MS));
}

/** Whether the opening moment is the next midnight itself ("Mañana") or a time of day after it ("A las HH:MM"). */
export function opensAtMidnight(state: MissionState): boolean {
  const anchor = waitAnchor(state);
  const opens = checkInOpensAt(state);
  return !!anchor && !!opens && opens.getTime() === nextMidnight(anchor).getTime();
}

/** True when an answer can be chosen now. A clock earlier than the start keeps it closed. */
export function canCheckIn(state: MissionState, now: Date): boolean {
  const anchor = waitAnchor(state);
  const opens = checkInOpensAt(state);
  return !!anchor && !!opens && now.getTime() >= anchor.getTime() && now.getTime() >= opens.getTime();
}

/** An Owed Mission: skipped with a Day Skip and not passed since. It opens the trail but does not close its World. */
export function isOwed(state: MissionState | undefined): boolean {
  return !!state?.skippedAt && !state.passedOn;
}

/**
 * A Day Skip: a started Mission waiting for its check-in becomes owed. Its target, wait and answers are kept, so
 * the check-in opens as before. Anything else (not started, due, passed, already skipped) changes nothing.
 */
export function skipDay(state: MissionState, now: Date): MissionState {
  if (!state.startedAt || state.passedOn || state.skippedAt || canCheckIn(state, now)) return state;
  return { ...state, skippedAt: now.toISOString() };
}

/** The answer given today, if any; one answer per Mission per local day. */
export function todaysAttempt(state: MissionState, now: Date): MissionAttempt | undefined {
  const today = localDateString(now);
  return state.attempts.find((a) => a.date === today);
}

/**
 * The state after a check-in answer. "completed" passes the Mission whichever target is active; "struggled"
 * switches to the easier target, restarts the wait and breaks the skip run; "skipped" restarts the wait and
 * extends the skip run. A closed check-in changes nothing.
 */
export function checkIn(state: MissionState, outcome: DiaryOutcome, problemId: string | undefined, now: Date): MissionState {
  if (!canCheckIn(state, now) || todaysAttempt(state, now)) return state;
  const date = localDateString(now);
  const at = now.toISOString();
  const attempt: MissionAttempt = outcome === 'struggled' ? { date, at, outcome, problemId: problemId ?? OTHER_PROBLEM } : { date, at, outcome };
  const attempts = [...state.attempts, attempt];
  switch (outcome) {
    case 'completed':
      return { ...state, attempts, passedOn: date };
    case 'struggled':
      return { ...state, attempts, target: 'easier', startedAt: at, skipRun: 0 };
    case 'skipped':
      return { ...state, attempts, startedAt: at, skipRun: state.skipRun + 1 };
  }
}

/** True after three skips in a row while the full target is still active. */
export function offerEasier(state: MissionState): boolean {
  return !state.passedOn && state.target === 'full' && state.skipRun >= SKIPS_BEFORE_OFFER;
}

export function acceptEasier(state: MissionState): MissionState {
  return offerEasier(state) ? { ...state, target: 'easier', skipRun: 0 } : state;
}

const struggles = (state: MissionState) => state.attempts.filter((a) => a.outcome === 'struggled').length;

/** "Move on anyway" is offered from the second struggle on. */
export function canMoveOn(state: MissionState): boolean {
  return !state.passedOn && struggles(state) >= STRUGGLES_BEFORE_MOVE_ON;
}

export function moveOn(state: MissionState, now: Date): MissionState {
  return canMoveOn(state) ? { ...state, passedOn: localDateString(now), keepPractising: true } : state;
}

/** The Fix for a problem of the Mission; "Otra cosa" and an unknown id lead to the general Fix. */
export function fixFor(def: MissionDef, problemId: string | undefined): Fix {
  return def.problems.find((p) => p.id === problemId)?.fix ?? def.generalFix;
}

/** The Fix of the latest struggle; null before any. */
export function latestFix(def: MissionDef, state: MissionState): Fix | null {
  const last = [...state.attempts].reverse().find((a) => a.outcome === 'struggled');
  return last ? fixFor(def, last.problemId) : null;
}

/** The text of the active target: the full target, or the easier one of the latest Fix (the general Fix after skips). */
export function activeTarget(def: MissionDef, state: MissionState): TextKey {
  if (state.target === 'full') return def.target;
  return (latestFix(def, state) ?? def.generalFix).easierTarget;
}

function readAttempts(raw: unknown): MissionAttempt[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((a): MissionAttempt[] => {
    if (!a || typeof a !== 'object') return [];
    const r = a as Partial<Record<keyof MissionAttempt, unknown>>;
    if (!isDateString(r.date) || !isTime(r.at) || !DIARY_OUTCOMES.includes(r.outcome as DiaryOutcome)) return [];
    const attempt: MissionAttempt = { date: r.date, at: r.at, outcome: r.outcome as DiaryOutcome };
    if (typeof r.problemId === 'string') attempt.problemId = r.problemId;
    return [attempt];
  });
}

/** Reads stored Mission state tolerantly: anything unreadable is dropped or defaulted. */
export function readMissions(raw: unknown): Record<string, MissionState> {
  const missions: Record<string, MissionState> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return missions;
  for (const [id, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue;
    const r = value as Partial<Record<keyof MissionState, unknown>>;
    const state: MissionState = {
      target: r.target === 'easier' ? 'easier' : 'full',
      skipRun: typeof r.skipRun === 'number' && Number.isFinite(r.skipRun) ? Math.max(0, Math.floor(r.skipRun)) : 0,
      attempts: readAttempts(r.attempts),
    };
    if (isTime(r.startedAt)) state.startedAt = r.startedAt;
    if (typeof r.focus === 'string') state.focus = r.focus as TextKey;
    if (isDateString(r.passedOn)) state.passedOn = r.passedOn;
    if (r.keepPractising === true) state.keepPractising = true;
    if (isTime(r.skippedAt)) state.skippedAt = r.skippedAt;
    missions[id] = state;
  }
  return missions;
}

export interface SeenFix {
  fixId: string;
  missionId: string;
  /** ISO date-time the Fix was first shown. */
  at: string;
}

export function readSeenFixes(raw: unknown): SeenFix[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((f): f is SeenFix => !!f && typeof f === 'object' && typeof f.fixId === 'string' && typeof f.missionId === 'string' && isTime(f.at));
}
