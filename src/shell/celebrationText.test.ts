import { createTranslator } from '../i18n';
import { celebrationSound, celebrationText } from './celebrationText';
import type { Celebration } from './celebrations';

const t = createTranslator();
const all: Celebration[] = [
  { type: 'first-completion', nodeId: 'poste-practice' },
  { type: 'new-best-stars', nodeId: 'poste-practice', stars: 3 },
  { type: 'unlock-world', worldId: 'sidewalk' },
  { type: 'unlock-node', nodeId: 'doorbell-mat' },
  { type: 'streak-day', days: 4 },
  { type: 'daily-new-best', score: 800 },
];

describe('celebrationText', () => {
  it('says something for every kind, never an empty string', () => {
    for (const c of all) expect(celebrationText(c, t).length).toBeGreaterThan(3);
  });

  it('names the World and the Node that unlocked', () => {
    expect(celebrationText(all[2], t)).toContain(t('world.2.title'));
    expect(celebrationText(all[3], t)).toContain('timbre');
  });

  it('shows the new Streak count', () => {
    expect(celebrationText(all[4], t)).toContain('4');
  });

  it('plays the unlock sound for unlocks and success for the rest', () => {
    expect(all.map(celebrationSound)).toEqual(['success', 'success', 'unlock', 'unlock', 'success', 'success']);
  });
});
