import type { FeedbackKind, FeedbackMessage, FeedbackTier } from './feedback';
import type { FeedbackPolarity } from '../sim/feedbackKinds';
import type { Point } from './layout';

export const MAX_EFFECT_PARTICLES = 40;
export const METER_POINTS_FLY_SECONDS = 0.5;

/**
 * Replaces `{name}` in catalog text with the Dog's name, or the neutral "your Dog" text when it has none.
 */
export function withDogName(text: string, name: string, neutral: string): string {
  if (name !== '') return text.split('{name}').join(name);
  const upper = neutral.charAt(0).toUpperCase() + neutral.slice(1);
  return text
    .replace(/(^|[.!?:]\s+)([¿¡«]?)\{name\}/g, (_m, before: string, mark: string) => `${before}${mark}${upper}`)
    .split('{name}')
    .join(neutral);
}

/** Map an action kind and polarity to its HUD atlas frame icon. */
export function iconForKind(kind: FeedbackKind, polarity: FeedbackPolarity): string {
  if (polarity === 'wrong') return 'icon_puff';
  switch (kind) {
    case 'marker-hit':
      return 'icon_mark';
    case 'check-in-hit':
      return 'icon_eye';
    case 'followed-turn':
      return 'icon_paw';
    case 'disengagement':
      return 'icon_star';
    case 'poste':
      return 'icon_hourglass';
    case 'sintonia':
      return 'icon_sparkle';
    case 'go-sniff':
      return 'icon_nose';
    default:
      return 'icon_sparkle';
  }
}

/**
 * Maps content meter icon name and meter id to the HUD texture atlas frame.
 * Content nodes declare icon names like "nose" and "eye"; the HUD atlas contains
 * frames "meter_nose", "meter_connection", "icon_nose", "icon_eye".
 */
export function meterBadgeFrame(icon?: string, id?: string): string {
  if (icon === 'meter_nose' || icon === 'meter_connection' || icon === 'icon_nose' || icon === 'icon_eye') {
    return icon;
  }
  if (icon === 'nose' || id === 'nose') {
    return 'meter_nose';
  }
  if (icon === 'eye' || icon === 'connection' || id === 'connection') {
    return 'meter_connection';
  }
  return id === 'connection' ? 'meter_connection' : 'meter_nose';
}

/** Horizontal wobble offset in pixels for wrong tier (with decaying oscillation). */
export function wobbleOffset(elapsed: number, duration: number): number {
  if (elapsed < 0 || elapsed >= duration) return 0;
  const progress = elapsed / duration;
  const decay = 1 - progress;
  const frequency = 24; // fast oscillations
  const maxAmplitude = 10;
  return Math.sin(progress * frequency) * maxAmplitude * decay;
}

/** Vertical bounce offset in pixels for medium tier (upward arc settling down). */
export function bounceOffset(elapsed: number, duration: number): number {
  if (elapsed < 0 || elapsed >= duration) return 0;
  const progress = elapsed / duration;
  if (progress > 0.6) return 0; // settled
  const bouncePhase = progress / 0.6;
  return -Math.sin(bouncePhase * Math.PI) * 16;
}

/** Alpha fade for reduced motion or general element fade. */
export function alphaFade(elapsed: number, duration: number): number {
  if (elapsed < 0 || elapsed >= duration) return 0;
  const fadeDuration = 0.1;
  if (elapsed < fadeDuration) {
    return elapsed / fadeDuration;
  }
  if (elapsed > duration - fadeDuration) {
    return Math.max(0, (duration - elapsed) / fadeDuration);
  }
  return 1;
}

export interface ParticleState {
  frame: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
}

/** Precomputes particle burst velocities and shapes within the 40-particle limit. */
export function particleBurst(tier: FeedbackTier, originX: number, originY: number): ParticleState[] {
  let count = 0;
  let frame = 'burst_spark';
  let speedMin = 40;
  let speedMax = 120;

  if (tier === 'small') {
    count = 12;
    frame = 'burst_spark';
    speedMin = 40;
    speedMax = 90;
  } else if (tier === 'medium') {
    count = 24;
    frame = 'burst_star';
    speedMin = 60;
    speedMax = 160;
  } else if (tier === 'wrong') {
    count = 10;
    frame = 'icon_puff';
    speedMin = 20;
    speedMax = 60;
  } else if (tier === 'big') {
    count = 32;
    frame = 'burst_star';
    speedMin = 80;
    speedMax = 200;
  }

  const countClamped = Math.min(MAX_EFFECT_PARTICLES, count);
  const particles: ParticleState[] = [];

  for (let i = 0; i < countClamped; i++) {
    const angle = (i / countClamped) * Math.PI * 2 + (i % 2) * 0.2;
    const speed = speedMin + ((i * 37) % (speedMax - speedMin));
    particles.push({
      frame,
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      scale: tier === 'small' ? 0.8 : tier === 'medium' ? 0.7 : 0.6,
      alpha: 1,
    });
  }

  return particles;
}

