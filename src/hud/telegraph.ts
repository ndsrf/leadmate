import type { SimState } from '../sim/sim';
import type { AssistLevel } from './markerAssist';

export type TelegraphView = Readonly<
  Pick<
    SimState,
    | 'time'
    | 'dogMode'
    | 'calmElapsed'
    | 'rewardWindow'
    | 'nextCheckInAt'
    | 'dogLookUntil'
    | 'lookStartedAt'
    | 'lookCause'
  >
> & { calmSeconds: number };

export type RingPhase = 'open' | 'closing' | 'landed' | 'good' | 'fading';

export interface TelegraphRing {
  shown: boolean;
  progress: number;
  phase: RingPhase;
  snap: boolean;
}

export type CheckInArcPhase = 'building' | 'landed' | 'fading';

export interface TelegraphCheckInArc {
  shown: boolean;
  progress: number;
  phase: CheckInArcPhase;
}

export interface TelegraphState {
  ring: TelegraphRing | null;
  checkInArc: TelegraphCheckInArc | null;
}

export type Beat = 1 | 2 | 3;

const RING_FADE_SECONDS = 0.15;
const ARC_FADE_SECONDS = 0.15;
const LANDED_DURATION_SECONDS = 0.3;
const TIME_EPSILON = 1e-6;

/**
 * Returns which of the three quarter-beats (1, 2, 3) were crossed
 * between prev and elapsed seconds of calm holding.
 */
export function beatsCrossed(
  prev: number,
  elapsed: number,
  calmSeconds: number
): Beat[] {
  if (elapsed <= prev || calmSeconds <= 0) {
    return [];
  }
  const crossed: Beat[] = [];
  const beats: Beat[] = [1, 2, 3];
  for (const b of beats) {
    const beatTime = (b / 4) * calmSeconds;
    if (prev < beatTime && elapsed >= beatTime) {
      crossed.push(b);
    }
  }
  return crossed;
}

/**
 * Lead time before a Check-in look for the Check-in arc to build.
 */
export function checkInLead(level: AssistLevel): number {
  switch (level) {
    case 'full':
    case 'ring':
      return 0.9;
    case 'late':
      return 0.45;
    case 'off':
    default:
      return 0;
  }
}

export class TelegraphModel {
  private prevView: TelegraphView | null = null;

  // Ring state
  private activeRingFixation = false;
  private landedWindowOpenedAt: number | null = null;
  private fadingRingUntil: number | null = null;
  private fadingRingProgress = 0;

  // Check-in arc state
  private activeCheckInArcBuilding = false;
  private landedCheckInLookStartedAt: number | null = null;
  private fadingCheckInArcUntil: number | null = null;
  private fadingCheckInArcProgress = 0;

  update(view: TelegraphView, level: AssistLevel): TelegraphState {
    const ring = this.updateRing(view, level);
    const checkInArc = this.updateCheckInArc(view, level);
    this.prevView = { ...view };
    return {
      ring,
      checkInArc,
    };
  }

