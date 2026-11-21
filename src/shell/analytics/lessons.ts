export type LessonSource = 'trail' | 'library' | 'video_unlock';
export type LessonClosedBy = 'done' | 'back';

export interface LessonTimerOptions {
  lessonId: string;
  source: LessonSource;
  startTime?: Date | number | string;
}

export interface LessonDoneEventProps {
  [key: string]: unknown;
  lesson_id: string;
  closed_by: LessonClosedBy;
  seconds_on_screen: number;
  scrolled_percent: number;
}

function toEpochMs(d: Date | number | string): number {
  if (d instanceof Date) return d.getTime();
  if (typeof d === 'number') return d;
  const parsed = Date.parse(d);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

/**
 * LessonTimer tracks foreground time and furthest scroll progress in a Lesson.
 * It is closed once only (idempotent).
 */
export class LessonTimer {
  public readonly lessonId: string;
  public readonly source: LessonSource;
  private readonly startTime: number;
  private pausedTimeTotal = 0;
  private lastPausedAt: number | null = null;
  private pauseDepth = 0;
  private furthest = 0;
  private open = true;

  constructor(options: LessonTimerOptions) {
    this.lessonId = options.lessonId;
    this.source = options.source;
    this.startTime = toEpochMs(options.startTime ?? Date.now());
  }

  public get isOpen(): boolean {
    return this.open;
  }

  public get furthestPercent(): number {
    return this.furthest;
  }

  public updateProgress(percent: number): void {
    if (!this.open) return;
    if (Number.isNaN(percent)) return;
    const clamped = Math.min(100, Math.max(0, Math.round(percent)));
    if (clamped > this.furthest) {
      this.furthest = clamped;
    }
  }

  public pause(now: Date | number | string = Date.now()): void {
    if (!this.open) return;
    const nowMs = toEpochMs(now);
    if (this.pauseDepth === 0) {
      this.lastPausedAt = nowMs;
    }
    this.pauseDepth++;
  }

  public resume(now: Date | number | string = Date.now()): void {
    if (!this.open || this.pauseDepth === 0) return;
    const nowMs = toEpochMs(now);
    this.pauseDepth--;
    if (this.pauseDepth === 0) {
      if (this.lastPausedAt !== null) {
        this.pausedTimeTotal += Math.max(0, nowMs - this.lastPausedAt);
        this.lastPausedAt = null;
      }
    }
  }

  public close(
    closedBy: LessonClosedBy,
    now: Date | number | string = Date.now()
  ): LessonDoneEventProps | null {
    if (!this.open) return null;

    const nowMs = toEpochMs(now);
    if (this.pauseDepth > 0 && this.lastPausedAt !== null) {
      this.pausedTimeTotal += Math.max(0, nowMs - this.lastPausedAt);
      this.lastPausedAt = null;
    }

    const activeMs = Math.max(0, (nowMs - this.startTime) - this.pausedTimeTotal);
    const secondsOnScreen = Math.max(0, Math.floor(activeMs / 1000));
    const result: LessonDoneEventProps = {
      lesson_id: this.lessonId,
      closed_by: closedBy,
      seconds_on_screen: secondsOnScreen,
      scrolled_percent: this.furthest,
    };

    this.open = false;
    this.pauseDepth = 0;
    return result;
  }
}
