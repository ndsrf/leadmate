import * as path from 'path';
import { loadPackFromDisk } from './loader';
import { resolvePack } from './resolver';
import type { ContentPack } from './validator';

const BETA = path.join(__dirname, '../../../content/beta');
const STABLE = path.join(__dirname, '../../../content/stable');

function clone(pack: ContentPack): ContentPack {
  return structuredClone(pack);
}

describe('seed games: manta-buscadora shop link (task 7.4)', () => {
  const pack = loadPackFromDisk(BETA);

  it('ships the six seed games, one of them free', () => {
    const resolved = resolvePack(pack, 'es');
    expect(resolved.games.map((g) => g.id)).toEqual([
      'eleccion-mano',
      'manta-enrollada',
      'pienso-a-oscuras',
      'manta-buscadora',
      'trilero',
      'escalon-azul',
    ]);
    expect(resolved.games.filter((g) => g.free).map((g) => g.id)).toEqual(['eleccion-mano']);
  });

  it('hides the link while mantas-olfativas has no visible product', () => {
    const empty = clone(pack);
    empty.shop!.subcategories!['mantas-olfativas'].config.products = [];
    for (const lang of ['es', 'en']) {
      const game = resolvePack(empty, lang).games.find((g) => g.id === 'manta-buscadora')!;
      expect(game.needs).toBeUndefined();
    }
  });

  it('shows the link once the subcategory has a product', () => {
    const withProduct = clone(pack);
    withProduct.shop!.subcategories!['mantas-olfativas'].config.products = [];
    withProduct.shop!.subcategories!['mantas-olfativas'].config.products = ['manta-fixture'];
    withProduct.shop!.products!['manta-fixture'] = {
      config: {
        id: 'manta-fixture',
        source: 'manual',
        urls: { es: 'https://example.com/manta', en: 'https://example.com/manta' },
      } as never,
      text: { es: { name: 'Manta de prueba', description: 'Fixture' } as never },
    };
    for (const lang of ['es', 'en']) {
      const resolved = resolvePack(withProduct, lang);
      const game = resolved.games.find((g) => g.id === 'manta-buscadora')!;
      expect(game.needs).toEqual([
        expect.objectContaining({ target: 'mantas-olfativas', targetKind: 'subcategory' }),
      ]);
      expect(resolved.catalog[game.needs![0].note!]).toBeTruthy();
    }
  });

  describe.each([
    ['stable', STABLE],
    ['beta', BETA],
  ])('real %s pack', (_name, dir) => {
    const real = loadPackFromDisk(dir);

    it.each(['es', 'en'])('links manta-buscadora to the snuffle mats under Juegos (%s)', (lang) => {
      const resolved = resolvePack(real, lang);
      const game = resolved.games.find((g) => g.id === 'manta-buscadora')!;
      expect(game.needs).toEqual([
        expect.objectContaining({ target: 'mantas-olfativas', targetKind: 'subcategory' }),
      ]);
      const category = resolved.shop.categories.find((c) => c.subcategories.some((s) => s.id === 'mantas-olfativas'))!;
      expect(category.id).toBe('juegos');
      expect(real.shop!.categories!.comida.config.subcategories).not.toContain('mantas-olfativas');
      const sub = category.subcategories.find((s) => s.id === 'mantas-olfativas')!;
      expect(sub.products.map((p) => p.id)).toEqual(['alfombra-olfativa-staranry']);
      expect(sub.products[0].url).toBe('https://amzn.eu/d/0cmfg6E9');
    });
  });
});
