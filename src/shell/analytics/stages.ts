export type StageKind = 'taste' | 'first' | 'node' | 'daily' | 'warmup';
export type StageMode = 'stage' | 'close_exercise';
export type StageOutcome = 'finished' | 'skipped' | 'left';
export type MinigameOutcome = 'finished' | 'left';

export interface StartStageInfo {
  type: 'stage';
  stage_kind: StageKind;
  stage_id: string;
  mode: StageMode;
  attempt: number;
  encounter_id?: string;
  encounter_attempt?: number;
}

export interface StartMinigameInfo {
  type: 'minigame';
  node_id: string;
  attempt: number;
}

export type StartPlayInfo = StartStageInfo | StartMinigameInfo;

export interface TrackedPlayEvent {
  name: 'stage_started' | 'stage_ended' | 'minigame_started' | 'minigame_ended';
  props: Record<string, unknown>;
}

export interface StartPlayResult extends TrackedPlayEvent {
  ended?: TrackedPlayEvent | null;
}

function toEpochMs(d: Date | number | string): number {
  if (d instanceof Date) return d.getTime();
  if (typeof d === 'number') return d;
  const parsed = Date.parse(d);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

/**
 * PlayTracker pairs stage/minigame start and end events.
 * It calculates duration_seconds as foreground unpaused wall time from start.
 * It is idempotent: a second end() or an end() with nothing open returns null.
 * A new start while one is open first ends the previous play as 'left'.
 */
export class PlayTracker {
  private current: StartPlayInfo | null = null;
  private startTime = 0;
  private pausedTimeTotal = 0;
  private lastPausedAt: number | null = null;
  private pauseDepth = 0;

  public get isOpen(): boolean {
    return this.current !== null;
  }

  public get currentInfo(): StartPlayInfo | null {
    return this.current;
  }

  public start(info: StartPlayInfo, now: Date | number | string = Date.now()): StartPlayResult {
    let ended: TrackedPlayEvent | null = null;
    if (this.isOpen) {
      ended = this.end('left', now);
    }

    const nowMs = toEpochMs(now);
    this.current = { ...info };
    this.startTime = nowMs;
    this.pausedTimeTotal = 0;
    this.lastPausedAt = null;
    this.pauseDepth = 0;

    if (info.type === 'stage') {
      return {
        name: 'stage_started',
        props: {
          stage_kind: info.stage_kind,
          stage_id: info.stage_id,
          mode: info.mode,
          attempt: info.attempt,
          ...(info.encounter_id !== undefined ? { encounter_id: info.encounter_id } : {}),
          ...(info.encounter_attempt !== undefined ? { encounter_attempt: info.encounter_attempt } : {}),
        },
        ...(ended ? { ended } : {}),
      };
    }

    return {
      name: 'minigame_started',
      props: {
        node_id: info.node_id,
        attempt: info.attempt,
      },
      ...(ended ? { ended } : {}),
    };
  }

  public pause(now: Date | number | string = Date.now()): void {
    if (!this.isOpen) return;
    const nowMs = toEpochMs(now);
    if (this.pauseDepth === 0) {
      this.lastPausedAt = nowMs;
    }
    this.pauseDepth++;
  }

  public resume(now: Date | number | string = Date.now()): void {
    if (!this.isOpen || this.pauseDepth === 0) return;
    const nowMs = toEpochMs(now);
    this.pauseDepth--;
    if (this.pauseDepth === 0) {
      if (this.lastPausedAt !== null) {
        this.pausedTimeTotal += Math.max(0, nowMs - this.lastPausedAt);
        this.lastPausedAt = null;
      }
    }
  }

  public end(
    outcome: 'finished' | 'skipped' | 'left',
    now: Date | number | string = Date.now(),
    score?: number,
    paws?: number
  ): TrackedPlayEvent | null {
    if (!this.isOpen || !this.current) {
      return null;
    }

    const nowMs = toEpochMs(now);
    if (this.pauseDepth > 0 && this.lastPausedAt !== null) {
      this.pausedTimeTotal += Math.max(0, nowMs - this.lastPausedAt);
      this.lastPausedAt = null;
    }

    const activeMs = Math.max(0, (nowMs - this.startTime) - this.pausedTimeTotal);
    const durationSeconds = Math.max(0, Math.floor(activeMs / 1000));
    const info = this.current;
    this.current = null;
    this.pauseDepth = 0;

    const hasScore =
      outcome === 'finished' &&
      score !== undefined &&
      score !== null &&
      !Number.isNaN(score);

    const hasPaws =
      outcome === 'finished' &&
      paws !== undefined &&
      paws !== null &&
      !Number.isNaN(paws);

    if (info.type === 'stage') {
      const stageOutcome: StageOutcome =
        outcome === 'skipped' ? 'skipped' : outcome === 'finished' ? 'finished' : 'left';

      return {
        name: 'stage_ended',
        props: {
          stage_kind: info.stage_kind,
          stage_id: info.stage_id,
          mode: info.mode,
          attempt: info.attempt,
          outcome: stageOutcome,
          duration_seconds: durationSeconds,
          ...(hasScore ? { handling_score: Math.round(score) } : {}),
          ...(info.encounter_id !== undefined ? { encounter_id: info.encounter_id } : {}),
          ...(info.encounter_attempt !== undefined ? { encounter_attempt: info.encounter_attempt } : {}),
          ...(hasPaws ? { paws: Math.round(paws) } : {}),
        },
      };
    }

    const minigameOutcome: MinigameOutcome =
      outcome === 'finished' ? 'finished' : 'left';

    return {
      name: 'minigame_ended',
      props: {
        node_id: info.node_id,
        attempt: info.attempt,
        outcome: minigameOutcome,
        duration_seconds: durationSeconds,
        ...(hasScore ? { handling_score: Math.round(score) } : {}),
      },
    };
  }
}