  private updateRing(view: TelegraphView, level: AssistLevel): TelegraphRing | null {
    if (level === 'off') {
      this.activeRingFixation = false;
      this.landedWindowOpenedAt = null;
      this.fadingRingUntil = null;
      return null;
    }

    const prev = this.prevView;

    // 1. Dog is fixated
    if (view.dogMode === 'fixated') {
      this.fadingRingUntil = null;
      this.landedWindowOpenedAt = null;
      let snap = false;

      if (prev && prev.dogMode === 'fixated') {
        if (view.calmElapsed < prev.calmElapsed) {
          snap = true;
        }
      } else {
        // New Fixation starting: not a snap
        this.activeRingFixation = true;
      }

      const progress = Math.min(1, Math.max(0, view.calmElapsed / view.calmSeconds));
      const phase: RingPhase = view.calmElapsed === 0 ? 'open' : 'closing';
      const shown = level === 'late' ? progress >= 0.5 : true;

      this.fadingRingProgress = progress;
      return {
        shown,
        progress,
        phase,
        snap,
      };
    }

    // 2. Dog is NOT fixated, but Reward Window is open
    if (view.rewardWindow !== null) {
      // Check if this window just opened after a ring in this fixation
      const isNewWindow = prev?.rewardWindow === null || this.landedWindowOpenedAt === null;
      if (isNewWindow) {
        const calmReached =
          view.calmElapsed >= view.calmSeconds ||
          (prev !== null && prev.calmElapsed >= view.calmSeconds);

        if (this.activeRingFixation && calmReached) {
          this.landedWindowOpenedAt = view.rewardWindow.openedAt;
          this.activeRingFixation = false;
          this.fadingRingUntil = null;
        } else {
          // Window opened without calm completion (e.g. Leave It cue)
          this.landedWindowOpenedAt = null;
          if (this.activeRingFixation) {
            this.activeRingFixation = false;
            this.fadingRingUntil = view.time + RING_FADE_SECONDS;
          }
        }
      }

      // If landing was achieved for this window
      if (this.landedWindowOpenedAt !== null) {
        const elapsedSinceOpen = view.time - this.landedWindowOpenedAt;
        const phase: RingPhase = elapsedSinceOpen <= LANDED_DURATION_SECONDS ? 'landed' : 'good';
        return {
          shown: true,
          progress: 1,
          phase,
          snap: false,
        };
      }

      // If not landed, check if fading
      if (this.fadingRingUntil !== null && view.time <= this.fadingRingUntil) {
        return {
          shown: true,
          progress: this.fadingRingProgress,
          phase: 'fading',
          snap: false,
        };
      }

      return null;
    }

    // 3. Dog is NOT fixated, NO reward window
    this.landedWindowOpenedAt = null;
    if (this.activeRingFixation) {
      // Fixation ended without a window
      this.activeRingFixation = false;
      this.fadingRingUntil = view.time + RING_FADE_SECONDS;
    }

    if (this.fadingRingUntil !== null && view.time <= this.fadingRingUntil) {
      return {
        shown: true,
        progress: this.fadingRingProgress,
        phase: 'fading',
        snap: false,
      };
    }

    this.fadingRingUntil = null;
    return null;
  }

  private updateCheckInArc(view: TelegraphView, level: AssistLevel): TelegraphCheckInArc | null {
    if (level === 'off') {
      this.activeCheckInArcBuilding = false;
      this.landedCheckInLookStartedAt = null;
      this.fadingCheckInArcUntil = null;
      return null;
    }

    // 1. Check if currently landed
    if (this.landedCheckInLookStartedAt !== null) {
      if (
        view.time - this.landedCheckInLookStartedAt <= LANDED_DURATION_SECONDS &&
        view.lookCause === 'glance' &&
        view.dogLookUntil > view.time
      ) {
        return {
          shown: true,
          progress: 1,
          phase: 'landed',
        };
      }
      this.landedCheckInLookStartedAt = null;
    }

    // 2. Check if a glance look just started on this tick after building
    if (this.activeCheckInArcBuilding) {
      if (view.lookStartedAt === view.time && view.lookCause === 'glance') {
        this.activeCheckInArcBuilding = false;
        this.landedCheckInLookStartedAt = view.lookStartedAt;
        this.fadingCheckInArcUntil = null;
        return {
          shown: true,
          progress: 1,
          phase: 'landed',
        };
      }

      // Check if we should fade because mode left goal or another look started
      const anotherLookStarted = view.lookStartedAt === view.time && view.lookCause !== 'glance';
      const leftGoal = view.dogMode !== 'goal';
      const dogAlreadyLooking = view.dogLookUntil > view.nextCheckInAt;
      if (leftGoal || anotherLookStarted || dogAlreadyLooking) {
        this.activeCheckInArcBuilding = false;
        this.fadingCheckInArcUntil = view.time + ARC_FADE_SECONDS;
      }
    }

    // 3. Check if we should build
    const lead = checkInLead(level);
    const timeUntil = view.nextCheckInAt - view.time;
    if (
      view.dogMode === 'goal' &&
      lead > 0 &&
      timeUntil > 0 &&
      timeUntil <= lead + TIME_EPSILON &&
      view.dogLookUntil <= view.nextCheckInAt
    ) {
      this.activeCheckInArcBuilding = true;
      this.fadingCheckInArcUntil = null;
      const progress = Math.min(1, Math.max(0, (lead - timeUntil) / lead));
      this.fadingCheckInArcProgress = progress;
      return {
        shown: true,
        progress,
        phase: 'building',
      };
    }

    // 4. Check if fading
    if (this.fadingCheckInArcUntil !== null && view.time <= this.fadingCheckInArcUntil) {
      return {
        shown: true,
        progress: this.fadingCheckInArcProgress,
        phase: 'fading',
      };
    }

    this.fadingCheckInArcUntil = null;
    return null;
  }
}
