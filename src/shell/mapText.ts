import type { Translate } from '../i18n';
import { findNode } from './nodes/content';
import type { MapNode, MapWorld } from './mapModel';

/** What pressing a locked Node says: the missing prerequisite Nodes, or that its World is closed. */
export function lockMessage(entry: MapNode, t: Translate): string | null {
  if (entry.state !== 'locked') return null;
  if (entry.lock?.kind === 'nodes' && entry.lock.ids.length > 0) {
    return `${t('map.lockedBy')} ${entry.lock.ids.map((id) => (findNode(id) ? t(findNode(id)!.title) : id)).join(', ')}`;
  }
  return t('world.locked');
}

/** Formats the unlock requirement banner for the first locked World. */
export function worldUnlockBanner(entry: MapWorld, t: Translate): string {
  if (entry.tier === 'plus') {
    return t('world.unlockPlus');
  }
  if (entry.unlockRequirement?.lastNodeTitle) {
    const node = t(entry.unlockRequirement.lastNodeTitle);
    const world = t(entry.unlockRequirement.worldTitle);
    return t('world.unlockRequirement').replace('{node}', node).replace('{world}', world);
  }
  return t('world.unlockGeneric');
}

/** Formats the subtitle showing progress or planned walks in a World. */
export function worldWalkSubtitle(entry: MapWorld, t: Translate): string {
  if (entry.preview) {
    return t('world.previewWalkCount').replace('{count}', String(entry.total));
  }
  return t('world.walkCount').replace('{done}', String(entry.done)).replace('{total}', String(entry.total));
}
