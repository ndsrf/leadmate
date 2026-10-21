import { defaultScenario, type ScenarioConfig } from './config';
import { closestOnSegment } from './geometry';
import { distance } from './vec';
import { CORRIDOR_HALF_WIDTH, layoutGround, GROUND_ZONES, MIN_PROP_TYPES, PROP_SHAPES, propWalls, requiredIndoorProps, requiredProps, scatterScenery, scatterSetPieces, segmentDistance, THEME_PROPS, validateScenario } from './scenery';

const base = (o: Partial<ScenarioConfig> = {}): ScenarioConfig => ({ ...defaultScenario, ...o });

describe('scenario validation', () => {
  it('accepts the default outdoor scenario', () => expect(validateScenario(defaultScenario)).toEqual([]));

  it('accepts an indoor hallway with walls', () => {
    const route = [{ x: 0, y: 0 }, { x: 12, y: 0 }];
    const walls = [{ from: { x: -1, y: -1.5 }, to: { x: 13, y: -1.5 } }, { from: { x: -1, y: 1.5 }, to: { x: 13, y: 1.5 } }];
    const config = base({ theme: 'indoor_apartment', world: 1, walls, waypoint: route[1], scenery: scatterScenery('indoor_apartment', route, 3, walls, { offset: { min: 0.95, max: 1.25 } }) });
    expect(validateScenario(config)).toEqual([]);
  });

  it('rejects a bare route', () => {
    const errors = validateScenario(base({ scenery: [] }));
    expect(errors.join()).toMatch(/needs at least 30/);
  });

  it('needs one prop per 3 m of route and at least 12 outdoors', () => {
    expect(requiredProps(10)).toBe(12);
    expect(requiredProps(36)).toBe(12);
    expect(requiredProps(90)).toBe(30);
    expect(requiredProps(91)).toBe(31);
    const short = base({ waypoint: { x: 10, y: 0 }, scenery: scatterScenery('quiet_suburb', [{ x: 0, y: 0 }, { x: 10, y: 0 }], 1).slice(0, 11) });
    expect(validateScenario(short)).not.toEqual([]);
    expect(validateScenario({ ...short, scenery: scatterScenery('quiet_suburb', [{ x: 0, y: 0 }, { x: 10, y: 0 }], 1) })).toEqual([]);
  });

  it('counts the whole corridor, not just the straight line to the end', () => {
    const waypoints = [{ x: 0, y: 40 }];
    const waypoint = { x: 40, y: 40 };
    const route = [{ x: 0, y: 0 }, ...waypoints, waypoint];
    const few = scatterScenery('quiet_suburb', route, 1).slice(0, 12);
    expect(validateScenario(base({ waypoints, waypoint, scenery: few }))).not.toEqual([]); // 80 m needs 27
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
      expect(toRoute).toBeGreaterThanOrEqual(CORRIDOR_HALF_WIDTH);
      const gap = Math.min(...propWalls([p]).map((w) => segmentDistance(w.from, w.to, wall.from, wall.to)));
      expect(gap === Infinity || gap >= 0.1).toBe(true);
    }
  });

  it('makes parked cars visual shields', () => {
    const cars = scatterScenery('urban_street', route, 4, [], { types: ['parked_car'] });
    expect(cars.length).toBeGreaterThan(0);
    expect(cars.every((c) => c.visualShield === true)).toBe(true);
  });
});

