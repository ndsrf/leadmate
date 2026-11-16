import type { FeedbackActionKind, FeedbackPolarity } from './feedbackKinds';
import { scentSpotsOf, scentWalkOf, type ScenarioConfig, type ScentStrength, type ScentWalkConfig } from './config';
import { dot, type Vec2 } from './vec';

/** The kinds of change a Handler makes in an Unpredictable Walk (`walk-novelty`). */
export type ChangeKind = 'left-turn' | 'right-turn' | 'u-turn' | 'speed-up' | 'slow-down' | 'stop';
export const CHANGE_KINDS: readonly ChangeKind[] = ['left-turn', 'right-turn', 'u-turn', 'speed-up', 'slow-down', 'stop'];

/** How a change stood against its Novelty when it was made. */
export type Freshness = 'fresh' | 'normal' | 'repeated';

/** A Scent Spot during a Stage. */
export interface ScentSpotState {
  pos: Vec2;
  strength: ScentStrength;
  radius: number;
  marking: boolean;
  /** Sniffed (by a Go Sniff, a Plant or a marking): it no longer pulls. */
  sniffed: boolean;
  /** A pull toward it already ended in Rigid Pull (reported once). */
  draggedPast: boolean;
}

/** Scent-walk counts the payload's `scentWalk` is built from (`simulation-telemetry`). */
export interface ScentWalkCounts {
  sniffsGranted: number;
  sniffsEmpty: number;
  scentsDraggedPast: number;
  plantsWaited: number;
  plantsDragged: number;
  markingsWaited: number;
  markingsInterrupted: number;
  foodEaten: number;
  foodLeft: number;
  freshMoves: number;
  repeatedMoves: number;
  /** Repeated changes the Dog did not follow (what `repeated-move-ignored` is about). */
  repeatedMovesIgnored?: number;
  chains: number;
}

export const emptyScentWalkCounts = (): ScentWalkCounts => ({
  sniffsGranted: 0,
  sniffsEmpty: 0,
  scentsDraggedPast: 0,
  plantsWaited: 0,
  plantsDragged: 0,
  markingsWaited: 0,
  markingsInterrupted: 0,
  foodEaten: 0,
  foodLeft: 0,
  freshMoves: 0,
  repeatedMoves: 0,
  repeatedMovesIgnored: 0,
  chains: 0,
});

/** Everything the simulation keeps for a scent Stage; absent (null) in every other Stage. */
export interface ScentWalkState {
  cfg: ScentWalkConfig;
  spots: ScentSpotState[];
  /** 0 to 1. */
  autopilot: number;
  novelty: Record<ChangeKind, number>;
  /** Input strengths of the last `pace.smoothingSeconds`, their mean, and where it last settled (null while it has not since a stop). */
  pace: { samples: { time: number; strength: number }[]; smooth: number; anchor: number | null };
  /** Heading that steady walking is measured from; null while standing. */
  steadyHeading: Vec2 | null;
  /** Since when the walking has been straight and even. */
  steadySince: number;
  /** The Dog stays at a spot: a Plant or a marking, until `until`. */
  stay: { kind: 'plant' | 'marking'; spot: number; until: number } | null;
  /** The last change the Dog followed, waiting for a Marker press on its look. */
  followed: { change: ChangeKind; lookStartedAt: number } | null;
  /** A followed change marked on its look, waiting for Slack walking or a Go Sniff to complete a Chain. */
  chain: { change: ChangeKind; markedAt: number; walkedFor: number } | null;
}

/** Whether a scenario is a scent Stage: it declares at least one Scent Spot (directly or on scenery). */
export function isScentScenario(config: Pick<ScenarioConfig, 'scents' | 'scenery'>): boolean {
  return (config.scents?.length ?? 0) > 0 || (config.scenery ?? []).some((item) => item.scent);
}

export function createScentWalk(config: ScenarioConfig): ScentWalkState | null {
  if (!isScentScenario(config)) return null;
  const cfg = scentWalkOf(config);
  return {
    cfg,
    spots: scentSpotsOf(config).map((s) => ({
      pos: { ...s.pos },
      strength: s.strength,
      radius: s.radius ?? cfg.radius[s.strength],
      marking: s.marking === true,
      sniffed: false,
      draggedPast: false,
    })),
    autopilot: 0,
    novelty: { 'left-turn': 1, 'right-turn': 1, 'u-turn': 1, 'speed-up': 1, 'slow-down': 1, stop: 1 },
    pace: { samples: [], smooth: 0, anchor: null },
    steadyHeading: null,
    steadySince: 0,
    stay: null,
    followed: null,
    chain: null,
  };
}

/** The kind of a turn from heading `from` to heading `to` (y up: counter-clockwise is left). */
export function turnKind(from: Vec2, to: Vec2, uTurnAngle: number): ChangeKind {
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(from, to))));
  if (angle > uTurnAngle) return 'u-turn';
  return from.x * to.y - from.y * to.x > 0 ? 'left-turn' : 'right-turn';
}

export function freshnessOf(novelty: number, cfg: ScentWalkConfig): Freshness {
  if (novelty >= cfg.novelty.fresh) return 'fresh';
  if (novelty < cfg.novelty.repeated) return 'repeated';
  return 'normal';
}

/**
 * The Dog's chance to follow a change in a scent Stage: the base chance scaled by Novelty, plus the
 * fresh bonus, capped, then lowered by Autopilot (design Decisions 3 and 5).
 */
export function scentFollowChance(base: number, novelty: number, autopilot: number, cap: number, cfg: ScentWalkConfig): number {
  const fresh = novelty >= cfg.novelty.fresh ? cfg.novelty.freshBonus : 0;
  const scaled = Math.min(cap, base * (0.5 + 0.5 * novelty) + fresh);
  return scaled * (1 - cfg.autopilot.followDamping * autopilot);
}

/** One Feedback-worthy moment of a scent Stage, for the Node Debrief timeline (design Decision 12). */
export interface TimelineEntry {
  /** Seconds into the Stage. */
  t: number;
  kind: FeedbackActionKind;
  polarity: FeedbackPolarity;
}

/** The timeline keeps at most this many moments. */
export const TIMELINE_CAP = 60;

/** Appends a moment; when full the oldest right moment is dropped first (the oldest wrong one if there is none). */
export function appendTimeline(timeline: TimelineEntry[], entry: TimelineEntry): void {
  if (timeline.length >= TIMELINE_CAP) {
    const right = timeline.findIndex((e) => e.polarity === 'right');
    timeline.splice(right === -1 ? 0 : right, 1);
  }
  timeline.push(entry);
}
