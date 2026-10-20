import { defaultScenario, type ScenarioConfig } from './config';
import { closestOnSegment } from './geometry';
import { distance } from './vec';
import { requiredProps, scatterScenery, THEME_PROPS, validateScenario } from './scenery';

const base = (o: Partial<ScenarioConfig> = {}): ScenarioConfig => ({ ...defaultScenario, ...o });

describe('scenario validation', () => {
  it('accepts the default outdoor scenario', () => expect(validateScenario(defaultScenario)).toEqual([]));

  it('accepts an indoor hallway with walls', () => {
    const route = [{ x: 0, y: 0 }, { x: 12, y: 0 }];
    const walls = [{ from: { x: -1, y: -1.5 }, to: { x: 13, y: -1.5 } }, { from: { x: -1, y: 1.5 }, to: { x: 13, y: 1.5 } }];
    const config = base({ theme: 'indoor_apartment', world: 1, walls, waypoint: route[1], scenery: scatterScenery('indoor_apartment', route, 3, walls, { offset: { min: 1.6, max: 2.4 } }) });
    expect(validateScenario(config)).toEqual([]);
  });

  it('rejects a bare route', () => {
    const errors = validateScenario(base({ scenery: [] }));
    expect(errors.join()).toMatch(/route needs at least 18/);
  });

  it('needs one prop per 5 m of route and at least 8', () => {
    expect(requiredProps(10)).toBe(8);
    expect(requiredProps(40)).toBe(8);
    expect(requiredProps(90)).toBe(18);
    expect(requiredProps(91)).toBe(19);
    const short = base({ waypoint: { x: 10, y: 0 }, scenery: scatterScenery('quiet_suburb', [{ x: 0, y: 0 }, { x: 10, y: 0 }], 1).slice(0, 7) });
    expect(validateScenario(short)).not.toEqual([]);
    expect(validateScenario({ ...short, scenery: scatterScenery('quiet_suburb', [{ x: 0, y: 0 }, { x: 10, y: 0 }], 1) })).toEqual([]);
  });

  it('counts the whole corridor, not just the straight line to the end', () => {
    const waypoints = [{ x: 0, y: 40 }];
    const waypoint = { x: 40, y: 40 };
    const route = [{ x: 0, y: 0 }, ...waypoints, waypoint];
    const eight = scatterScenery('quiet_suburb', route, 1).slice(0, 8);
    expect(validateScenario(base({ waypoints, waypoint, scenery: eight }))).not.toEqual([]); // 80 m needs 16
  });

  it('rejects props that do not belong to the theme', () => {
    const scenery = defaultScenario.scenery.map((p, i) => (i === 0 ? { ...p, type: 'parked_car' } : p));
    expect(validateScenario(base({ scenery })).join()).toMatch(/does not belong to the quiet_suburb theme/);
  });

  it('rejects a route that goes through a wall and a wall with no length', () => {
    expect(validateScenario(base({ walls: [{ from: { x: 40, y: -5 }, to: { x: 40, y: 5 } }] })).join()).toMatch(/goes through a wall/);
    expect(validateScenario(base({ walls: [{ from: { x: 40, y: 5 }, to: { x: 40, y: 5 } }] })).join()).toMatch(/no length/);
  });
});

describe('scatterScenery', () => {
  const route = [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 40 }];

  it('is the same for the same seed and differs for another', () => {
    expect(scatterScenery('urban_street', route, 5)).toEqual(scatterScenery('urban_street', route, 5));
    expect(scatterScenery('urban_street', route, 5)).not.toEqual(scatterScenery('urban_street', route, 6));
  });

  it.each(Object.keys(THEME_PROPS) as (keyof typeof THEME_PROPS)[])('meets the density rule and its own theme for %s', (theme) => {
    const items = scatterScenery(theme, route, 9);
    expect(items.length).toBeGreaterThanOrEqual(requiredProps(100));
    expect(items.every((p) => THEME_PROPS[theme].includes(p.type))).toBe(true);
  });

  it('keeps props off the route and out of walls', () => {
    const wall = { from: { x: 20, y: 4 }, to: { x: 40, y: 4 } };
    const items = scatterScenery('quiet_suburb', route, 2, [wall]);
    for (const p of items) {
      const toRoute = Math.min(...route.slice(1).map((r, i) => distance(closestOnSegment(p.pos, route[i], r), p.pos)));
      expect(toRoute).toBeGreaterThanOrEqual(2.9);
      expect(distance(closestOnSegment(p.pos, wall.from, wall.to), p.pos)).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('makes parked cars visual shields', () => {
    const cars = scatterScenery('urban_street', route, 4, [], { types: ['parked_car'] });
    expect(cars.length).toBeGreaterThan(0);
    expect(cars.every((c) => c.visualShield === true)).toBe(true);
  });
});
