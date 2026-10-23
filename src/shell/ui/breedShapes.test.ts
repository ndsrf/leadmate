import { BREEDS } from '../onboarding/breeds';
import { BREED_SHAPES, BREED_VIEW, FIT_PIVOT, GROUND_Y, artBreed, extentOf, fitScale, geometryOf } from './breedShapes';

describe('breed silhouettes', () => {
  it('has a shape for every breed in the catalog', () => {
    for (const b of BREEDS) expect(BREED_SHAPES[b.id]).toBeDefined();
  });

  it('draws Otra raza as a Mestizo', () => {
    expect(artBreed('otra')).toBe('mestizo');
    expect(artBreed('teckel')).toBe('teckel');
  });

  it.each(BREEDS.map((b) => [b.id]))('keeps %s inside the view once fitted', (id) => {
    const s = BREED_SHAPES[id];
    const e = extentOf(s);
    const k = fitScale(s);
    expect(k).toBeGreaterThan(0.7);
    expect(k).toBeLessThanOrEqual(1);
    expect(FIT_PIVOT.y - (FIT_PIVOT.y - e.top) * k).toBeGreaterThanOrEqual(0);
    expect(FIT_PIVOT.x + (e.right - FIT_PIVOT.x) * k).toBeLessThanOrEqual(BREED_VIEW.w);
    expect(FIT_PIVOT.x - (FIT_PIVOT.x - e.left) * k).toBeGreaterThanOrEqual(0);
    expect(geometryOf(s).bodyCy + s.bodyRy).toBeLessThan(GROUND_Y + 6);
  });

  it('tells breeds apart by build: a Teckel is long and low, a Podenco tall', () => {
    expect(BREED_SHAPES.teckel.legH).toBeLessThan(BREED_SHAPES.labrador.legH);
    expect(BREED_SHAPES.teckel.bodyRx).toBeGreaterThan(BREED_SHAPES.chihuahua.bodyRx);
    expect(BREED_SHAPES.podenco.legH).toBeGreaterThan(BREED_SHAPES.labrador.legH);
  });
});