export interface FlyingPointEvent {
  meterId: string;
  points: number;
  kind: FeedbackKind;
  value: number;
  full: boolean;
  from: Point;
  to: Point;
}

export interface ActiveFlyingPoint {
  meterId: string;
  points: number;
  kind: FeedbackKind;
  icon: string;
  pos: Point;
  alpha: number;
}

export interface EffectsTracker {
  triggerFeedback(message: FeedbackMessage, time: number): void;
  triggerMeterPoints(event: FlyingPointEvent, time: number): void;
  isActive(time: number): boolean;
  getFlyingPoints(time: number): ActiveFlyingPoint[];
  getActiveFeedback(time: number): {
    message: FeedbackMessage;
    elapsed: number;
    duration: number;
    alpha: number;
    wobbleX: number;
    bounceY: number;
  } | null;
  getParticles(time: number): { x: number; y: number; frame: string; alpha: number; scale: number }[];
  clear(): void;
}

export function createEffectsTracker(reducedMotion = false): EffectsTracker {
  let currentMsg: { message: FeedbackMessage; start: number; duration: number } | null = null;
  let activeParticles: { particles: ParticleState[]; start: number; duration: number } | null = null;
  const flying: { event: FlyingPointEvent; start: number; duration: number }[] = [];

  const tierDurations: Record<FeedbackTier, number> = {
    small: 0.6,
    medium: 0.8,
    big: 1.2,
    wrong: 0.6,
  };

  return {
    triggerFeedback(message, time) {
      const duration = message.kind === 'leash-hint' ? 4.0 : tierDurations[message.tier];
      currentMsg = { message, start: time, duration };

      if (!reducedMotion) {
        const particles = particleBurst(message.tier, 0, 0);
        activeParticles = { particles, start: time, duration: Math.min(duration, 0.8) };
      }
    },

    triggerMeterPoints(event, time) {
      flying.push({ event, start: time, duration: METER_POINTS_FLY_SECONDS });
    },

    isActive(time) {
      if (currentMsg && time < currentMsg.start + currentMsg.duration) return true;
      if (activeParticles && time < activeParticles.start + activeParticles.duration) return true;
      if (flying.some((f) => time < f.start + f.duration)) return true;
      return false;
    },

    getFlyingPoints(time) {
      const active: ActiveFlyingPoint[] = [];
      for (let i = flying.length - 1; i >= 0; i--) {
        const f = flying[i];
        const elapsed = time - f.start;
        if (elapsed < 0) continue;
        if (elapsed >= f.duration) {
          flying.splice(i, 1);
          continue;
        }
        const t = elapsed / f.duration;
        // Quadratic arc path
        const arcY = -40 * Math.sin(t * Math.PI);
        const x = (1 - t) * f.event.from.x + t * f.event.to.x;
        const y = (1 - t) * f.event.from.y + t * f.event.to.y + arcY;
        const alpha = t > 0.8 ? (1 - t) / 0.2 : 1;
        active.push({
          meterId: f.event.meterId,
          points: f.event.points,
          kind: f.event.kind,
          icon: iconForKind(f.event.kind, 'right'),
          pos: { x, y },
          alpha,
        });
      }
      return active;
    },

    getActiveFeedback(time) {
      if (!currentMsg) return null;
      const elapsed = time - currentMsg.start;
      if (elapsed < 0 || elapsed >= currentMsg.duration) {
        currentMsg = null;
        return null;
      }
      const alpha = alphaFade(elapsed, currentMsg.duration);
      const wobbleX = reducedMotion || currentMsg.message.tier !== 'wrong' ? 0 : wobbleOffset(elapsed, currentMsg.duration);
      const bounceY = reducedMotion || currentMsg.message.tier !== 'medium' ? 0 : bounceOffset(elapsed, currentMsg.duration);

      return {
        message: currentMsg.message,
        elapsed,
        duration: currentMsg.duration,
        alpha,
        wobbleX,
        bounceY,
      };
    },

    getParticles(time) {
      if (reducedMotion || !activeParticles) return [];
      const elapsed = time - activeParticles.start;
      if (elapsed < 0 || elapsed >= activeParticles.duration) {
        activeParticles = null;
        return [];
      }
      const t = elapsed;
      const progress = elapsed / activeParticles.duration;
      const alpha = 1 - progress;

      return activeParticles.particles.map((p) => ({
        x: p.x + p.vx * t,
        y: p.y + p.vy * t + 30 * t * t, // slight gravity
        frame: p.frame,
        alpha,
        scale: p.scale * (1 - progress * 0.4),
      }));
    },

    clear() {
      currentMsg = null;
      activeParticles = null;
      flying.length = 0;
    },
  };
}
