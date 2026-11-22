// the inline scenes draw with react-native-svg, which jest cannot load; only their names matter here
jest.mock('../ui/lessonArt', () => ({ isLessonArt: (name: string) => ['leash', 'body', 'smile', 'marker', 'sniff', 'poster'].includes(name) }));

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { BASELINE_PACK } from './baseline.generated';
import { MediaResolver } from './mediaResolver';
import { PACK_MEDIA } from './packMediaRegistry';
import { resolvePack } from './resolver';

const ROOT = path.join(__dirname, '../../..');
const STABLE = path.join(ROOT, 'content/stable');

/** Every Dog Game picture of the bundled stable baseline, as the Games screens ask for it: file + game folder. */
const games = [...new Map(resolvePack(BASELINE_PACK, 'es').games.flatMap((g) => (g.images ?? []).map((i) => [i.path, { id: g.id, file: i.file, path: i.path }] as const))).values()];
/** Every Shop product picture of the bundled stable baseline, as the Shop asks for it: the product.yaml `image` + product folder. */
const products = Object.entries(BASELINE_PACK.shop?.products ?? {})
  .filter(([, p]) => p.config?.image)
  .map(([id, p]) => ({ id, image: p.config.image as string }));

/** Where gen-pack-media copies a pack path to: games/<id>/media/<f> → assets/games/<id>/<f>, shop/products/<id>/media/<f> → assets/shop/<id>/<f>. */
const assetOf = (packPath: string) => {
  const parts = packPath.split('/');
  const file = parts.pop()!;
  parts.pop(); // media
  const id = parts.pop()!;
  return path.join(ROOT, 'assets', parts[0] === 'games' ? 'games' : 'shop', id, file);
};

describe('bundled pack media (Dog Game and Shop pictures shown with no content host)', () => {
  it('the stable baseline has the first batch of game illustrations and product pictures', () => {
    expect(games.length).toBeGreaterThanOrEqual(6);
    expect(products.length).toBeGreaterThanOrEqual(2);
  });

  it.each(games.map((g) => [g.path, g] as const))('game %s resolves bundled with no store and no content host', async (p, g) => {
    const resolver = new MediaResolver(null, null, undefined, '');
    const result = await resolver.resolveImage(g.file, { itemPath: `games/${g.id}`, channel: 'stable' });
    expect(result.kind).toBe('bundled');
    expect(result.source).toBe(PACK_MEDIA[p]);
  });

  it.each(products.map((p) => [p.id, p] as const))('product %s resolves bundled with no store and no content host', async (_id, p) => {
    const resolver = new MediaResolver(null, null, undefined, '');
    const result = await resolver.resolveImage(p.image, { itemPath: `shop/products/${p.id}`, channel: 'stable' });
    expect(result.kind).toBe('bundled');
    expect(result.source).toBeDefined();
    expect(Object.values(PACK_MEDIA)).toContain(result.source);
  });

  it('the registry lists exactly the pictures in the stable games and products media folders (re-run npm run gen:pack-media)', () => {
    const list = (kind: string) => {
      const dir = path.join(STABLE, kind);
      return existsSync(dir)
        ? readdirSync(dir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, 'media')))
            .flatMap((d) => readdirSync(path.join(dir, d.name, 'media')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).map((f) => `${kind}/${d.name}/media/${f}`))
        : [];
    };
    expect(Object.keys(PACK_MEDIA).sort()).toEqual([...list('games'), ...list('shop/products')].sort());
  });

  it.each(Object.keys(PACK_MEDIA).map((p) => [p] as const))('%s is bundled as the same bytes the stable pack ships', (p) => {
    const bundled = assetOf(p);
    expect(existsSync(bundled)).toBe(true);
    expect(readFileSync(bundled).equals(readFileSync(path.join(STABLE, p)))).toBe(true);
  });

  it('an installed pack file still wins over the bundled copy (later updates replace the first batch)', async () => {
    const g = games[0];
    const store = { getActiveDir: () => '/content/stable/active' } as any;
    const files = { exists: async (p: string) => p === `/content/stable/active/${g.path}` } as any;
    const result = await new MediaResolver(store, files, undefined, '').resolveImage(g.file, { itemPath: `games/${g.id}`, channel: 'stable' });
    expect(result.kind).toBe('local');
    expect(result.uri).toBe(`/content/stable/active/${g.path}`);
  });
});
