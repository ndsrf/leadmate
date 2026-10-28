import type { Translate } from '../i18n';
import type { Celebration } from './celebrations';
import { findNode } from './nodes/content';
import { findWorld } from './world';

/** The short line a celebration shows. Rewards name what was done well, never what was lost. */
export function celebrationText(c: Celebration, t: Translate): string {
  switch (c.type) {
    case 'first-completion':
      return t('celebrate.firstCompletion');
    case 'mission-passed':
      return t('celebrate.missionPassed');
    case 'new-best-stars':
      return t('reveal.newBest');
    case 'unlock-world': {
      const world = findWorld(c.worldId);
      return `${t('celebrate.unlockWorld')}: ${world ? t(world.title) : c.worldId}`;
    }
    case 'unlock-node': {
      const node = findNode(c.nodeId);
      return `${t('celebrate.unlockNode')}: ${node ? t(node.title) : c.nodeId}`;
    }
    case 'streak-day':
      return `${c.days} ${t(c.days === 1 ? 'streak.day' : 'streak.days')}`;
    case 'daily-new-best':
      return t('daily.result.newBest');
  }
}

/** Which sound a celebration plays. */
export function celebrationSound(c: Celebration): 'unlock' | 'success' {
  return c.type === 'unlock-world' || c.type === 'unlock-node' ? 'unlock' : 'success';
}
