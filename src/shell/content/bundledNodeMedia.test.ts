// the inline scenes draw with react-native-svg, which jest cannot load; only their names matter here
jest.mock('../ui/lessonArt', () => ({ isLessonArt: (name: string) => ['leash', 'body', 'smile', 'marker', 'sniff', 'poster'].includes(name) }));

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { isImageDuelQuestion, type DuelImage } from '../nodes/content';
import { BASELINE_PACK } from './baseline.generated';
import { MediaResolver } from './mediaResolver';
import { NODE_MEDIA } from './nodeMediaRegistry';
import { resolvePack } from './resolver';

const ROOT = path.join(__dirname, '../../..');
const ASSETS = path.join(ROOT, 'assets/nodes');
const STABLE = path.join(ROOT, 'content/stable');

/** Every Image Duel image of the bundled stable baseline, in both languages, once each. */
function baselineDuelImages(): DuelImage[] {
  const seen = new Map<string, DuelImage>();
  for (const lang of ['es', 'en']) {
    for (const node of resolvePack(BASELINE_PACK, lang).nodes) {
      for (const q of node.checkpoint) {
        if (!isImageDuelQuestion(q)) continue;
        for (const image of q.images) seen.set(image.path, image);
      }
    }
  }
  return [...seen.values()];
}

const images = baselineDuelImages();

describe('bundled Node media (Image Duel pictures shown with no content host)', () => {
  it('the stable baseline has at least one Image Duel', () => {
    expect(images.length).toBeGreaterThanOrEqual(2);
  });

  it.each(images.map((i) => [i.path, i] as const))('%s resolves bundled with no store and no content host', async (_p, image) => {
    const resolver = new MediaResolver(null, null, undefined, undefined);
    const result = await resolver.resolveImage(image.art, { itemPath: image.itemPath, channel: 'stable' });
    expect(result.kind).toBe('bundled');
    expect(result.source).toBe(NODE_MEDIA[image.path]);
  });

  it.each(images.map((i) => [i.path] as const))('%s is bundled as the same bytes the stable pack ships', (p) => {
    const [, id, , file] = p.split('/');
    const bundled = path.join(ASSETS, id, file);
    expect(existsSync(bundled)).toBe(true);
    expect(readFileSync(bundled).equals(readFileSync(path.join(STABLE, p)))).toBe(true);
  });

  it('the registry lists exactly the PNGs in assets/nodes (re-run scripts/render-lesson-art.mjs after a change)', () => {
    const files = readdirSync(ASSETS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => readdirSync(path.join(ASSETS, d.name)).filter((f) => f.endsWith('.png')).map((f) => `nodes/${d.name}/media/${f}`))
      .sort();
    expect(Object.keys(NODE_MEDIA).sort()).toEqual(files);
  });
});
