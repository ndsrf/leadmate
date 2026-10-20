import { readFileSync } from 'fs';
import { join } from 'path';
import { defaultScenario } from '../../sim/config';
import { newSeed } from '../../sim/rng';
import { buildPayload } from '../../sim/payload';
import { createState, tick, noInput } from '../../sim/sim';
import { generateDailyStage } from '../daily';
import type { KeyValueStore } from '../dogRecord';
import { HALLWAY } from '../nodes/scenarios';
import { fetchLevelConfigs, isValidConfig, loadConfigCache, resolveScenario, type ConfigSource } from './configs';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
}

const valid = { ...HALLWAY, leashLength: 4 };
const invalid = { ...HALLWAY, theme: 'moon' };
const source = (rows: Awaited<ReturnType<ConfigSource['fetchLevelConfigs']>>): ConfigSource => ({ fetchLevelConfigs: async () => rows });
const unreachable: ConfigSource = { fetchLevelConfigs: async () => Promise.reject(new Error('offline')) };

describe('remote level configs', () => {
  it('accepts the bundled configs and rejects broken ones', () => {
    expect(isValidConfig(HALLWAY)).toBe(true);
    expect(isValidConfig(invalid)).toBe(false);
    expect(isValidConfig({ ...HALLWAY, walls: 'none' })).toBe(false);
    expect(isValidConfig('x')).toBe(false);
    expect(isValidConfig(null)).toBe(false);
    expect(isValidConfig([])).toBe(false);
  });

  it('uses a valid remote config and records its version', async () => {
    const store = memoryStore();
    const cache = await fetchLevelConfigs(source([{ id: 'hall', version: 3, config: valid, published: true }]), store);
    const r = resolveScenario('hall', HALLWAY, cache);
    expect(r.configVersion).toBe('3');
    expect(r.scenario.leashLength).toBe(4);
    expect(r.scenario.configVersion).toBe('3');
    expect(await loadConfigCache(store)).toEqual(cache);
  });

  it('keeps the newest version and skips unpublished ones', async () => {
    const cache = await fetchLevelConfigs(
      source([
        { id: 'hall', version: 1, config: valid, published: true },
        { id: 'hall', version: 2, config: { ...valid, leashLength: 5 }, published: true },
        { id: 'hall', version: 9, config: { ...valid, leashLength: 6 }, published: false },
      ]),
      memoryStore(),
    );
    expect(cache.hall.version).toBe(2);
  });

  it('falls back silently to the bundled config when offline', async () => {
    const r = resolveScenario('hall', HALLWAY, await fetchLevelConfigs(unreachable, memoryStore()));
    expect(r).toEqual({ scenario: { ...HALLWAY, configVersion: 'bundled' }, configVersion: 'bundled' });
  });

  it('falls back to bundled when the remote config is invalid, and never caches it', async () => {
    const store = memoryStore();
    const cache = await fetchLevelConfigs(source([{ id: 'hall', version: 4, config: invalid, published: true }]), store);
    expect(cache).toEqual({});
    expect(resolveScenario('hall', HALLWAY, cache).configVersion).toBe('bundled');
  });

  it('keeps the last good cache when a later fetch fails', async () => {
    const store = memoryStore();
    await fetchLevelConfigs(source([{ id: 'hall', version: 3, config: valid, published: true }]), store);
    const cache = await fetchLevelConfigs(unreachable, store);
    expect(resolveScenario('hall', HALLWAY, cache).configVersion).toBe('3');
  });

  it('does nothing without a backend', async () => {
    expect(await fetchLevelConfigs(null, memoryStore())).toEqual({});
  });

  it('records the version in the Stage payload', () => {
    const run = (configVersion: string) => {
      const s = createState(newSeed(), { ...defaultScenario, configVersion });
      s.ended = true;
      tick(s, noInput);
      return buildPayload(s).configVersion;
    };
    expect(run('bundled')).toBe('bundled');
    expect(run('7')).toBe('7');
  });

  it('is never used by Daily Stages', () => {
    expect(generateDailyStage('2026-05-01').configVersion ?? 'bundled').toBe('bundled');
    const daily = readFileSync(join(__dirname, '..', 'daily.ts'), 'utf8');
    expect(daily).not.toMatch(/configs|resolveScenario|sync\//);
  });
});
