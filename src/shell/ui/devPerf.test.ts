import { devPerfSnapshot, resetDevPerf, setDevAppState, setDevPerfEnabled, setDevScreen, trackLoop, trackTimer } from './devPerf';

describe('devPerf', () => {
  beforeEach(() => {
    setDevPerfEnabled(true);
    resetDevPerf();
  });
  afterAll(() => setDevPerfEnabled(null));

  it('reports a started and a cancelled loop', () => {
    const stop = trackLoop('avatar');
    expect(devPerfSnapshot().loops).toEqual(['avatar']);
    stop();
    expect(devPerfSnapshot().loops).toEqual([]);
  });

  it('counts the same id twice and ignores a second stop', () => {
    const a = trackLoop('prop');
    const b = trackLoop('prop');
    a();
    a();
    expect(devPerfSnapshot().loops).toEqual(['prop']);
    b();
    expect(devPerfSnapshot().loops).toEqual([]);
  });

  it('tracks timers, screen and app state', () => {
    const stop = trackTimer('ticker');
    setDevScreen('map');
    setDevAppState('active');
    expect(devPerfSnapshot()).toEqual({ loops: [], timers: ['ticker'], screen: 'map', appState: 'active' });
    stop();
    expect(devPerfSnapshot().timers).toEqual([]);
  });

  it('keeps nothing when the production flag removes it', () => {
    setDevPerfEnabled(false);
    const stop = trackLoop('avatar');
    trackTimer('ticker');
    setDevScreen('map');
    expect(devPerfSnapshot()).toEqual({ loops: [], timers: [], screen: '-', appState: '-' });
    stop();
  });

  it('is off when __DEV__ is false', () => {
    setDevPerfEnabled(null);
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    trackLoop('avatar');
    expect(devPerfSnapshot().loops).toEqual([]);
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    trackLoop('avatar');
    expect(devPerfSnapshot().loops).toEqual(['avatar']);
    delete (globalThis as { __DEV__?: boolean }).__DEV__;
  });
});
