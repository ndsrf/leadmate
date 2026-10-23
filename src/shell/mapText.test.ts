import { createTranslator } from '../i18n';
import { lockMessage, worldUnlockBanner, worldWalkSubtitle } from './mapText';
import { mapModel } from './mapModel';
import { nodeVisual } from './ui/mapLayout';

const t = createTranslator();
const find = (m: ReturnType<typeof mapModel>, id: string) => m.worlds.flatMap((w) => w.nodes).find((n) => n.node.id === id)!;

describe('lock reason', () => {
  const m = mapModel([], {});

  it('names the missing prerequisite Nodes', () => {
    const msg = lockMessage(find(m, 'doorbell-mat'), t)!;
    expect(msg).toContain(t('map.lockedBy'));
    expect(msg).toContain(t(find(m, 'harness-ritual').node.title));
  });

  it('says the World is closed for a Node in a locked World', () => {
    expect(lockMessage(find(m, 'walk-distraction'), t)).toBe(t('world.locked'));
  });

  it('gives no message for a Node that can start', () => {
    expect(lockMessage(find(m, 'harness-ritual'), t)).toBeNull();
  });
});

describe('World subtitles and unlock banners', () => {
  it('formats walk progress and preview planned count', () => {
    const m = mapModel(['harness-ritual'], {});
    expect(worldWalkSubtitle(m.worlds[0], t)).toBe('1 de 3 paseos');
    const recall = m.worlds.find((w) => w.world.id === 'recall')!;
    expect(worldWalkSubtitle(recall, t)).toBe('4 paseos planificados');
  });

  it('formats prerequisite unlock banner naming the final node when close', () => {
    const m = mapModel(['harness-ritual', 'doorbell-mat'], {});
    const sidewalk = m.worlds.find((w) => w.world.id === 'sidewalk')!;
    expect(worldUnlockBanner(sidewalk, t)).toContain(t('node.poste.title'));
    expect(worldUnlockBanner(sidewalk, t)).toContain(t('world.1.title'));
  });

  it('formats plus unlock banner for plus worlds', () => {
    const m = mapModel([], {});
    const recall = m.worlds.find((w) => w.world.id === 'recall')!;
    expect(worldUnlockBanner(recall, t)).toBe(t('world.unlockPlus'));
  });
});

describe('Node visuals', () => {
  it('gives each state a distinct glyph/ring combination so colour is never the only cue', () => {
    const seen = (['locked', 'open', 'next', 'done'] as const).map((s) => `${nodeVisual(s).glyph}|${nodeVisual(s).ring}`);
    expect(new Set(seen).size).toBe(4);
    expect(nodeVisual('locked').glyph).toBe('lock');
    expect(nodeVisual('done').glyph).toBe('check');
    expect(nodeVisual('next').ring).toBe(true);
    expect(nodeVisual('open').ring).toBe(false);
  });

  it('draws a single next-up ring', () => {
    expect((['locked', 'open', 'next', 'done'] as const).filter((s) => nodeVisual(s).ring)).toEqual(['next']);
  });
});
