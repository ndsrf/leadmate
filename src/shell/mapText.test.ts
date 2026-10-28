import { createTranslator } from '../i18n';
import { lockMessage, stopAccessibilityLabel, stopBadge, stopMarks, waitingLabel, worldUnlockBanner, worldWalkSubtitle } from './mapText';
import { mapModel, type MapModel } from './mapModel';
import { migrateRecord } from './dogRecord';
import type { MissionState } from './missions/mission';
import { nodeVisual } from './ui/mapLayout';
import { progressOf } from './world';

const t = createTranslator();
const at = (h: number, day = 2, m = 0) => new Date(2026, 4, day, h, m);
const find = (m: MapModel, id: string) => m.worlds.flatMap((w) => w.stops).find((s) => s.stop.id === id)!;
const started = (d: Date): MissionState => ({ target: 'full', skipRun: 0, attempts: [], startedAt: d.toISOString() });
const stretch1 = progressOf(['harness-ritual'], { readLessons: ['theory-harness', 'howto-tap-hold'] });

describe('lock reason', () => {
  it('names the missing Stops of the Stretch', () => {
    const msg = lockMessage(find(mapModel(progressOf([]), {}, at(9)), 'harness-ritual'), t)!;
    expect(msg).toContain(t('map.lockedBy'));
    expect(msg).toContain(t('trail.theory-harness.title'));
    expect(msg).toContain(t('trail.howto-tap-hold.title'));
  });

  it('names the Mission to finish first', () => {
    const m = mapModel({ ...stretch1, missions: { 'mission-harness': started(at(9, 1)) } }, {}, at(20, 1));
    expect(lockMessage(find(m, 'theory-doorbell'), t)).toBe(t('map.lockedByMission').replace('{mission}', t('mission.harness.title')));
  });

  it('says the World is closed for a Stop in a locked World', () => {
    expect(lockMessage(find(mapModel(progressOf([]), {}, at(9)), 'walk-distraction'), t)).toBe(t('world.locked'));
  });

  it('gives no message for a Stop that can open', () => {
    expect(lockMessage(find(mapModel(progressOf([]), {}, at(9)), 'theory-harness'), t)).toBeNull();
  });
});

describe('waiting and badges', () => {
  it('says "Mañana", or "A las 07:50" when the 8 hours end after midnight', () => {
    expect(waitingLabel({ opensAt: at(0, 2), opensTomorrow: true }, t)).toBe('Mañana');
    expect(waitingLabel({ opensAt: at(7, 2, 50), opensTomorrow: false }, t)).toBe('A las 07:50');
    const m = mapModel({ ...stretch1, missions: { 'mission-harness': started(at(23, 1, 50)) } }, {}, at(0, 2, 10));
    expect(stopBadge(find(m, 'mission-harness'), t)).toBe('A las 07:50');
  });

  it('shows "Siguiente" on next-up and "¿Cómo fue?" on a due check-in', () => {
    expect(stopBadge(find(mapModel(stretch1, {}, at(9)), 'mission-harness'), t)).toBe(t('map.badgeNext'));
    const due = mapModel({ ...stretch1, missions: { 'mission-harness': started(at(9, 1)) } }, {}, at(9, 2));
    expect(stopBadge(find(due, 'mission-harness'), t)).toBe('¿Cómo fue?');
    expect(stopBadge(find(due, 'harness-ritual'), t)).toBeNull();
  });

  it('marks optional Lessons and "keep practising" Missions in text', () => {
    const legacy = mapModel(migrateRecord({ version: 6, completedNodes: ['harness-ritual', 'doorbell-mat'] }), {}, at(9));
    expect(stopMarks(find(legacy, 'theory-doorbell'), t)).toEqual([t('map.optional')]);
    const moved = mapModel({ ...stretch1, missions: { 'mission-harness': { ...started(at(9, 1)), passedOn: '2026-05-03', keepPractising: true } } }, {}, at(9, 4));
    expect(stopMarks(find(moved, 'mission-harness'), t)).toEqual([t('map.keepPractising')]);
  });
});

describe('Stop accessibility labels', () => {
  it('announces "Misión" with the Mission title and its state', () => {
    const label = stopAccessibilityLabel(find(mapModel(stretch1, {}, at(9)), 'mission-harness'), t);
    expect(label.startsWith('Misión. ')).toBe(true);
    expect(label).toContain(t('mission.harness.title'));
    expect(label).toContain(t('map.nodeNext'));
  });

  it('names every kind, so it never relies on the glyph', () => {
    const m = mapModel(progressOf([]), {}, at(9));
    expect(stopAccessibilityLabel(find(m, 'theory-harness'), t)).toContain('Teoría');
    expect(stopAccessibilityLabel(find(m, 'howto-tap-hold'), t)).toContain('Cómo se juega');
    expect(stopAccessibilityLabel(find(m, 'harness-ritual'), t)).toContain(t('map.stop.node'));
  });

  it('says when a waiting Mission opens', () => {
    const m = mapModel({ ...stretch1, missions: { 'mission-harness': started(at(9, 1)) } }, {}, at(20, 1));
    expect(stopAccessibilityLabel(find(m, 'mission-harness'), t)).toContain(`${t('map.waiting')}: Mañana`);
  });
});

describe('World subtitles and unlock banners', () => {
  it('formats Stop progress and the preview planned count', () => {
    const m = mapModel(stretch1, {}, at(9));
    expect(worldWalkSubtitle(m.worlds[0], t)).toBe('3 de 10 paradas');
    expect(worldWalkSubtitle(m.worlds.find((w) => w.world.id === 'recall')!, t)).toBe('4 paradas planificadas');
  });

  it('names the final missing Stop and the World in the banner', () => {
    const m = mapModel(migrateRecord({ version: 7, completedNodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'], readLessons: ['theory-harness', 'howto-tap-hold', 'theory-doorbell', 'theory-poste'], missions: { 'mission-harness': { target: 'full', skipRun: 0, attempts: [], passedOn: '2026-05-01' }, 'mission-doorbell': { target: 'full', skipRun: 0, attempts: [], passedOn: '2026-05-01' } } }), {}, at(9));
    const sidewalk = m.worlds.find((w) => w.world.id === 'sidewalk')!;
    expect(worldUnlockBanner(sidewalk, t)).toContain(t('mission.poste.title'));
    expect(worldUnlockBanner(sidewalk, t)).toContain(t('world.1.title'));
  });

  it('formats the plus banner for plus worlds', () => {
    const recall = mapModel(progressOf([]), {}, at(9)).worlds.find((w) => w.world.id === 'recall')!;
    expect(worldUnlockBanner(recall, t)).toBe(t('world.unlockPlus'));
  });
});

describe('Stop visuals', () => {
  it('gives each state a distinct glyph/ring combination so colour is never the only cue', () => {
    const seen = (['locked', 'open', 'next', 'waiting', 'done'] as const).map((s) => `${nodeVisual(s, 'mission').glyph}|${nodeVisual(s, 'mission').ring}`);
    expect(new Set(seen).size).toBe(5);
    expect(nodeVisual('locked').glyph).toBe('lock');
    expect(nodeVisual('done').glyph).toBe('check');
    expect(nodeVisual('waiting', 'mission').glyph).toBe('moon');
  });

  it('draws a single next-up ring', () => {
    expect((['locked', 'open', 'next', 'waiting', 'done'] as const).filter((s) => nodeVisual(s).ring)).toEqual(['next']);
  });
});
