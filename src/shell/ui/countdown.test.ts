import { createCountdown } from './countdown';

describe('createCountdown', () => {
  it('reports each whole second once, not every 100 ms tick, and times out on time', () => {
    const seconds: number[] = [];
    let timeouts = 0;
    const c = createCountdown(5, (s) => seconds.push(s), () => timeouts++);
    let ticks = 0;
    while (!c.timedOut && ticks < 100) {
      c.tick(0.1);
      ticks++;
    }
    expect(seconds).toEqual([4, 3, 2, 1]); // 4 re-renders over 5 s, against 49 with one per tick
    expect(timeouts).toBe(1);
    expect(ticks).toBeGreaterThanOrEqual(50);
    expect(ticks).toBeLessThanOrEqual(51);
  });

  it('counts only the ticks it is given, so a background pause does not eat the time', () => {
    let timeouts = 0;
    const c = createCountdown(5, () => {}, () => timeouts++);
    for (let i = 0; i < 20; i++) c.tick(0.1); // 2 s, then the app is backgrounded: no ticks
    expect(c.timedOut).toBe(false);
    for (let i = 0; i < 31; i++) c.tick(0.1); // back in front: 3 s more
    expect(timeouts).toBe(1);
    c.tick(0.1);
    expect(timeouts).toBe(1);
  });
});