describe('solid scenery rules', () => {
  const route = [{ x: 0, y: 0 }, { x: 40, y: 0 }];
  const at = (type: string, x: number, y: number) => ({ type, pos: { x, y } });

  it('gives every theme at least 12 prop types, each with a shape', () => {
    for (const theme of Object.keys(THEME_PROPS) as (keyof typeof THEME_PROPS)[]) {
      expect(THEME_PROPS[theme].length).toBeGreaterThanOrEqual(12);
      for (const type of THEME_PROPS[theme]) expect(PROP_SHAPES[type]).toBeDefined();
    }
  });

  it('makes walkable props without collision walls and unknown types a small solid disc', () => {
    expect(propWalls([at('door', 3, 3), at('dog_bed', 3, 3)])).toEqual([]);
    expect(propWalls([at('mystery', 3, 3)])).toHaveLength(8);
  });

  it('puts a long prop on a segment along its angle', () => {
    const [w] = propWalls([{ ...at('bench', 10, 5), angle: Math.PI / 2 }]);
    expect(w.from.x).toBeCloseTo(10);
    expect(w.to.x).toBeCloseTo(10);
    expect(Math.abs(w.to.y - w.from.y)).toBeCloseTo(PROP_SHAPES.bench.length!);
  });

  it('uses at least 6 prop types in a scattered scenario, for any seed', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const items = scatterScenery('quiet_suburb', route, seed);
      expect(new Set(items.map((p) => p.type)).size).toBeGreaterThanOrEqual(MIN_PROP_TYPES);
    }
  });

  it('reports low variety', () => {
    const scenery = scatterScenery('quiet_suburb', route, 1, [], { types: ['tree'] });
    expect(validateScenario(base({ waypoint: route[1], scenery })).join()).toMatch(/prop types/);
  });

  it('keeps the route corridor clear, never overlaps and never sits on a start, for any seed', () => {
    for (const theme of Object.keys(THEME_PROPS) as (keyof typeof THEME_PROPS)[]) {
      for (let seed = 1; seed <= 20; seed++) {
        const r = [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 20 }];
        const config = base({ theme, waypoints: [r[1]], waypoint: r[2], scenery: scatterScenery(theme, r, seed) });
        expect(validateScenario(config)).toEqual([]);
        for (const w of propWalls(config.scenery)) {
          for (let i = 1; i < r.length; i++) expect(segmentDistance(r[i - 1], r[i], w.from, w.to)).toBeGreaterThanOrEqual(CORRIDOR_HALF_WIDTH);
        }
      }
    }
  });

  it('reports a solid that blocks a route leg, overlaps another solid, a wall or a start', () => {
    const scenery = scatterScenery('quiet_suburb', route, 1);
    const blocked = validateScenario(base({ waypoint: route[1], scenery: [...scenery, at('tree', 20, 0.2)] }));
    expect(blocked.join()).toMatch(/tree at \(20.0, 0.2\) blocks route leg 1/);
    const twice = validateScenario(base({ waypoint: route[1], scenery: [...scenery, at('tree', 20, 4), at('bush', 20.3, 4)] }));
    expect(twice.join()).toMatch(/overlaps bush/);
    const wall = { from: { x: 10, y: 6 }, to: { x: 30, y: 6 } };
    expect(validateScenario(base({ waypoint: route[1], walls: [wall], scenery: [...scenery, at('tree', 20, 6.1)] })).join()).toMatch(/overlaps a wall/);
    expect(validateScenario(base({ waypoint: route[1], scenery: [...scenery, at('tree', 0.3, 0.8)] })).join()).toMatch(/start position|blocks route/);
  });

  it('does not count walkable props in the overlap and corridor checks', () => {
    const scenery = scatterScenery('indoor_apartment', route, 1);
    const config = base({ theme: 'indoor_apartment', waypoint: route[1], scenery: [...scenery, at('dog_bed', 20, 0)] });
    expect(validateScenario(config)).toEqual([]);
  });

  it('counts indoor props by floor area with a minimum of 8', () => {
    expect(requiredIndoorProps(10)).toBe(8);
    expect(requiredIndoorProps(100)).toBe(17);
  });

  it('counts the hand-placed props toward the minimum', () => {
    const own = [at('bench', 8, 4), at('bin', 9.5, 4)];
    const total = own.length + scatterScenery('quiet_suburb', route, 3, [], { existing: own }).length;
    expect(total).toBe(requiredProps(40));
  });

  it('places set pieces as groups, deterministically, under the same rules', () => {
    const a = scatterSetPieces('urban_street', route, 7, [], 3);
    expect(a.length).toBeGreaterThan(0);
    expect(scatterSetPieces('urban_street', route, 7, [], 3)).toEqual(a);
    const config = base({ theme: 'urban_street', waypoint: route[1], scenery: [...a, ...scatterScenery('urban_street', route, 7, [], { existing: a })] });
    expect(validateScenario(config)).toEqual([]);
  });
});

describe('Ground Cover', () => {
  const route = [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 30 }];

  it('offers at least 3 surfaces per theme', () => {
    for (const zone of Object.values(GROUND_ZONES)) expect(new Set([zone.base, ...zone.surfaces]).size).toBeGreaterThanOrEqual(3);
  });

  it('is the same for the same seed and shows at least two surfaces', () => {
    for (const theme of Object.keys(GROUND_ZONES) as (keyof typeof GROUND_ZONES)[]) {
      const plan = layoutGround(theme, route, 5);
      expect(layoutGround(theme, route, 5)).toEqual(plan);
      expect(new Set([GROUND_ZONES[theme].base, ...plan.patches.map((p) => p.surface)]).size).toBeGreaterThanOrEqual(2);
    }
  });

  it('lays a rug in an indoor hallway', () => {
    const hall = [{ x: 0, y: 0 }, { x: 14, y: 0 }];
    for (let seed = 1; seed <= 10; seed++) {
      expect(layoutGround('indoor_apartment', hall, seed).decor.some((d) => d.kind === 'rug')).toBe(true);
    }
  });
});
