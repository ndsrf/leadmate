import { createTicker } from './ticker';

describe('createTicker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('ticks with the seconds since the last tick', () => {
    let clock = 0;
    const dts: number[] = [];
    const ticker = createTicker(50, (dt) => dts.push(dt), 0.2, () => clock);
    ticker.start();
    for (let i = 0; i < 3; i++) {
      clock += 50;
      jest.advanceTimersByTime(50);
    }
    ticker.stop();
    expect(dts).toEqual([0.05, 0.05, 0.05]);
  });

  it('stops ticking, and does not count the stopped time when started again', () => {
    let clock = 0;
    const dts: number[] = [];
    const ticker = createTicker(50, (dt) => dts.push(dt), 0.2, () => clock);
    ticker.start();
    clock += 50;
    jest.advanceTimersByTime(50);
    ticker.stop();
    clock += 60_000;
    jest.advanceTimersByTime(60_000);
    expect(dts).toHaveLength(1);
    ticker.start();
    clock += 50;
    jest.advanceTimersByTime(50);
    expect(dts).toEqual([0.05, 0.05]);
    ticker.stop();
  });

  it('caps a stalled step', () => {
    let clock = 0;
    const dts: number[] = [];
    const ticker = createTicker(50, (dt) => dts.push(dt), 0.2, () => clock);
    ticker.start();
    clock += 5000;
    jest.advanceTimersByTime(50);
    ticker.stop();
    expect(dts).toEqual([0.2]);
  });

  it('ignores a second start', () => {
    let clock = 0;
    let ticks = 0;
    const ticker = createTicker(50, () => ticks++, 0.2, () => clock);
    ticker.start();
    ticker.start();
    jest.advanceTimersByTime(50);
    ticker.stop();
    expect(ticks).toBe(1);
  });
});
