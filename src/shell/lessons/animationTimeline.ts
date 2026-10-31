/**
 * The Animation Timeline of a Lesson Animation: a small JSON file hosted next to the clip
 * (`animations/<key>.json`, see `animationTimelineUrl`) that records when each beat of the clip happens and its
 * Lines, the short words the Person says. The app shows the active Line as a subtitle; its text always comes from the
 * catalog (`<prefix>.animation.line.<id>`), never from the file. A Line's `voice` marks it as the Handler's Cue or
 * the spoken Marker word, the hook for playing the user's own recording later.
 */

export type TimelineBeat = { id: string; start: number; end: number };
export type TimelineLine = TimelineBeat & { voice?: 'cue' | 'marker' };
export type AnimationTimeline = { version: 1; duration: number; beats: TimelineBeat[]; lines: TimelineLine[] };

/** The largest timeline file accepted, in bytes. */
export const TIMELINE_MAX_BYTES = 16 * 1024;
/** The longest clip a timeline may describe, in seconds. */
export const TIMELINE_MAX_DURATION = 15;

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function span(v: unknown, duration: number): TimelineBeat | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !ID.test(v.id)) return null;
  const { start, end } = v;
  if (typeof start !== 'number' || typeof end !== 'number' || !Number.isFinite(start) || !Number.isFinite(end)) return null;
  return start >= 0 && start < end && end <= duration ? { id: v.id, start, end } : null;
}

/** Whether ranges are in time order and do not overlap (touching ends are fine). */
function ordered(ranges: TimelineBeat[]): boolean {
  return ranges.every((r, i) => i === 0 || ranges[i - 1].end <= r.start);
}

/**
 * Reads an Animation Timeline, or null when the file is over 16 KB, not version 1, or has a time that is not finite
 * or breaks 0 ≤ start < end ≤ duration ≤ 15, beats or Lines out of order or overlapping, an id outside the key
 * pattern, or a `voice` other than `cue` / `marker`. A Line for which `hasText(id)` is false (no catalog text) is
 * dropped; the rest of the timeline still holds.
 */
export function parseAnimationTimeline(json: string, hasText: (lineId: string) => boolean = () => true): AnimationTimeline | null {
  if (json.length > TIMELINE_MAX_BYTES || new TextEncoder().encode(json).length > TIMELINE_MAX_BYTES) return null;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== 1) return null;
  const { duration } = data;
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0 || duration > TIMELINE_MAX_DURATION) return null;
  if (!Array.isArray(data.beats) || !(data.lines === undefined || Array.isArray(data.lines))) return null;
  const beats = data.beats.map((b) => span(b, duration));
  const rawLines: unknown[] = data.lines ?? [];
  const lines: (TimelineLine | null)[] = rawLines.map((l) => {
    const s = span(l, duration);
    if (s === null || !isRecord(l)) return null;
    if (l.voice === undefined) return s;
    return l.voice === 'cue' || l.voice === 'marker' ? { ...s, voice: l.voice } : null;
  });
  if (beats.some((b) => b === null) || lines.some((l) => l === null)) return null;
  const okBeats = beats as TimelineBeat[];
  const okLines = lines as TimelineLine[];
  if (!ordered(okBeats) || !ordered(okLines)) return null;
  return { version: 1, duration, beats: okBeats, lines: okLines.filter((l) => hasText(l.id)) };
}

/** The Line shown at playback time `t` (start included, end excluded), or null. `t` restarts on every loop, so do the Lines. */
export function activeLine(timeline: AnimationTimeline | null, t: number): TimelineLine | null {
  return timeline?.lines.find((l) => l.start <= t && t < l.end) ?? null;
}

/** The catalog key of a Line's text, from the animation block's caption key: `<prefix>.animation.caption` → `<prefix>.animation.line.<id>`. */
export function lineTextKey(captionKey: string, lineId: string): string {
  return captionKey.replace(/\.caption$/, `.line.${lineId}`);
}
