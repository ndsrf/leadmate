import { newDogRecord, type DogRecord } from '../dogRecord';
import { resolve } from './merge';

const rec = (over: Partial<DogRecord>): DogRecord => ({ ...newDogRecord(), ...over });
const at = (updatedAt: string) => ({ updatedAt });

describe('resolve', () => {
  it('lets the later updatedAt win whole, never blending Learning Attributes', () => {
    const local = rec({ ...at('2026-05-02T00:00:00.000Z'), attributes: { reconnectionLatency: 0.9, reactivityThreshold: 0.1, followChance: 0.1, checkInFrequency: 0.1 }, equipment: 'collar' });
    const remote = rec({ ...at('2026-05-03T00:00:00.000Z'), attributes: { reconnectionLatency: 0.1, reactivityThreshold: 0.9, followChance: 0.9, checkInFrequency: 0.9 }, equipment: 'harness' });
    for (const merged of [resolve(local, remote), resolve(remote, local)]) {
      expect(merged.attributes).toEqual(remote.attributes);
      expect(merged.equipment).toBe('harness');
      expect(merged.updatedAt).toBe(remote.updatedAt);
    }
  });

  it('keeps local on a tie', () => {
    const local = rec({ ...at('2026-05-02T00:00:00.000Z'), equipment: 'collar' });
    const remote = rec({ ...at('2026-05-02T00:00:00.000Z'), equipment: 'harness' });
    expect(resolve(local, remote).equipment).toBe('collar');
  });

  it('unions Walk Diary entries by date and Node', () => {
    const a = { date: '2026-05-01', nodeId: 'poste-practice', outcome: 'completed' } as const;
    const b = { date: '2026-05-02', nodeId: 'walk-distraction', outcome: 'struggled' } as const;
    const merged = resolve(rec({ ...at('2026-05-03T00:00:00.000Z'), walkDiary: [a] }), rec({ ...at('2026-05-01T00:00:00.000Z'), walkDiary: [b, { ...a, outcome: 'skipped' }] }));
    expect(merged.walkDiary).toEqual([a, b]);
  });

  it('unions completed Nodes', () => {
    const merged = resolve(rec({ completedNodes: ['a', 'b'], ...at('2026-05-02T00:00:00.000Z') }), rec({ completedNodes: ['b', 'c'], ...at('2026-05-01T00:00:00.000Z') }));
    expect(merged.completedNodes.sort()).toEqual(['a', 'b', 'c']);
  });

  it('keeps the best Daily Stage score per date', () => {
    const merged = resolve(rec({ dailyBest: { '2026-05-01': 400, '2026-05-02': 900 }, ...at('2026-05-02T00:00:00.000Z') }), rec({ dailyBest: { '2026-05-01': 700, '2026-05-03': 100 }, ...at('2026-05-01T00:00:00.000Z') }));
    expect(merged.dailyBest).toEqual({ '2026-05-01': 700, '2026-05-02': 900, '2026-05-03': 100 });
  });

  it('keeps the run that was active later and the best of both bests', () => {
    const merged = resolve(
      rec({ streak: { current: 2, best: 5, lastActiveDate: '2026-05-01' }, ...at('2026-05-03T00:00:00.000Z') }),
      rec({ streak: { current: 4, best: 4, lastActiveDate: '2026-05-04' }, ...at('2026-05-01T00:00:00.000Z') }),
    );
    expect(merged.streak).toEqual({ current: 4, best: 5, lastActiveDate: '2026-05-04' });
  });

  it('raises best to the current run when the current run beats both', () => {
    const merged = resolve(rec({ streak: { current: 7, best: 3, lastActiveDate: '2026-05-04' } }), rec({ streak: { current: 1, best: 2, lastActiveDate: '2026-05-01' } }));
    expect(merged.streak.best).toBe(7);
  });

  it('gives the same result when the copies are identical', () => {
    const r = rec({ completedNodes: ['a'], dailyBest: { '2026-05-01': 5 }, ...at('2026-05-02T00:00:00.000Z') });
    expect(resolve(r, r)).toEqual(r);
  });
});
