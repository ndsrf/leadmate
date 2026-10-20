import type { Translate } from '../i18n';
import { findNode } from './nodes/content';
import type { MapNode } from './mapModel';

/** What pressing a locked Node says: the missing prerequisite Nodes, or that its World is closed. */
export function lockMessage(entry: MapNode, t: Translate): string | null {
  if (entry.state !== 'locked') return null;
  if (entry.lock?.kind === 'nodes' && entry.lock.ids.length > 0) {
    return `${t('map.lockedBy')} ${entry.lock.ids.map((id) => (findNode(id) ? t(findNode(id)!.title) : id)).join(', ')}`;
  }
  return t('world.locked');
}
