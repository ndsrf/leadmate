import { validateScenario } from './scenery';
import { createState, tick, type SimInput } from './sim';
import { twoMetersScenario } from '../../test/twoMetersScenario';

describe('twoMetersScenario (Task 3.3 evidence)', () => {
  it('validates with zero errors', () => {
    const problems = validateScenario(twoMetersScenario);
    expect(problems).toEqual([]);
  });

  it('declares two Stage Meters: Nose and Connection', () => {
    expect(twoMetersScenario.meters).toHaveLength(2);
    expect(twoMetersScenario.meters?.[0].id).toBe('nose');
    expect(twoMetersScenario.meters?.[1].id).toBe('connection');
  });

  it('initializes meters at zero in simulation state and fills when actions happen', () => {
    const sim = createState(42, twoMetersScenario);
    expect(sim.meters).toEqual([
      { id: 'nose', value: 0, target: 30 },
      { id: 'connection', value: 0, target: 20 },
    ]);

    // Force a check-in hit to verify meter points are added
    sim.rewardWindow = {
      openedAt: sim.time,
      closesAt: sim.time + 1.0,
    };
    const input: SimInput = { direction: { x: 0, y: 0 }, strength: 0, marker: true, cue: false, sniff: false };
    const events = tick(sim, input, 1 / 60);

    const meterPointsEvents = events.filter((e) => e.type === 'meter-points');
    expect(meterPointsEvents.length).toBeGreaterThan(0);
    const connectionEvent = meterPointsEvents.find((e) => e.type === 'meter-points' && e.meterId === 'connection');
    expect(connectionEvent).toBeDefined();
    expect(connectionEvent && connectionEvent.type === 'meter-points' && connectionEvent.points).toBe(10);
    expect(sim.meters[1].value).toBe(10);
  });
});
