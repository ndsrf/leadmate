import type { TextKey, Translate } from '../i18n';
import { findLesson } from './lessons/content';
import { findMission } from './missions/content';
import { findNode } from './nodes/content';
import type { MapStop, MapWorld } from './mapModel';
import type { Stop } from './world';

export function stopTitle(stop: Stop): TextKey | undefined {
  switch (stop.kind) {
    case 'node':
      return findNode(stop.id)?.title;
    case 'lesson':
      return findLesson(stop.id)?.title;
    case 'mission':
      return findMission(stop.id)?.title;
  }
}

const titleOf = (stop: Stop, t: Translate) => {
  const key = stopTitle(stop);
  return key ? t(key) : stop.id;
};

/** What pressing a locked Stop says: the Mission to pass first, the missing Stops of its Stretch, or that its World is closed. */
export function lockMessage(entry: MapStop, t: Translate): string | null {
  if (entry.state !== 'locked') return null;
  const lock = entry.lock;
  if (lock?.kind === 'mission') return t('map.lockedByMission').replace('{mission}', titleOf({ kind: 'mission', id: lock.id }, t));
  if (lock?.kind === 'stops' && lock.stops.length > 0) return `${t('map.lockedBy')} ${lock.stops.map((s) => titleOf(s, t)).join(', ')}`;
  if (lock?.kind === 'nodes' && lock.ids.length > 0) return `${t('map.lockedBy')} ${lock.ids.map((id) => titleOf({ kind: 'node', id }, t)).join(', ')}`;
  return t('world.locked');
}

/** "HH:MM" in local time. */
export function clockTime(at: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** When a waiting Mission's check-in opens: "Mañana" at the next midnight, "A las 07:50" when the 8 hours end later. */
export function waitingLabel(entry: Pick<MapStop, 'opensAt' | 'opensTomorrow'>, t: Translate): string {
  if (entry.opensTomorrow || !entry.opensAt) return t('map.opensTomorrow');
  return t('map.opensAt').replace('{time}', clockTime(entry.opensAt));
}

/** The badge under a Stop: "Siguiente", "¿Cómo fue?" on a due check-in, or when a waiting Mission opens. */
export function stopBadge(entry: MapStop, t: Translate): string | null {
  if (entry.state === 'waiting') return waitingLabel(entry, t);
  if (entry.state === 'next') return t(entry.checkInDue ? 'map.checkInDue' : 'map.badgeNext');
  return null;
}

/** The marks beside a Stop's title, as text so they never rely on an icon alone. */
export function stopMarks(entry: MapStop, t: Translate): string[] {
  const marks: string[] = [];
  if (entry.optional) marks.push(t('map.optional'));
  if (entry.keepPractising) marks.push(t('map.keepPractising'));
  return marks;
}

/** The screen-reader label of a Stop: its kind, its title and its state, so kind is never shown by icon alone. */
export function stopAccessibilityLabel(entry: MapStop, t: Translate): string {
  const state =
    entry.state === 'done' ? t('map.nodeDone')
    : entry.state === 'next' ? t(entry.checkInDue ? 'map.checkInDue' : 'map.nodeNext')
    : entry.state === 'locked' ? t('map.nodeLocked')
    : entry.state === 'waiting' ? `${t('map.waiting')}: ${waitingLabel(entry, t)}`
    : '';
  const parts = [t(`map.stop.${entry.kind}`), t(entry.title), state, ...stopMarks(entry, t)].filter((p) => p !== '');
  return `${parts.join('. ')}.`;
}

/** Formats the unlock requirement banner for the first locked World. */
export function worldUnlockBanner(entry: MapWorld, t: Translate): string {
  if (entry.tier === 'plus') {
    return t('world.unlockPlus');
  }
  if (entry.unlockRequirement?.lastStopTitle) {
    const stop = t(entry.unlockRequirement.lastStopTitle);
    const world = t(entry.unlockRequirement.worldTitle);
    return t('world.unlockRequirement').replace('{node}', stop).replace('{world}', world);
  }
  return t('world.unlockGeneric');
}

/** Formats the subtitle showing progress, or the planned Stops of a preview World. */
export function worldWalkSubtitle(entry: MapWorld, t: Translate): string {
  if (entry.preview) {
    return t('map.previewStopCount').replace('{count}', String(entry.total));
  }
  return t('map.stopCount').replace('{done}', String(entry.done)).replace('{total}', String(entry.total));
}
